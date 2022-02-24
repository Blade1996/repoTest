'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { transaction } = require('objection');

class Currency extends baseModel {
	static get tableName() {
		return 'com_currency';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [],
			properties: {
				currencyId: {
					type: 'string',
				},
				flagDefault: {
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
		};
	}

	static defaultColumns() {
		return ['currency_id', 'flag_default'];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static editMultiple(currencies, companyId) {
		const newCurrencies = currencies.map(item => ({
			currencyId: item,
			companyId,
		}));
		const knex = Currency.knex();
		return transaction(knex, () => {
			const promise = this.query()
				.delete()
				.where('company_id', companyId);

			return promise.then(() => this.createMultiple(newCurrencies)).then(() => newCurrencies);
		});
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}
}

module.exports = Currency;
