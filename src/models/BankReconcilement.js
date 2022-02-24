'use strict';

const { transaction, Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const TransactionBank = require('./TransactionBank');
const Reconcilement = require('./Reconcilement');
const BankOperations = require('./BankOperations');

class BankReconcilement extends baseModel {
	static get tableName() {
		return 'com_bank_reconcilement';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_bank_reconcilement.company_id',
					to: 'com_companies.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_bank_reconcilement.employee_id',
					to: 'com_employee.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_bank_reconcilement.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'com_bank_reconcilement.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			bank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComMsBank.js`,
				join: {
					from: 'com_bank_reconcilement.bank_id',
					to: 'com_ms_banks.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['employeeId', 'date'],
			properties: {
				amount: {
					type: ['number', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				bankId: {
					type: ['number', 'null'],
				},
				flagLocked: {
					type: ['number', 'boolean', 'null'],
				},
				relatedDocuments: {
					type: 'array',
					default: [],
				},
				relatedDocumentsCanceled: {
					type: 'array',
					default: [],
				},
				numericalIdentification: {
					type: ['string', 'null'],
				},
				flagStatus: {
					type: ['integer', 'null'],
					default: 1,
					enum: [1, 2, 3, 'null'],
				},
				amountBank: {
					type: ['number', 'null'],
					default: 0,
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
		const columns = [
			'id',
			'numerical_identification',
			'amount',
			'bank_id',
			'employee_id',
			'bank_account_id',
			'date',
			'accounting_bank_name',
			'related_documents',
			'related_documents_canceled',
			'flag_locked',
			'flag_status',
			'flag_active',
			'company_id',
			'created_at',
			'amount_bank',
		];
		return columns.concat(otherColumns);
	}

	static create(data) {
		let newData = data;
		const knex = BankReconcilement.knex();
		delete newData.ids;
		return transaction(knex, () =>
			this.query()
				.insert(newData)
				.then((newRecord) => {
					newData = newRecord;
					if (newData.relatedDocuments && newData.relatedDocuments.length > 0) {
						return TransactionBank.editFlagReconcilement(
							newData.relatedDocuments,
							{ flagReconcilement: Reconcilement.reconcilement, bankReconcilementId: newRecord.id },
							newRecord.companyId,
						);
					}
					return newData;
				})
				.then(() => newData));
	}

	static getAll(filter = {}, companyId) {
		const { startDate, endDate } = filter;
		let query = this.query()
			.eager('[subsidiary(selectColumns), employee(selectColumns), bankAccount(selectColumns), bank(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where(`${this.tableName}.bank_account_id`, filter.bankAccountId)
			.skipUndefined()
			.where(`${this.tableName}.bank_id`, filter.bankId)
			.where(`${this.tableName}.company_id`, companyId);

		if (startDate && endDate) {
			query.whereRaw(`DATE(${this.tableName}.date) >= ?`, startDate);
			query.whereRaw(`DATE(${this.tableName}.date) <= ?`, endDate);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[subsidiary(selectColumns), employee(selectColumns), bankAccount(selectColumns), bank(selectColumns)]')
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getByIdSimple(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static areIn(companyId, { ids, flagLocked }) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.id`, ids)
			.skipUndefined()
			.where(`${this.tableName}.flag_locked`, flagLocked)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static findByIdAndCompanyId(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static getByDay(date, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('date', date)
			.where('company_id', companyId);
	}

	static removeByUpdateDocuments(id, companyId, relatedDocuments) {
		const knex = BankReconcilement.knex();
		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('id', id)
				.where('company_id', companyId)
				.then(() => {
					const result = TransactionBank.editFlagReconcilement(
						relatedDocuments,
						{ flagReconcilement: Reconcilement.notReconcilement, bankReconcilementId: null },
						companyId,
					);
					return result;
				}));
	}

	static async update(id, data, companyId) {
		const knex = BankReconcilement.knex();
		const newData = { ...data };
		delete newData.transactionBankIds;
		return transaction(knex, () =>
			this.query()
				.patch(newData)
				.where('id', id)
				.where('company_id', companyId)
				.then(() => {
					const result = TransactionBank.editFlagReconcilement(
						data.transactionBankIds,
						{ flagReconcilement: Reconcilement.notReconcilement, bankReconcilementId: null },
						companyId,
					);
					return result;
				}));
	}

	static async editByOperations(id, data, companyId) {
		const knex = BankReconcilement.knex();
		const newData = { ...data };
		delete newData.ids;
		delete newData.operationIds;
		delete newData.bankAccountId;
		return transaction(knex, () =>
			this.query()
				.patch(newData)
				.where('id', id)
				.where('company_id', companyId)
				.then(() => {
					if (Array.isArray(data.ids) && data.ids.length > 0) {
						const result = TransactionBank.editFlagReconcilement(
							data.ids,
							{ flagReconcilement: Reconcilement.reconcilement, bankReconcilementId: id },
							companyId,
						);
						return result;
					}
					return null;
				})
				.then(() => {
					if (Array.isArray(data.operationIds) && data.operationIds.length > 0) {
						const promises = data.operationIds.map(x =>
							BankOperations.editByReconcilement(
								x.operationBankId,
								{
									transactionBankId: x.transactionBankId,
									referenceId: id,
									bankAccountId: data.bankAccountId,
								},
								companyId,
							));
						const result = Promise.all(promises);
						return result;
					}
					return null;
				}));
	}

	static editMultiple(ids, data, companyId) {
		return this.query()
			.patch(data)
			.where('company_id', companyId)
			.whereIn('id', ids);
	}

	static getLastRecord(bankAccountId, companyId, flagActive) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('flag_active', flagActive)
			.where('bank_account_id', bankAccountId)
			.orderBy('id', 'desc')
			.first();
	}
}
module.exports = BankReconcilement;
