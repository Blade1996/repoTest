'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class OrderStates extends baseModel {
	static get tableName() {
		return 'com_orders_states';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				orderNumber: {
					type: ['integer', 'null'],
				},
				name: {
					type: 'string',
				},
				code: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				flagInit: {
					type: ['integer', 'boolean', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = ['id', 'name', 'code', 'description', 'flag_init', 'order_number'];
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static findFlagInit() {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_init', true)
			.first();
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}
}
module.exports = OrderStates;
