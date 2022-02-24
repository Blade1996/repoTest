'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class ItemCommerce extends baseModel {
	static get tableName() {
		return 'com_items_commerce';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'itemId'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: ['string', 'null'],
				},
				itemId: {
					type: 'integer',
				},
				companyId: {
					type: ['integer', 'null'],
				},
				order: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
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
		return ['id', 'name', 'code', 'order', 'additional_information', 'company_id'].concat(columns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', filter.companyId);
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

	static createMultiple(data) {
		return this.query().insertGraph(data);
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

	static getBycode(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static removeByItem(itemId, companyId) {
		return this.query()
			.delete()
			.where('item_id', itemId)
			.where('company_id', companyId);
	}

	static editByItem(itemId, data, companyId) {
		return this.query()
			.patch(data)
			.where('item_id', itemId)
			.where('company_id', companyId);
	}

	static getByItemId(itemId, companyId) {
		return this.query()
			.select('id')
			.where('item_id', itemId)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = ItemCommerce;
