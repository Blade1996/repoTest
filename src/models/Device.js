'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const Terminal = require('./Terminal');
const { connected, disconnected } = require('./enums/state-conexion-devices-enums');
const { web, movil } = require('./enums/TypeDevice');
const { available, occupied } = require('./enums/session-status-terminal-enum');

class Device extends baseModel {
	static get tableName() {
		return 'com_devices';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_devices.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'com_devices.terminal_id',
					to: 'sal_terminals.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_devices.employee_id',
					to: 'com_employee.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['terminalId', 'employeeId', 'codeUser'],
			properties: {
				subsidiaryId: {
					type: 'integer',
				},
				warehouseId: {
					type: 'integer',
				},
				employeeId: {
					type: 'integer',
				},
				brandName: {
					type: ['string', 'null'],
				},
				licence: {
					type: ['string', 'null'],
				},
				stateConexion: {
					type: ['integer', 'null'],
				},
				warehouseName: {
					type: ['string', 'null'],
				},
				userName: {
					type: ['string', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				codeUser: {
					type: ['string', 'null'],
				},
				typeConexion: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				codeDevice: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['stateConexionName', 'typeConexionName'];
	}

	get stateConexionName() {
		let stateConexionName = '';
		if (this.stateConexion === connected) {
			stateConexionName = 'Conectado';
		} else if (this.stateConexion === disconnected) {
			stateConexionName = 'Desconectado';
		}
		return stateConexionName;
	}

	get typeConexionName() {
		let typeConexionName = '';
		if (this.typeConexion === web) {
			typeConexionName = 'Web';
		} else if (this.typeConexion === movil) {
			typeConexionName = 'Movil';
		}
		return typeConexionName;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'subsidiary_id',
			'warehouse_id',
			'employee_id',
			'brand_name',
			'licence',
			'state_conexion',
			'warehouse_name',
			'user_name',
			'terminal_id',
			'in_date',
			'code_user',
			'type_conexion',
			'additional_information',
			'code_device',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.eager('[terminal(selectColumns).series(selectColumns).typeDocument(documentTypeData), employee(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId)
			.skipUndefined()
			.where('state_conexion', filter.stateConexion)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('type_conexion', filter.typeDevice);

		if (filter.search) {
			const fields = ['brand_name', 'licence', 'warehouse_name', 'user_name', 'code_user'].map(i => `${this.tableName}.${i}`);
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByTerminal(companyId, { terminalId, stateConexion, codeDevice }, trx) {
		return this.query(trx)
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('terminal_id', terminalId)
			.skipUndefined()
			.where('state_conexion', stateConexion)
			.skipUndefined()
			.where('code_device', codeDevice);
	}

	static getByCodeDevice(companyId, codeDevice) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('code_device', codeDevice)
			.first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	async $afterInsert(queryContext) {
		try {
			if (this.terminalId && this.companyId) {
				await Terminal.edit(
					this.terminalId,
					{ sessionStatusId: occupied },
					this.companyId,
					queryContext.transaction,
				);
			}
			return this;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	async $afterUpdate(queryContext) {
		try {
			if (this.terminalId && this.companyId) {
				let sessionStatusId = this.stateConexion === connected ? occupied : available;
				let deviceTerminal;
				if (sessionStatusId === available) {
					deviceTerminal = await Device.getByTerminal(
						this.companyId,
						{
							terminalId: this.terminalId,
							stateConexion: connected,
						},
						queryContext.transaction,
					);
					if (deviceTerminal && deviceTerminal.length > 0) {
						sessionStatusId = occupied;
					}
				}
				await Terminal.edit(
					this.terminalId,
					{ sessionStatusId },
					this.companyId,
					queryContext.transaction,
				);
			}
			return this;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit({ id, data }, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editDisconnectByUser(codeUser, companyId, codeDevice) {
		return this.query()
			.patch({
				stateConexion: disconnected,
				employeeId: undefined,
				userName: undefined,
				terminalId: undefined,
				codeUser,
				additionalInformation: {},
			})
			.where('code_user', codeUser)
			.where('company_id', companyId)
			.skipUndefined()
			.where('code_device', codeDevice);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = Device;
