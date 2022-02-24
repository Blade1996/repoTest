'use strict';

const { Model, transaction } = require('objection');
const ComEmployee = require('./ComEmployee');
const TerminalUser = require('./TerminalUser');
const { supervisor, seller } = require('./../models/enums/type-sellers-enum');

const baseModel = require('./base');
const helper = require('./helper');

class ComSeller extends baseModel {
	static get tableName() {
		return 'com_sellers';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['typeSeller'],
			properties: {
				typeSeller: {
					type: 'integer',
				},
				timeTracking: {
					type: ['number', 'null'],
				},
				blockOutRouteTransactions: {
					type: ['boolean', 'null'],
				},
				commitStockOrders: {
					type: ['boolean', 'null'],
				},
				allowChangeSalePrice: {
					type: ['boolean', 'null'],
				},
				maximumDiscountLimit: {
					type: ['number', 'null'],
				},
				levels: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: 'integer',
				},
				typeDocumentId: {
					type: 'integer',
				},
				settings: {
					type: ['object', 'null'],
					default: {},
				},
				flagPerimeter: {
					type: ['boolean', 'null'],
					default: false,
				},
				code: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				lastName: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				gender: {
					type: ['integer', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				addressSeller: {
					type: ['string', 'null'],
				},
				warehouseId: {
					type: ['array', 'null'],
					default: [],
				},
				warehouses: {
					type: ['array', 'null'],
					default: [],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				groupId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		return {
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_sellers.employee_id',
					to: 'com_employee.id',
				},
			},
			sellers: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				filter: query => query.where('com_sellers.type_seller', seller),
				join: {
					from: 'com_sellers.id',
					through: {
						modelClass: `${__dirname}/ComHierarchy.js`,
						from: 'com_hierarchy_sellers.supervisor_id',
						to: 'com_hierarchy_sellers.employee_id',
					},
					to: 'com_sellers.id',
				},
			},
			supervisores: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				filter: query => query.where('com_sellers.type_seller', supervisor),
				join: {
					from: 'com_sellers.id',
					through: {
						modelClass: `${__dirname}/ComHierarchy.js`,
						from: 'com_hierarchy_sellers.employee_id',
						to: 'com_hierarchy_sellers.supervisor_id',
					},
					to: 'com_sellers.id',
				},
			},
			group: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_general.id',
					to: 'com_sellers.group_id',
				},
			},
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'type_seller',
			'time_tracking',
			'block_out_route_transactions',
			'commit_stock_orders',
			'allow_change_sale_price',
			'maximum_discount_limit',
			'levels',
			'subsidiary_id',
			'type_document_id',
			'settings',
			'flag_perimeter',
			'code',
			'description',
			'name',
			'lastname',
			'email',
			'phone',
			'gender',
			'document_number',
			'employee_id',
			'address_seller',
			'warehouses',
			'warehouse_id',
			'terminal_id',
			'group_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return ['fullname', 'fullnameSupervisor', 'warehousesText'];
	}

	get fullname() {
		let fullname = this.name;
		if (this.lastname) {
			fullname = `${this.name} ${this.lastname}`;
		}
		return fullname;
	}

	get fullnameSupervisor() {
		let fullnames = '';
		let size = 0;
		if (this.supervisores && this.supervisores.length > 0) {
			size = this.supervisores.length;
			this.supervisores.forEach((item, i) => {
				if (item.fullname) {
					if (i < size - 1) {
						fullnames += `${item.fullname}, `;
					} else {
						fullnames += item.fullname;
					}
				}
			});
		}
		return fullnames;
	}

	get warehousesText() {
		let fullWarehouses = '';
		let size = 0;
		if (this.warehouses && this.warehouses.length > 0) {
			size = this.warehouses.length;
			this.warehouses.forEach((item, i) => {
				if (item.name) {
					if (i < size - 1) {
						fullWarehouses += `${item.name}, `;
					} else {
						fullWarehouses += item.name;
					}
				}
			});
		}
		return fullWarehouses;
	}

	static tableFilters(query, filter = {}, fields = []) {
		const value = `%${filter.search}%`;
		query.where((builder) => {
			fields.forEach((field) => {
				builder.orWhere(field, 'like', value);
			});
		});
		return query;
	}

	static getAll(filter = {}, companyId) {
		const hierarchyTable = 'com_hierarchy_sellers';
		const zonesCustomersTable = 'com_zones_customers';
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[employee(selectColumns), sellers(selectColumns), supervisores(selectColumns), group(selectColumns)]')
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('type_seller', filter.typeSeller)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.where(`${this.tableName}.company_id`, companyId);

		if (filter.warehouseIds) {
			query.whereRaw(`JSON_CONTAINS(${this.tableName}.warehouse_id, '[${filter.warehouseIds}]')`);
		}

		if (filter.supervisorId) {
			query
				.innerJoin(`${hierarchyTable}`, `${hierarchyTable}.employee_id`, `${this.tableName}.id`)
				.where(`${hierarchyTable}.flag_active`, 1)
				.where(`${hierarchyTable}.supervisor_id`, filter.supervisorId);
		}

		if (filter.zoneId) {
			query
				.innerJoin(
					`${zonesCustomersTable}`,
					`${zonesCustomersTable}.seller_id`,
					`${this.tableName}.id`,
				)
				.where(`${zonesCustomersTable}.flag_active`, 1)
				.where(`${zonesCustomersTable}.zone_id`, filter.zoneId);
		}

		if (filter.search) {
			query = this.tableFilters(query, filter, [
				'name',
				'lastname',
				'document_number',
				'email',
				'address_seller',
			]);
		}

		if (filter.employeesId && filter.employeesId.length > 0) {
			query.whereIn(`${this.tableName}.employee_id`, filter.employeesId);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(filter = {}, id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[employee(selectColumns).[terminalsUser(selectColumns)], sellers(selectColumns), supervisores(selectColumns), group(selectColumns)]')
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('type_seller', filter.typeSeller)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.where(`${this.tableName}.company_id`, companyId)
			.findById(id);
	}

	static findById(id, companyId) {
		return this.query()
			.eager('[employee(selectColumns)]')
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, { employeeId, updateConfigFilters, updateTerminalUser }, companyId) {
		const knex = ComSeller.knex();
		return transaction(knex, async (trx) => {
			const dataUpdate = this.query(trx)
				.patch(data)
				.where(`${this.tableName}.id`, id)
				.where(`${this.tableName}.company_id`, companyId);

			if (employeeId && updateConfigFilters) {
				await ComEmployee.updateConfigFilters(employeeId, updateConfigFilters, companyId, trx);
			}

			if (updateTerminalUser) {
				await TerminalUser.removeByUser(employeeId, companyId, trx);
				await TerminalUser.createMultiple(updateTerminalUser, trx);
			}
			return dataUpdate;
		});
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByTypeRole(employeesId, companyId, typeSeller = supervisor) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.id`, employeesId)
			.where(`${this.tableName}.type_seller`, typeSeller)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static updateGroup(ids, groupId, companyId) {
		return this.query()
			.patch({ groupId })
			.whereIn('id', ids)
			.where('company_id', companyId);
	}
}

module.exports = ComSeller;
