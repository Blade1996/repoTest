'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class Currency extends baseModel {
	static get tableName() {
		return 'ms_currency';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['id'],
			properties: {
				id: {
					type: 'string',
				},
				name: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				symbol: {
					type: ['string', 'null'],
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

	static defaultColumns() {
		return ['id', 'name', 'code', 'symbol'];
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}
}

module.exports = Currency;
