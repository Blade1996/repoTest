'use strict';

const { raw } = require('objection');
const moment = require('moment');
const baseModel = require('./base');
const helper = require('./helper');

class SalExchangeRate extends baseModel {
	static get tableName() {
		return 'sal_exchange_rate';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['amount'],
			properties: {
				amount: {
					type: 'decimal',
				},
				default: {
					type: 'integer',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'company_id', 'amount', 'default', 'created_at'];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);

		if (filter.startDate && filter.endDate) {
			query.whereBetween('created_at', [filter.startDate, filter.endDate]);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByToday(today, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where(raw('date(created_at)'), today)
			.first();
	}

	static getOrderToday(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.orderBy('created_at', 'desc')
			.first();
	}

	static createEdit(exchangeRate, data) {
		if (exchangeRate) {
			return this.query()
				.patch(data)
				.where('id', exchangeRate.id);
		}
		const newData = data;
		newData.default = 0;
		return this.query().insert(newData);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static defaultRate() {
		return this.query()
			.select(this.defaultColumns())
			.where('default', 1)
			.first();
	}

	static getTodayOrDefault(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where((builder) => {
				builder.where(raw('date(created_at)'), moment().format('YYYY-MM-DD')).orWhere('default', 1);
			})
			.first();
	}
}

module.exports = SalExchangeRate;
