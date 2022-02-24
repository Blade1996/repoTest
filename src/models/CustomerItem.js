'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class CustomerItem extends baseModel {
	static get tableName() {
		return 'com_customers_items';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code'],
			properties: {
				name: {
					type: 'string',
				},
				description: {
					type: 'string',
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

	static defaultColumns(columns = []) {
		return ['id', 'name', 'code', 'description'].concat(columns);
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = CustomerItem;
