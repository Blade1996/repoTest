'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class Check extends baseModel {
	static get tableName() {
		return 'com_companies_checks';
	}

	static get relationMappings() {
		return {
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'com_companies_checks.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			checkSerie: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CheckSeries.js`,
				join: {
					from: 'com_companies_checks.check_serie_id',
					to: 'com_companies_checks_series.id',
				},
			},
			status: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CheckStatus.js`,
				join: {
					from: 'com_companies_checks.status_id',
					to: 'com_companies_checks_status.id',
				},
			},
			personTypeData: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypePerson.js`,
				join: {
					from: 'com_companies_checks.person_type',
					to: 'ms_type_person.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['checkSerieId', 'statusId'],
			properties: {
				checkSerieId: {
					type: 'integer',
				},
				statusId: {
					type: 'integer',
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				issueDate: {
					type: ['string', 'null'],
				},
				checkDate: {
					type: ['string', 'null'],
				},
				personDocument: {
					type: ['string', 'null'],
				},
				personType: {
					type: ['integer', 'null'],
				},
				personName: {
					type: ['string', 'null'],
				},
				number: {
					type: ['string', 'null'],
				},
				amount: {
					type: 'decimal',
				},
				amountPenalty: {
					type: 'decimal',
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				flagPostDated: {
					type: ['boolean', 'integer', 'null'],
				},
				reference: {
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
		return [
			'id',
			'check_serie_id',
			'status_id',
			'bank_account_id',
			'issue_date',
			'check_date',
			'person_document',
			'person_type',
			'person_name',
			'number',
			'amount',
			'amount_penalty',
			'document_number',
			'reference',
			'flag_post_dated',
			'url_image',
			'description',
			'created_at',
		];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[personTypeData(selectColumns), bankAccount(selectColumns), checkSerie(selectColumns), status(selectColumns)]')
			.where('company_id', companyId)
			.skipUndefined()
			.where('bank_account_id', filter.bankAccountId)
			.skipUndefined()
			.where('check_serie_id', filter.checkSerieId)
			.skipUndefined()
			.where('status_id', filter.statusId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[personTypeData(selectColumns), bankAccount(selectColumns), checkSerie(selectColumns), status(selectColumns)]')
			.findById(id)
			.where('company_id', companyId);
	}

	static getByNumber(number, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[personTypeData(selectColumns), bankAccount(selectColumns), checkSerie(selectColumns), status(selectColumns)]')
			.where('number', number)
			.where('company_id', companyId)
			.first();
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

module.exports = Check;
