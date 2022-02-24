'use strict';

const { transaction, Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class BankOperations extends baseModel {
	static get tableName() {
		return 'com_bank_operations';
	}

	static get relationMappings() {
		return {
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'com_bank_operations.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			bank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComMsBank.js`,
				join: {
					from: 'com_bank_operations.bank_id',
					to: 'com_ms_banks.id',
				},
			},
			typeTransactionBank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TypeTransactionBank.js`,
				join: {
					from: 'com_bank_operations.type_movement',
					to: 'ms_type_transaction_bank.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['numberOperation'],
			properties: {
				numberOperation: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				typeMovement: {
					type: ['integer', 'null'],
				},
				amount: {
					type: ['number', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				referenceId: {
					type: ['integer', 'null'],
				},
				bankId: {
					type: ['integer', 'null'],
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				transactionBankId: {
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
		const columns = [
			'id',
			'number_operation',
			'date_operation',
			'type_movement',
			'amount',
			'description',
			'code',
			'bank_id',
			'bank_account_id',
			'transaction_bank_id',
			'reference_id',
		];
		return columns.concat(otherColumns);
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.eager('[typeTransactionBank(selectColumns), bankAccount(selectColumns), bank(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_movement', filter.typeMovement)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('bank_account_id', filter.bankAccountId);

		if (filter.startDate) {
			query.whereRaw(`DATE(${this.tableName}.date_operation) >= ?`, filter.startDate);
		}
		if (filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.date_operation) <= ?`, filter.endDate);
		}
		if (filter.reconciliationId) {
			query.where((builder) => {
				builder
					.where(`${this.tableName}.reference_id`, filter.reconciliationId)
					.orWhereNull(`${this.tableName}.reference_id`);
			});
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(numberOperation, bankAccountId) {
		return this.query()
			.select(this.defaultColumns())
			.where('number_operation', numberOperation)
			.skipUndefined()
			.where('bank_account_id', bankAccountId)
			.first();
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static async create(data) {
		const promises = data.map(x => BankOperations.getByCode(x.numberOperation, x.bankAccountId));
		const result = await Promise.all(promises);

		const newInsert = data.reduce((acum, items) => {
			const newAcum = { ...items };
			const bankOperation = result.find(i => i && i.numberOperation === items.numberOperation);
			if (!bankOperation) {
				acum.push(newAcum);
			}
			return acum;
		}, []);

		const knex = BankOperations.knex();
		return transaction(knex, async () => {
			await this.query().insertGraph(newInsert);
		});
	}

	static editByReconcilement(id, { transactionBankId, referenceId, bankAccountId }, companyId) {
		return this.query()
			.patch({ transactionBankId, referenceId })
			.where('company_id', companyId)
			.skipUndefined()
			.where('bank_account_id', bankAccountId)
			.where('id', id);
	}
}
module.exports = BankOperations;
