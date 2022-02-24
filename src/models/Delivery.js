'use strict';

const { Model, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComEmployee = require('./ComEmployee');
const { given } = require('./enums/type-ms-order-states');

class Delivery extends baseModel {
	static get tableName() {
		return 'com_delivery';
	}

	static get relationMappings() {
		return {
			vehicle: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComVehicles.js`,
				join: {
					from: 'com_delivery.vehicle_id',
					to: 'com_vehicles.id',
				},
			},
			group: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_general.id',
					to: 'com_delivery.group_id',
				},
			},
			orders: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_delivery.id',
					to: 'sal_orders.delivery_id',
				},
			},
			typePerson: {
				relation: baseModel.HasOneRelation,
				modelClass: `${__dirname}/MsTypePerson.js`,
				join: {
					from: 'com_delivery.type_document_id',
					to: 'ms_type_person.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: 'string',
				},
				lastname: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				settings: {
					type: ['object', 'null'],
					default: {},
				},
				subsidiaryId: {
					type: 'integer',
				},
				typeDocumentId: {
					type: 'integer',
				},
				timeTracking: {
					type: ['number', 'null'],
				},
				description: {
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
				address: {
					type: ['string', 'null'],
				},
				photo: {
					type: ['string', 'null'],
				},
				groupId: {
					type: ['integer', 'null'],
				},
				vehicleId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder =>
				builder.select(
					'id',
					'name',
					'lastname',
					'document_number',
					'phone',
					'photo',
					'employee_id',
				),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'time_tracking',
			'subsidiary_id',
			'type_document_id',
			'settings',
			'code',
			'description',
			'name',
			'lastname',
			'email',
			'phone',
			'gender',
			'document_number',
			'address',
			'photo',
			'group_id',
			'vehicle_id',
			'employee_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['fullname'];
	}

	get fullname() {
		return `${this.name} ${this.lastname}`;
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
		const onlyInProgress =
			filter.showOrdersInProgress && filter.showOrdersInProgress.toString() === 'true';
		const ordersEager = onlyInProgress ? ', orders(basicColumns)' : '';
		const eagerRaw = `[vehicle(selectColumns), group(selectColumns)${ordersEager}]`;
		let query = this.query()
			.eager(eagerRaw)
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.where(`${this.tableName}.company_id`, companyId);

		if (filter.search) {
			query = this.tableFilters(query, filter, [
				'name',
				'lastname',
				'document_number',
				'email',
				'address',
			]);
		}
		if (onlyInProgress) {
			query.modifyEager('orders', (builder) => {
				builder
					.innerJoin('com_orders_states', 'com_orders_states.id', 'sal_orders.order_state_id')
					.where('com_orders_states.code', '!=', given);
			});
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static getDeliveryById(filter = {}, id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.where(`${this.tableName}.company_id`, companyId)
			.findById(id);
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
	}

	static getByCode(code, companyId) {
		return this.query()
			.select('id')
			.where('code', code)
			.where('company_id', companyId)
			.first();
	}

	static getByEmail(email, companyId) {
		return this.query()
			.select('id')
			.where('email', email)
			.where('company_id', companyId)
			.first();
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static removeAll(id, companyId, employeeId) {
		const knex = Delivery.knex();
		return transaction(knex, async () =>
			this.remove(id, companyId).then(await ComEmployee.remove(employeeId)));
	}

	static updateGroup(ids, groupId, companyId) {
		return this.query()
			.patch({ groupId })
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getByCodes(code, companyId) {
		return this.query()
			.select('id')
			.whereIn('code', code)
			.where('company_id', companyId);
	}
}

module.exports = Delivery;
