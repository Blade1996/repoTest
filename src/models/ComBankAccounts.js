'use strict';

const { Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComBankAccounts extends baseModel {
	static get tableName() {
		return 'com_companies_bank_accounts';
	}

	static get relationMappings() {
		return {
			bank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComMsBank.js`,
				join: {
					from: 'com_companies_bank_accounts.bank_id',
					to: 'com_ms_banks.id',
				},
			},
			bankAccountType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/BankAccountType.js`,
				join: {
					from: 'com_companies_bank_accounts.bank_account_type_id',
					to: 'ms_bank_accounts_types.id',
				},
			},
			city: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_companies_bank_accounts.city_id',
					to: 'com_general.id',
				},
			},
			transactionBankCashiers: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/TransactionBank.js`,
				join: {
					from: 'com_companies_bank_accounts.id',
					to: 'com_transaction_bank.bank_account_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['bankId', 'accountNumber', 'currency', 'currencySymbol', 'companyId'],
			properties: {
				bankId: {
					type: 'integer',
				},
				name: {
					type: 'string',
				},
				accountNumber: {
					type: 'string',
				},
				accountNumberCi: {
					type: 'string',
				},
				currency: {
					type: 'string',
				},
				currencySymbol: {
					type: 'string',
				},
				bankAccountTypeId: {
					type: ['integer', 'null'],
				},
				flagFormatCharge: {
					type: ['boolean', 'null'],
				},
				initialBalance: {
					type: 'decimal',
				},
				cutoffDate: {
					type: ['string', 'null'],
				},
				balance: {
					type: 'number',
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				cityId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				subsidiaries: {
					type: ['array', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
					default: {},
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
			'bank_id',
			'name',
			'account_number',
			'account_number_ci',
			'currency',
			'currency_symbol',
			'bank_account_type_id',
			'flag_format_charge',
			'initial_balance',
			'cutoff_date',
			'balance',
			'accounting_account',
			'city_id',
			'subsidiary_id',
			'subsidiaries',
			'additional_information',
			'updated_at',
			'flag_active',
		];
	}

	static get virtualAttributes() {
		return ['fullBankAccount'];
	}

	get fullBankAccount() {
		const nameBank = this.bank ? this.bank.name : null;
		return `${nameBank} | ${this.name} | ${this.accountNumber}`;
	}

	static match(query, search) {
		query.whereRaw('MATCH(name, account_number, account_number_ci) AGAINST(?)', [search]);
		return query;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[bank(selectColumns), bankAccountType(selectColumns), city(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('bank_id', filter.bank)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.where('company_id', companyId);
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		if (filter.subsidiaryId) {
			query.where(`${this.tableName}.subsidiary_id`, filter.subsidiaryId);
		}
		if (filter.subsidiariesIds && filter.subsidiariesIds.length > 0) {
			query.whereRaw(`JSON_CONTAINS(${this.tableName}.subsidiaries, '[${filter.subsidiariesIds}]')`);
		}
		if (filter.flagEcommerce) {
			query.whereIn(`${this.tableName}.id`, filter.bankAccountsRelated);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[bank(selectColumns), bankAccountType(selectColumns), city(selectColumns)]')
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

	static isIn(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static async lastBalance(companyId, bankAccountId, tx) {
		const lastBalance = await this.query(tx)
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('id', bankAccountId)
			.first();
		return lastBalance ? lastBalance.balance : 0;
	}

	static lastBalanceMultiple(companyId, bankAccountIds) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('id', bankAccountIds);
	}

	static updateBalance(companyId, bankAccountId, newBalance = 0) {
		return this.query()
			.patch({ balance: raw('balance+??', [newBalance]) })
			.where('id', bankAccountId)
			.where('company_id', companyId);
	}

	static async getTransactionBankPdf(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				'com_companies_bank_accounts.id',
				'com_companies_bank_accounts.bank_id',
				'com_companies_bank_accounts.name',
				'com_companies_bank_accounts.account_number',
				'com_companies_bank_accounts.currency',
				'com_companies_bank_accounts.currency_symbol',
				'com_companies_bank_accounts.bank_account_type_id',
				'com_companies_bank_accounts.cutoff_date',
				'com_companies_bank_accounts.balance',
				'com_companies_bank_accounts.accounting_account',
				'com_companies_bank_accounts.subsidiary_id',
				raw('ANY_VALUE(sum(st.amount)) as totalAmount'),
			])
			.eager('[transactionBankCashiers(selectColumns)]')
			.join('com_transaction_bank as st', 'st.bank_account_id', 'com_companies_bank_accounts.id')
			.modifyEager('transactionBankCashiers', (builder) => {
				builder
					.select([
						raw('com_transaction_bank.created_at'),
						raw('JSON_EXTRACT(com_transaction_bank.additional_information, "$.typeDocumentCode") as typeDocumentCode'),
						raw('com_ms_type_payments.code AS codePayment'),
						raw('com_transaction_bank.document_number'),
						raw('CASE WHEN com_transaction_bank.type_movement = 1 THEN "Ingreso" ELSE "Egreso" END AS frm'),
						raw('JSON_EXTRACT(com_transaction_bank.additional_information, "$.documentNumber") as paymentDocument'),
					])
					.join(
						'com_ms_type_payments',
						'com_ms_type_payments.id',
						'com_transaction_bank.type_payment_id',
					)
					.where('com_transaction_bank.currency', filter.currency)
					.skipUndefined()
					.where('com_transaction_bank.type_movement', filter.typeMovement)
					.skipUndefined()
					.where('com_transaction_bank.subsidiary_id', filter.comSubsidiaryId);

				if (filter.startDate && filter.endDate) {
					query.whereRaw(
						'DATE(CONVERT_TZ(com_companies_bank_accounts.created_at, "+05:00", "+00:00")) >= ?',
						filter.startDate,
					);
					query.whereRaw(
						'DATE(CONVERT_TZ(com_companies_bank_accounts.created_at, "+05:00", "+00:00")) <= ?',
						filter.endDate,
					);
				}
				if (warehouseIds) {
					query.whereIn('com_transaction_bank.warehouse_id', warehouseIds);
				}
			})
			.where(`${this.tableName}.company_id`, companyId)
			.where('st.currency', filter.currency)
			.skipUndefined()
			.where('st.type_movement', filter.typeMovement)
			.skipUndefined()
			.where('st.subsidiary_id', filter.comSubsidiaryId)
			.groupBy(`${this.tableName}.id`);
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(st.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(st.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (warehouseIds) {
			query.whereIn('st.warehouse_id', warehouseIds);
		}
		return query;
	}

	static async getTransactionBankTotalPdf(companyId, filter = {}, warehouseIds) {
		const rawColumns = [raw('ANY_VALUE(sum(st.amount)) as totalAmountCashiers')];
		const query = this.query()
			.select(rawColumns)
			.join('com_transaction_bank as st', 'st.bank_account_id', 'com_companies_bank_accounts.id')
			.where(`${this.tableName}.company_id`, companyId)
			.where('st.currency', filter.currency)
			.skipUndefined()
			.where('st.type_movement', filter.typeMovement)
			.skipUndefined()
			.where('st.subsidiary_id', filter.comSubsidiaryId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(st.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(st.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (warehouseIds) {
			query.whereIn('st.warehouse_id', warehouseIds);
		}
		return query;
	}

	static editMultiple(data, trx) {
		const options = {
			noDelete: true,
			unrelate: false,
		};
		return this.query(trx).upsertGraph(data, options);
	}
}

module.exports = ComBankAccounts;
