'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class SalesStates extends baseModel {
	static get tableName() {
		return 'sal_sales_states';
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code', 'descriptions'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				descriptions: {
					type: 'string',
				},
				color: {
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
		const columns = ['id', 'name', 'code', 'descriptions', 'color'];
		return columns.concat(otherColumns);
	}

	static getList() {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_active', true);
	}

	static getId(code) {
		return this.query()
			.select('id')
			.where('code', code)
			.first();
	}

	static getCode(code) {
		return this.query()
			.select('id')
			.where('code', code)
			.first();
	}

	static getByCodes(codes) {
		return this.query()
			.select('id')
			.whereIn('code', codes);
	}

	static getById(id) {
		return this.query()
			.select('id', 'code')
			.where('id', id)
			.first();
	}
}
module.exports = SalesStates;
