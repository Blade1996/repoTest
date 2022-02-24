'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const ModuleCode = require('./ModuleCode');

class MsTypeTransaction extends baseModel {
	static get tableName() {
		return 'ms_type_transactions';
	}

	static get relationMappings() {
		return {
			country: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Country.js`,
				join: {
					from: 'ms_type_transactions.country_id',
					to: 'com_country.id',
				},
			},
		};
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
				description: {
					type: ['string', 'null'],
				},
				countryId: {
					type: ['integer', 'null'],
				},
				type: {
					type: ['integer', 'null'],
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
		const columns = ['id', 'name', 'code', 'description', 'country_id', 'type'];
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let { type } = filter;
		type = type || ModuleCode.sales;
		let query = this.query()
			.eager('country(selectColumns)')
			.select(this.defaultColumns())
			.where('type', type)
			.skipUndefined()
			.where('country_id', filter.countryId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code, countryId, type, trx) {
		return this.query(trx)
			.select(this.defaultColumns())
			.where('code', code)
			.where('country_id', countryId)
			.skipUndefined()
			.where('type', type)
			.first();
	}

	static getById(id, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.skipUndefined()
			.where('country_id', countryId)
			.first();
	}

	static getFilterById(id, code, { flagType = ModuleCode.sales, comCountryId = 1 }) {
		return this.query()
			.select(this.defaultColumns())
			.where('type', flagType)
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.where('code', code)
			.skipUndefined()
			.where('country_id', comCountryId)
			.first();
	}
}
module.exports = MsTypeTransaction;
