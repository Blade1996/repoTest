'use strict';

const { Model, transaction, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const Cash = require('./Cash');
const Series = require('./SalSeries');
const SalSeries = require('./SalSeries');
const TerminalUser = require('./TerminalUser');
const { available, occupied } = require('./enums/session-status-terminal-enum');
const ConextionDevice = require('./enums/state-conexion-devices-enums');
const TypeDevice = require('./enums/TypeDevice');
const { ecommerce: ecommerceTerminal } = require('./enums/type-terminals-enum');

class Terminal extends baseModel {
	static get tableName() {
		return 'sal_terminals';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId'],
			properties: {
				comSubsidiariesId: {
					type: 'integer',
				},
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				warWarehousesName: {
					type: ['string', 'null'],
				},
				salTypeTerminalsId: {
					type: 'integer',
				},
				typeTerminal: {
					type: 'integer',
				},
				name: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				code: {
					type: 'string',
				},
				sunatCode: {
					type: ['string', 'null'],
				},
				printCode: {
					type: ['string', 'null'],
				},
				companyId: {
					type: 'integer',
				},
				ruc: {
					type: ['string', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				authorizationDate: {
					type: ['string', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				flagEcommerce: {
					type: ['boolean', 'null'],
				},
				typeDevice: {
					type: ['integer', 'null'],
				},
				sessionStatusId: {
					type: ['integer', 'null'],
					default: available,
				},
				flagAdmin: {
					type: ['boolean', 'integer', 'null'],
				},
				commerceId: {
					type: ['integer', 'null'],
				},
				cashRegisterInformation: {
					type: 'object',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_terminals.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
			series: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalSeries.js`,
				join: {
					from: 'sal_terminals.id',
					to: 'sal_series.sal_terminals_id',
				},
			},
			employees: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				filter: query => query.distinct('com_employee.id'),
				join: {
					from: 'sal_terminals.id',
					through: {
						modelClass: `${__dirname}/TerminalUser.js`,
						from: 'com_terminal_users.terminal_id',
						to: 'com_terminal_users.user_id',
					},
					to: 'com_employee.id',
				},
			},
			device: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Device.js`,
				filter: query =>
					query
						.where('com_devices.state_conexion', ConextionDevice.connected)
						.where('com_devices.type_conexion', TypeDevice.movil),
				join: {
					from: 'sal_terminals.id',
					to: 'com_devices.terminal_id',
				},
			},
			cashDeskClosing: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalCashDeskClosing.js`,
				filter: query => query.orderBy('id', 'desc'),
				join: {
					from: 'sal_terminals.id',
					to: 'sal_cash_desk_closing.terminal_id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'sal_terminals.cash_id',
					to: 'com_cash.id',
				},
			},
			sale: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				filter: query => query.orderBy('id', 'desc'),
				join: {
					from: 'sal_terminals.id',
					to: 'sal_documents.terminal_id',
				},
			},
		};
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'com_subsidiaries_id',
			'war_warehouses_id',
			'war_warehouses_name',
			'sal_type_terminals_id',
			'type_terminal',
			'name',
			'description',
			'code',
			'sunat_code',
			'print_code',
			'ruc',
			'cash_id',
			'authorization_date',
			'code_taxes',
			'flag_active',
			'flag_ecommerce',
			'type_device',
			'session_status_id',
			'commerce_id',
			'company_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static basicColumns(otherColumns = []) {
		let columns = [
			'id',
			'type_terminal',
			'name',
			'description',
			'code',
			'cash_id',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get virtualAttributes() {
		return ['sessionStatusName'];
	}

	get sessionStatusName() {
		let sessionStatusName = '';
		if (this.sessionStatusId === available) {
			sessionStatusName = 'Disponible';
		} else if (this.sessionStatusId === occupied) {
			sessionStatusName = 'Ocupado';
		}
		return sessionStatusName;
	}

	static match(query, search) {
		query.whereRaw('MATCH(name, description, ruc, sunat_code) AGAINST(?)', [search]);
		return query;
	}

	static getAll(filter = {}, companyId, aclFilters = {}) {
		const { search } = filter;
		const eagerData = filter.flagCashClosing
			? '[cash(selectColumns)]'
			: '[subsidiary(selectColumns), series(selectColumns).details(selectColumns), employees(idOnly), cash(selectColumns)]';
		const columns = filter.flagCashClosing
			? []
			: [raw('CASE WHEN ANY_VALUE(com_devices.id) > 0 THEN 1 ELSE 0 END AS flagTerminalDevice')];
		let query = this.query()
			.select(this.defaultColumns(columns))
			.eager(eagerData)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.sal_type_terminals_id`, filter.typeTerminalId)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, filter.cashId)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.com_subsidiaries_id`, filter.comSubsidiariesId);

		if (aclFilters) {
			query.aclFilter(aclFilters.products);
		}
		if (filter.flagCashClosing) {
			query
				.join('sal_cash_desk_closing', 'sal_terminals.id', 'sal_cash_desk_closing.terminal_id')
				.join('com_employee', 'com_employee.id', 'sal_cash_desk_closing.employee_id')
				.whereNotNull('sal_cash_desk_closing.terminal_id')
				.skipUndefined()
				.where('sal_cash_desk_closing.currency', filter.currency)
				.groupBy('sal_terminals.id')
				.orderBy('sal_cash_desk_closing.id', 'desc');
		} else {
			query
				.modifyEager('series', (builder) => {
					builder
						.skipUndefined()
						.where('sal_series.sal_type_documents_id', filter.typeDocumentId)
						.skipUndefined()
						.where('sal_series.type_billing', filter.typeBilling);
				})
				.leftJoin(raw(
					'com_devices on com_devices.terminal_id = sal_terminals.id and com_devices.state_conexion = ? and com_devices.type_conexion = ?',
					[ConextionDevice.connected, TypeDevice.movil],
				))
				.groupBy(`${this.tableName}.id`);
		}
		if (filter.warWarehousesId) {
			query.whereIn(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId);
		}
		if (!filter.flagAdmin) {
			const terminaluserTable = 'com_terminal_users';
			query
				.leftJoin(terminaluserTable, `${terminaluserTable}.terminal_id`, `${this.tableName}.id`)
				.where(`${terminaluserTable}.user_id`, filter.userId)
				.whereRaw(`${terminaluserTable}.deleted_at IS NULL`)
				.groupBy(`${this.tableName}.id`);
		}
		if (search) {
			query = this.match(query, search);
		}
		const newFilter = { ...filter };
		if (filter.sortField) {
			newFilter.sortField = `${this.tableName}.${filter.sortField}`;
		}
		query = this.includePaginationAndSort(query, newFilter);
		return query;
	}

	static getTerminalByClosing(filter = {}, companyId, aclFilters) {
		let query = this.query()
			.eager('[cash(selectColumns), cashDeskClosing(selectColumns)]')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.sal_type_terminals_id`, filter.typeTerminalId)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, filter.cashId)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.com_subsidiaries_id`, filter.comSubsidiariesId)
			.whereNotNull(`${this.tableName}.cash_id`)
			.groupBy('sal_terminals.id')
			.modifyEager('cashDeskClosing', (builder) => {
				builder
					.select([
						raw('com_employee.name as nameUser'),
						raw('com_employee.lastname as lastnameUser'),
					])
					.join('com_employee', 'com_employee.id', 'sal_cash_desk_closing.employee_id')
					.skipUndefined()
					.where('sal_cash_desk_closing.currency', filter.currency)
					.skipUndefined()
					.where('sal_cash_desk_closing.cash_id', filter.cashId)
					.first();
			});

		if (filter.getAll) {
			query.select(this.defaultColumns()).where(`${this.tableName}.flag_active`, 1);
		} else {
			let filterAdd = !filter.subsidiaryId
				? `AND sal_cash_desk_closing.cash_id = ${this.tableName}.cash_id`
				: '';
			filterAdd = filter.currency
				? `${filterAdd} AND sal_cash_desk_closing.currency = '${filter.currency}' `
				: '';
			query
				.select(this.defaultColumns([
					raw('JSON_TYPE(sal_cash_desk_closing.cash_register_information) as cash_register_information'),
					raw('max(sal_cash_desk_closing.id) as cash_desk_closing_id'),
					raw('sal_cash_desk_closing.currency as currency'),
					raw('sal_cash_desk_closing.closed_at as closed_at'),
					raw('sal_cash_desk_closing.closed_at as closed_at'),
					raw('sal_cash_desk_closing.date_opened as date_opened'),
					raw('sal_cash_desk_closing.start_amount as start_amount'),
					raw('sal_cash_desk_closing.end_amount as end_amount'),
				]))
				.join('com_cash', `${this.tableName}.cash_id`, 'com_cash.id')
				.whereNotNull('com_cash.terminal_id')
				.skipUndefined()
				.where('com_cash.subsidiary_id', filter.subsidiaryId)
				.orderBy(`${this.tableName}.id`, 'desc');

			if (filter.flagValidCashClosing) {
				query.leftJoin(raw(`sal_cash_desk_closing on ${
					this.tableName
				}.id = sal_cash_desk_closing.terminal_id ${filterAdd}`));
			} else {
				query.join(raw(`sal_cash_desk_closing on ${
					this.tableName
				}.id = sal_cash_desk_closing.terminal_id ${filterAdd}`));
			}
		}
		if (aclFilters) {
			query.aclFilter(aclFilters.subsidiaries, this.tableName);
		}

		const newFilter = { ...filter };
		if (filter.sortField) {
			newFilter.sortField = `${this.tableName}.${filter.sortField}`;
		}
		query = this.includePaginationAndSort(query, newFilter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[subsidiary(selectColumns), cash(selectColumns)]')
			.findById(id)
			.where('company_id', companyId);
	}

	static getByIds(ids, companyId) {
		return this.query()
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static IsIn(id, companyId) {
		return this.query()
			.findById(id)
			.where('company_id', companyId);
	}

	static getByCompany(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static createTerminalSeries(data, companyId, payload) {
		const knex = Terminal.knex();
		const newData = data.map((item) => {
			const newItem = { ...item };
			newItem.companyId = companyId;
			newItem.series = item.series.map((i) => {
				const newI = { ...i };
				newI.companyId = companyId;
				return newI;
			});
			delete newItem.employeesId;
			return newItem;
		});
		return transaction(knex, async (trx) => {
			const newRecords = await this.query(trx).upsertGraph(newData, {
				unrelate: false,
				relate: ['series'],
				noDelete: ['series'],
			});
			const response = [...newRecords];
			const terminalIds = [];
			const terminalUsers = [];
			const cashUpdate = payload.cashWithoutTerminal || [];
			const seriesUpdate = [];
			newRecords.forEach((terminal, i) => {
				const fathers = terminal.series;
				terminal.series.forEach((serie) => {
					const { notesTypeDocumentId: auxFatherTypeDoc, typeBilling } = serie;
					if (auxFatherTypeDoc && typeBilling) {
						const father = fathers.find(item =>
							item.salTypeDocumentsId === auxFatherTypeDoc && item.typeBilling === typeBilling);
						seriesUpdate.push({
							id: serie.id,
							notesTypeDocumentId: father.id,
						});
					}
				});
				if (payload) {
					const terminalPayload = payload[i];
					if (terminalPayload.employeesId && terminalPayload.employeesId.length > 0) {
						terminalIds.push(terminal.id);
						terminalPayload.employeesId.forEach((employeeId) => {
							terminalUsers.push({
								terminalId: terminal.id,
								userId: employeeId,
								companyId,
							});
						});
					}
					if (terminal.cashId) {
						cashUpdate.push({
							id: terminal.cashId,
							terminalId: terminal.id,
						});
					}
				}
			});
			if (seriesUpdate.length > 0) {
				await Series.createEdit(
					seriesUpdate,
					{
						unrelate: false,
						noDelete: ['series'],
					},
					trx,
				);
			}

			if (cashUpdate.length > 0) {
				await Cash.updateMultiple(cashUpdate, trx);
			}

			if (terminalUsers && terminalUsers.length > 0) {
				await TerminalUser.removePhysicallyByIds(terminalIds, companyId, trx);
				await TerminalUser.createMultiple(terminalUsers, trx);
			}

			return response;
		});
	}

	static edit(id, data, companyId, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getDashboardTerminals(filter = {}, companyId, aclFilters = {}) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[employees(selectColumnsTerminal).[devices(selectColumns)]]')
			.where('company_id', companyId)
			.aclFilter(aclFilters.products)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiariesId)
			.skipUndefined()
			.where('war_warehouses_id', filter.warWarehousesId);

		if (search) {
			query = this.match(query, search);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllByUser(userId, companyId) {
		const terminalUserTable = 'com_terminal_users';
		return this.query()
			.select(this.defaultColumns())
			.eager('device(selectColumns)')
			.join(terminalUserTable, `${this.tableName}.id`, `${terminalUserTable}.terminal_id`)
			.where(`${this.tableName}.company_id`, companyId)
			.where((builder) => {
				builder
					.where(`${this.tableName}.type_device`, '!=', TypeDevice.web)
					.orWhereNull(`${this.tableName}.type_device`);
			})
			.where(`${terminalUserTable}.user_id`, userId)
			.groupBy(`${this.tableName}.id`);
	}

	static getAdmin(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.flag_admin`, true)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getTerminalsConfirm(warehouseId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.war_warehouses_id`, warehouseId)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static async buildTerminal(data, typeDocuments = ['PED']) {
		const seriesBuilt = await SalSeries.buildSeries(data, typeDocuments);
		return {
			comSubsidiariesId: data.subsidiaryId,
			code: data.code,
			name: data.name,
			salTypeTerminalsId: ecommerceTerminal,
			flagEcommerce: true,
			companyId: data.companyId,
			series: seriesBuilt,
			warWarehousesId: data.warehouse.id,
			warWarehousesName: data.warehouse.name,
		};
	}

	static getByIdTerminal(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static async getListSaleTrasformCrom() {
		try {
			const query = this.query()
				.select(
					this.defaultColumns(),
					raw('CAST(sal_series.number AS UNSIGNED) textNumber'),
					raw('(JSON_EXTRACT(com_subsidiaries.settings, "$.amountSalesNote")) as porcentage'),
				)
				.join('sal_documents', 'sal_documents.terminal_id', 'sal_terminals.id')
				.join('sal_series', 'sal_series.id', 'sal_documents.serie_id')
				.join('com_subsidiaries', 'com_subsidiaries.id', 'sal_terminals.com_subsidiaries_id')
				.whereRaw('JSON_EXTRACT(com_subsidiaries.settings, "$.flagConvertSaleNote") = true')
				// No se puede hacer por sucursal porq puede ser mas de una terminal
				// eslint-disable-next-line max-len
				// .whereRaw('com_subsidiaries.sales_cron_date != DATE(NOW()) or com_subsidiaries.sales_cron_date is null')
				.whereRaw('(DATE(sal_terminals.sales_cron_date) < DATE(NOW()) or sal_terminals.sales_cron_date is null)')
				// .whereRaw(`TIME(NOW()) BETWEEN '${time}' AND '${endTime}'`)
				.whereNotNull('sal_terminals.flag_cron')
				.where('sal_terminals.flag_cron', 1)
				.groupBy('sal_terminals.id')
				.first();
			return query;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_QUERY_BILLING', error);
			return error;
		}
	}

	static editSalesCronDate(id, companyId) {
		return this.query()
			.patch({ salesCronDate: raw('NOW()') })
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = Terminal;
