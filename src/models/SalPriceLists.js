'use strict';

const { Model, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class SalPriceLists extends baseModel {
	static get tableName() {
		return 'sal_price_lists';
	}

	static relationMappings() {
		return {
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_price_lists.com_employee_id',
					to: 'com_employee.id',
				},
			},
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'sal_price_lists.com_customers_id',
					to: 'com_customers.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [
				'warWarehousesId',
				'comEmployeeId',
				'comCustomersId',
				'name',
				'description',
				'flagDefault',
			],
			properties: {
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				comEmployeeId: {
					type: ['integer', 'null'],
				},
				comCustomersId: {
					type: ['integer', 'null'],
				},
				name: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				flagDefault: {
					type: 'boolean',
				},
				flagActive: {
					type: 'boolean',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return [
			'id',
			'war_warehouses_id',
			'com_employee_id',
			'com_customers_id',
			'name',
			'description',
			'flag_default',
			'flag_active',
		];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(filter, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[employee(selectColumns), customer(selectColumns)]')
			.where('company_id', companyId);
		if (filter.comCustomersId) {
			query = query.where('com_customers_id', filter.comCustomersId);
		}
		if (filter.flagActive) {
			query = query.where('flag_active', filter.flagActive);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[employee(selectColumns), customer(selectColumns)]')
			.where('company_id', companyId)
			.findById(id);
	}

	static updateOtherPromise(data, id) {
		if (data.flagDefault) {
			return this.updateOthersFlagDefault(id, data.companyId);
		}
		return Promise.resolve();
	}

	static create(data) {
		const knex = SalPriceLists.knex();
		return transaction(knex, async () =>
			this.updateOtherPromise(data, undefined)
				.then(() => this.query().insert(data))
				.then(response => response));
	}

	static edit(id, data, companyId) {
		const knex = SalPriceLists.knex();
		return transaction(knex, async () =>
			this.updateOtherPromise({ ...data, companyId }, id)
				.then(() =>
					this.query()
						.patch(data)
						.where('id', id)
						.where('company_id', companyId))
				.then(response => response));
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static countFlagDefault(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('flag_default', true)
			.first();
	}

	static countFlagDefaultUpdate(companyId, id) {
		return this.query()
			.select('flag_default')
			.where('company_id', companyId)
			.where('id', '!=', id)
			.where('flag_default', true)
			.first();
	}

	static isDefault(id, companyId) {
		return this.query()
			.select('id', 'flag_default')
			.where('company_id', companyId)
			.where('id', id)
			.where('flag_default', true)
			.first();
	}

	static updateOthersFlagDefault(butId, companyId, trx) {
		return this.query(trx)
			.patch({ flagDefault: false })
			.where('flag_default', true)
			.where('company_id', companyId)
			.skipUndefined()
			.whereNot('id', butId);
	}

	static getByIdSimple(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static createDefault(data, trx) {
		if (data.id) {
			return { id: data.id };
		}
		return this.query(trx).insert(data);
	}
}

module.exports = SalPriceLists;
