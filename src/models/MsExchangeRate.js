'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { raw } = require('objection');

class MsExchangeRate extends baseModel {
	static get tableName() {
		return 'ms_exchange_rate';
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			properties: {
				countryCode: {
					type: 'string',
				},
				amount: {
					type: 'decimal',
				},
				originCurrency: {
					type: 'string',
				},
				destinationCurrency: {
					type: 'string',
				},
				lastUpdate: {
					type: 'date',
					default: helper.localDate({}, 'YYYY-MM-DD'),
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return [
			'id',
			'country_code',
			'amount',
			'origin_currency',
			'destination_currency',
			'last_update',
		];
	}

	static getAll() {
		return this.query().select(this.defaultColumns());
	}

	static getByDate(filters = {}) {
		const query = this.query().select(this.defaultColumns());
		if (filters.month) {
			query.where(raw(`MONTH(last_update) = ${filters.month}`)).skipUndefined();
		}
		if (filters.year) {
			query.where(raw(`YEAR(last_update) = ${filters.year}`)).skipUndefined();
		}
		if (filters.day) {
			query.where(raw(`DAY(last_update) = ${filters.day}`)).skipUndefined();
		}
		return query;
	}
}

module.exports = MsExchangeRate;
