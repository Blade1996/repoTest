'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model, raw } = require('objection');
const { bankDep } = require('./enums/way-payment-codes-enum');

class MsWayPayment extends baseModel {
	static get tableName() {
		return 'ms_way_payment';
	}

	static get relationMappings() {
		return {
			country: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Country.js`,
				join: {
					from: 'ms_way_payment.country_id',
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
				gatewayConfiguration: {
					type: ['array', 'null'],
				},
				gateWayPaymentCommerce: {
					type: ['array', 'null'],
				},
				...defaultsPropiertes,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			fairColumns: builder => builder.select(this.fairColumns()),
			credentialColumns: builder => builder.select(this.credentialColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'name',
			'code',
			'description',
			'country_id',
			'gateway_configuration',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static fairColumns(otherColumns = []) {
		const columns = ['id', 'name', 'code', 'description'].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static credentialColumns(otherColumns = []) {
		const columns = ['id', 'name', 'code', 'gateway_configuration'].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.eager('[country(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('country_id', filter.countryId);
		if (filter.flagCompany) {
			query.select(
				'w.gateway_configuration as gateWayPaymentCommerce',
				'w.commerce_id',
				'w.way_payment_id',
			);
			query.join('com_way_payment_commerce as w', 'w.way_payment_id', `${this.tableName}.id`);
			query.where('w.commerce_id', filter.commerceId);
			query.where('w.company_id', filter.companyId);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.code`, code)
			.where(`${this.tableName}.country_id`, countryId)
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

	static getByIds(ids) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids);
	}

	static getByWayPayment(id) {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.id`, id)
			.first();
	}

	static getListWayPayment(wayPaymentRelated, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.join('com_way_payment_commerce as td', `${this.tableName}.id`, 'td.way_payment_id')
			.where('td.company_id', companyId)
			.groupBy(`${this.tableName}.id`);
		if (wayPaymentRelated && wayPaymentRelated.length > 0) {
			query.whereIn(`${this.tableName}.id`, wayPaymentRelated);
		}
		return query;
	}

	static getNewData({ data = [], previousConfig = [] }) {
		return data.map((i) => {
			const newItem = { ...i };
			if (
				i.code === bankDep &&
				(!i.gateWayPaymentCommerce ||
					(Array.isArray(i.gateWayPaymentCommerce) && i.gateWayPaymentCommerce.length === 0))
			) {
				newItem.gateWayPaymentCommerce = previousConfig;
			}
			return newItem;
		});
	}

	static getByCountryId(countryId) {
		return this.query()
			.select(this.credentialColumns())
			.where(`${this.tableName}.country_id`, countryId);
	}

	static getByCodes(code, countryId) {
		const columns = [
			raw(`replace(convert(JSON_EXTRACT(ms_way_payment.gateway_configuration, JSON_UNQUOTE(replace(JSON_SEARCH(ms_way_payment.gateway_configuration, 'one', '${code}'), '${code}', 'value'))), char), '"', '') as paymentCode`),
			raw('ms_way_payment.id as id'),
			raw('ms_way_payment.country_id as countryId'),
		];
		const query = this.query()
			.select(columns)
			.where(`${this.tableName}.country_id`, countryId)
			.whereRaw(`replace(convert(JSON_EXTRACT(ms_way_payment.gateway_configuration, JSON_UNQUOTE(replace(JSON_SEARCH(ms_way_payment.gateway_configuration, 'one', '${code}'), '${code}', 'value'))), char), '"', '') = '${code}'`)
			.groupBy(['ms_way_payment.gateway_configuration', 'ms_way_payment.id'])

			.first();
		return query;
	}
}
module.exports = MsWayPayment;
