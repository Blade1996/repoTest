'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class Module extends baseModel {
	static get tableName() {
		return 'com_module';
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				account: {
					type: ['string', 'null'],
				},
				type: {
					type: ['integer', 'null'],
				},
				summaryCode: {
					type: ['string', 'null'],
				},
				...defaultsPropiertes,
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
		const columns = ['id', 'name', 'code', 'account', 'type', 'summary_code'];
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type', filter.type);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}

	static getByCodes(codes) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', codes);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static isIn(id) {
		return this.query()
			.select('id')
			.where('id', id)
			.first();
	}
}
module.exports = Module;
