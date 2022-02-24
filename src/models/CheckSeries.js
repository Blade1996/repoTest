'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class CheckSeries extends baseModel {
	static get tableName() {
		return 'com_companies_checks_series';
	}

	static get relationMappings() {
		return {
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'com_companies_checks_series.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['numberStart', 'numberEnd'],
			properties: {
				serieStart: {
					type: ['string', 'null'],
				},
				serieEnd: {
					type: ['string', 'null'],
				},
				numberStart: {
					type: 'integer',
				},
				numberEnd: {
					type: 'integer',
				},
				description: {
					type: ['string', 'null'],
				},
				bankAccountId: {
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
		return [
			'id',
			'serie_start',
			'serie_end',
			'number_start',
			'number_end',
			'description',
			'bank_account_id',
		];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('bankAccount(selectColumns)')
			.where('company_id', companyId)
			.skipUndefined()
			.where('bank_account_id', filter.bankAccountId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = CheckSeries;
