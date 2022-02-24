'use strict';

const baseModel = require('./base');
const { Model, transaction, raw } = require('objection');
const { transferToBox, transferToBank } = require('./TypeTransactionCash');
const { income, expenses } = require('./TypeMovement');
const Reconcilement = require('./Reconcilement');
const BankAccount = require('./ComBankAccounts');
const { finalized } = require('./MsTransactionStates');
const { bank } = require('./ModuleCode');
const helper = require('./helper');
const TypeAmortization = require('./TypeAmortization');
const MsTypeTransaction = require('./MsTypeTransaction');
const PaymentState = require('./PaymentState');
const TypeTransactionCash = require('./TypeTransactionCash');
const ModuleCode = require('./ModuleCode');
const {
	registered, canceled, pending, accounted,
} = require('./EntityStateCode');

class TransactionBank extends baseModel {
	static get tableName() {
		return 'com_transaction_bank';
	}

	static get relationMappings() {
		return {
			saleDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'com_transaction_bank.sal_documents_id',
					to: 'sal_documents.id',
				},
			},
			typeTransactionBank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TypeTransactionBank.js`,
				join: {
					from: 'com_transaction_bank.type_transaction_bank_id',
					to: 'ms_type_transaction_bank.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_transaction_bank.employee_id',
					to: 'com_employee.id',
				},
			},
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'com_transaction_bank.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			moduleOrigin: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'com_transaction_bank.module_origin_id',
					to: 'com_module.id',
				},
			},
			bank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComMsBank.js`,
				join: {
					from: 'com_transaction_bank.bank_id',
					to: 'com_ms_banks.id',
				},
			},
			typePayment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'com_transaction_bank.type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
			bankReconcilement: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/BankReconcilement.js`,
				join: {
					from: 'com_transaction_bank.bank_reconcilement_id',
					to: 'com_bank_reconcilement.id',
				},
			},
			amortization: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Amortization.js`,
				join: {
					from: 'com_transaction_bank.id',
					to: 'ca_amortizations.transaction_bank_id',
				},
			},
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'com_transaction_bank.customer_id',
					to: 'com_customers.id',
				},
			},
		};
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static get jsonSchema() {
		const defaultproperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['stateId', 'typeTransactionBankId', 'currency', 'typeMovement', 'bankAccountId'],
			properties: {
				stateId: {
					type: 'integer',
				},
				typeTransactionBankId: {
					type: 'integer',
				},
				paymentAmount: {
					type: ['number', 'null'],
				},
				currency: {
					type: 'string',
				},
				amount: {
					type: ['number', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				salCashDeskClosingId: {
					type: ['integer', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				typeMovement: {
					type: 'integer',
					default: 1,
				},
				typeTransaction: {
					type: ['integer', 'null'],
				},
				entityExternalId: {
					type: ['integer', 'null'],
				},
				salDocumentsId: {
					type: ['integer', 'null'],
				},
				purDocumentsId: {
					type: ['integer', 'null'],
				},
				concept: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				moduleOriginId: {
					type: ['integer', 'null'],
				},
				documentReference: {
					type: ['string', 'null'],
				},
				reference: {
					type: ['string', 'null'],
				},
				accountingSeatCode: {
					type: ['string', 'null'],
				},
				typeEntityId: {
					type: ['integer', 'null'],
				},
				transferredTransactions: {
					type: ['array', 'null'],
				},
				bankAccountId: {
					type: 'integer',
				},
				urlImage: {
					type: ['string', 'null'],
				},
				bankId: {
					type: ['integer', 'null'],
				},
				typePaymentId: {
					type: ['integer', 'null'],
				},
				typeAmortization: {
					type: ['integer', 'null'],
					enum: [1, 2, 3, null],
					default: null,
				},
				flagReconcilement: {
					type: ['integer', 'null'],
					default: 1,
				},
				numberOperation: {
					type: ['string', 'null'],
				},
				operationBankId: {
					type: ['integer', 'null'],
				},
				bankReconcilementId: {
					type: ['integer', 'null'],
				},
				documents: {
					type: ['array', 'null'],
				},
				dataGateway: {
					type: ['object', 'null'],
				},
				inLineExtraData: {
					type: ['string', 'null'],
				},
				customerId: {
					type: ['integer', 'null'],
				},
				supplierId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				entityStateId: {
					type: ['integer', 'null'],
					default: 1,
				},
				typeAccreditation: {
					type: ['integer', 'null'],
					default: 0,
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				accountingSeat: {
					type: ['object', 'null'],
				},
				originCashId: {
					type: ['integer', 'null'],
				},
				...defaultproperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let colums = [
			'id',
			'state_id',
			'terminal_id',
			'type_transaction_bank_id',
			'sal_cash_desk_closing_id',
			'payment_amount',
			'currency',
			'amount',
			'additional_information',
			'employee_id',
			'type_movement',
			'type_transaction',
			'entity_external_id',
			'sal_documents_id',
			'pur_documents_id',
			'concept',
			'document_number',
			'module_origin_id',
			'document_reference',
			'reference',
			'accounting_seat_code',
			'type_entity_id',
			'transferred_transactions',
			'bank_account_id',
			'url_image',
			'bank_id',
			'balance',
			'type_payment_id',
			'flag_reconcilement',
			'payment_date',
			'number_operation',
			'operation_bank_id',
			'bank_reconcilement_id',
			'type_amortization',
			'documents',
			'in_line_extra_data',
			'subsidiary_id',
			'warehouse_id',
			'customer_id',
			'supplier_id',
			'created_at',
			'data_gateway',
			'entity_state_id',
			'accounting_account',
			'accounting_seat',
			'origin_cash_id',
			'cash_id',
		].map(c => `${this.tableName}.${c}`);

		colums = colums.concat(otherColumns);

		return colums;
	}

	static basicColumns(otherColumns = []) {
		let colums = [
			'id',
			'state_id',
			'payment_amount',
			'currency',
			'amount',
			'additional_information',
			'concept',
			'document_number',
			'document_reference',
			'reference',
			'url_image',
			'type_payment_id',
			'flag_reconcilement',
			'payment_date',
			'number_operation',
			'type_amortization',
			'origin_cash_id',
		].map(c => `${this.tableName}.${c}`);
		colums = colums.concat(otherColumns);
		return colums;
	}

	static get virtualAttributes() {
		return ['stateColor', 'entityStateName', 'documentNumberOrigin'];
	}

	get documentNumberOrigin() {
		let numbers = '';
		if (this.documentNumber) {
			numbers = this.documentNumber;
		}
		if (this.documents && this.documents.length > 0) {
			numbers = this.documents.toString();
		}
		return numbers;
	}

	get entityStateName() {
		let name;
		switch (this.entityStateId) {
		case registered:
			name = 'Registrada';
			break;
		case canceled:
			name = 'Cancelada';
			break;
		case pending:
			name = 'Pendiente';
			break;
		case accounted:
			name = 'Contabilizada';
			break;
		default:
			break;
		}
		return name;
	}

	get stateColor() {
		let color = '';
		switch (this.stateId) {
		case 1:
			color = 'error';
			break;
		case 2:
			color = 'success';
			break;
		default:
			break;
		}
		return color;
	}

	$beforeInsert() {
		this.generateInlineData();
	}

	generateInlineData() {
		if (this.additionalInformation) {
			const data = Object.values(this.additionalInformation);
			const arrayFilter = data.filter(item => item);
			this.inLineExtraData = arrayFilter.join(' ');
			this.inLineExtraData = `${this.inLineExtraData} ${this.reference} ${this.concept} ${
				this.documentReference
			} ${this.documentNumber}`;
			this.inLineExtraData = this.documents
				? `${this.inLineExtraData} ${this.documents.join('')}`
				: `${this.inLineExtraData}`;
		}
	}

	static match(query, search, table = this.tableName) {
		const t = this.tableName;
		query.where((builder) => {
			builder
				.whereRaw(
					`MATCH(${t}.currency, ${t}.concept, ${t}.document_number, ${t}.document_reference, ${t}.reference, ${t}.accounting_seat_code) AGAINST(?)`,
					[search],
				)
				.orWhere(`${this.tableName}.in_line_extra_data`, 'like', `%${search}%`);
			if (table !== this.tableName) {
				builder
					.orWhere(`${table}.name`, 'like', `%${search}%`)
					.orWhere(`${table}.account_number`, 'like', `%${search}%`)
					.orWhere(`${table}.account_number_ci`, 'like', `%${search}%`);
			}
		});
		return query;
	}

	static getAll(companyId, filter = {}) {
		const eagerFilters =
			'[typeTransactionBank(selectColumns), employee(selectColumns), bankAccount(selectColumns), moduleOrigin(selectColumns), bank(selectColumns), typePayment(selectColumns), bankReconcilement(selectColumns), customer(selectColumns)]';
		let query = this.query()
			.eager(eagerFilters)
			.select(this.defaultColumns(), 'cc.name as cashName')
			.leftJoin('com_cash as cc', 'cc.id', `${this.tableName}.cash_id`)
			.leftJoin(
				'com_companies_bank_accounts',
				'com_companies_bank_accounts.id',
				`${this.tableName}.bank_account_id`,
			)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.type_transaction_bank_id`, filter.typeTransactionBank)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employee)
			.skipUndefined()
			.where(`${this.tableName}.bank_account_id`, filter.bankAccount)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleOrigin)
			.skipUndefined()
			.where(`${this.tableName}.bank_id`, filter.bankId)
			.skipUndefined()
			.where(`${this.tableName}.flag_reconcilement`, filter.flagReconcilement)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, filter.typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, filter.customerId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, filter.subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.type_entity_id`, filter.typeEntityId)
			.skipUndefined()
			.where(`${this.tableName}.amount`, filter.amount);

		if (filter.cashId) {
			query.where(`${this.tableName}.cash_id`, filter.cashId);
		}

		if (filter.cashIds) {
			query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
		}

		if (filter.salCashDeskClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId);
		}

		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}

		if (filter.closing) {
			query
				.whereNull(`${this.tableName}.sal_cash_desk_closing_id`)
				.whereNotNull(`${this.tableName}.type_movement`);
		}

		if (filter.entityStateId) {
			query.where(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}

		if (!filter.sortDirection) {
			query.orderBy(`${this.tableName}.payment_date`, 'DESC');
		}

		if (filter.bankAccountIds) {
			query.whereIn(`${this.tableName}.bank_account_id`, filter.bankAccountIds);
		}
		if (filter.bankReconcilementIds) {
			query.whereIn(`${this.tableName}.bank_reconcilement_id`, filter.bankReconcilementIds);
		}
		if (filter.typeTransactionBankIds) {
			query.whereIn(`${this.tableName}.type_transaction_bank_id`, filter.typeTransactionBankIds);
		}
		if (filter.moduleOriginIds) {
			query.whereIn(`${this.tableName}.module_origin_id`, filter.moduleOriginIds);
		}

		if (filter.startDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, filter.startDate);
		}

		if (filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, filter.endDate);
		}

		if (filter.reconciliationId) {
			query.where((builder) => {
				builder
					.where(`${this.tableName}.bank_reconcilement_id`, filter.reconciliationId)
					.orWhereNull(`${this.tableName}.bank_reconcilement_id`);
			});
		}

		if (filter.search) {
			query = this.match(query, filter.search, 'com_companies_bank_accounts');
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async create(data, Transaction = null, getReflexTypeTransactionId, flagAccredit = false) {
		const newTransaction = Object.assign({}, data);
		const balance = await this.lastBalance(newTransaction.companyId, newTransaction.bankAccountId);
		newTransaction.balance = balance + data.amount;
		let newTransactions = [newTransaction];
		const {
			bankDestinationId,
			cashDestinationId,
			warWarehousesId,
			subsidiaryId,
			warehouseId,
		} = newTransaction;
		delete newTransaction.bankDestinationId;
		delete newTransaction.cashDestinationId;
		delete newTransaction.warWarehousesId;
		let reflexCashTransaction = null;
		if (data.typeTransaction === transferToBank) {
			newTransaction.subsidiaryId = subsidiaryId;
			newTransaction.warehouseId = warWarehousesId || warehouseId;
			newTransactions = [newTransaction];
			const reflexTransaction = Object.assign({}, newTransaction);
			const balanceBankDestination = await this.lastBalance(
				newTransaction.companyId,
				bankDestinationId,
			);
			reflexTransaction.paymentAmount = data.paymentAmount * -1;
			reflexTransaction.amount = data.amount * -1;
			reflexTransaction.typeMovement = data.typeMovement === income ? expenses : income;
			reflexTransaction.bankAccountId = bankDestinationId;
			reflexTransaction.bankId = data.bankId;
			reflexTransaction.typeTransactionBankId = getReflexTypeTransactionId;
			reflexTransaction.balance = balanceBankDestination + reflexTransaction.amount;
			if (flagAccredit) {
				reflexTransaction.flagTransfer = 1;
			}
			const { typeTransaction, currency, amount } = reflexTransaction;
			reflexTransaction.concept =
				typeTransaction === transferToBank
					? `Transferencia de banco a banco por ${currency} ${amount}`
					: `Transacción a banco de ${currency} ${amount}`;
			newTransactions.push(reflexTransaction);
		} else if (data.typeTransaction === transferToBox) {
			if (Transaction) {
				reflexCashTransaction = { ...newTransaction };
				delete reflexCashTransaction.typeTransactionBankId;
				reflexCashTransaction.salSaleDocumentsId = reflexCashTransaction.salDocumentsId;
				delete reflexCashTransaction.salDocumentsId;
				delete reflexCashTransaction.inLineExtraData;
				reflexCashTransaction.bankId = data.bankId;
				reflexCashTransaction.paymentAmount = data.paymentAmount * -1;
				reflexCashTransaction.amount = data.amount * -1;
				reflexCashTransaction.stateId = finalized;
				reflexCashTransaction.cashId = cashDestinationId;
				reflexCashTransaction.typeMovement = income;
				const balanceCashDestination = await Transaction.lastBalance(
					newTransaction.companyId,
					cashDestinationId,
				);
				if (flagAccredit) {
					reflexCashTransaction.flagTransfer = 1;
				}
				reflexCashTransaction.balance = balanceCashDestination + reflexCashTransaction.amount;
				reflexCashTransaction.moduleOriginId = bank;
				reflexCashTransaction.concept = `Transferencia de banco a caja por ${data.currency || ''} ${
					reflexCashTransaction.amount
				}`;
				reflexCashTransaction.warWarehousesId = warWarehousesId || warehouseId;
			}
		} else {
			newTransaction.subsidiaryId = subsidiaryId;
			newTransaction.warehouseId = warWarehousesId || warehouseId;
			newTransaction.cashDestinationId = cashDestinationId;
			newTransaction.bankDestinationId = bankDestinationId;
			if (flagAccredit) {
				reflexCashTransaction.flagTransfer = 1;
			}
			const balanceBankDestination = await this.lastBalance(
				newTransaction.companyId,
				newTransaction.bankAccountId,
			);
			newTransaction.balance = balanceBankDestination + newTransaction.amount;
		}
		let transactionResponse = null;
		const knex = TransactionBank.knex();
		await transaction(knex, async (trx) => {
			transactionResponse = await this.query(trx).insertGraph(newTransactions);
			if (reflexCashTransaction) {
				await Transaction.query(trx).insert(reflexCashTransaction);
			}
		});
		return transactionResponse;
	}

	static updateCashDeskClosing(data, ids) {
		const query = this.query()
			.patch(data)
			.whereIn('id', ids);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[typeTransactionBank(selectColumns), employee(selectColumns), bankAccount(selectColumns), moduleOrigin(selectColumns), bank(selectColumns), typePayment(selectColumns), bankReconcilement(selectColumns), customer(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static edit(id, { data, bankAccountId, updateBalance }, companyId, tx) {
		const newData = data;
		if (newData.amount) {
			newData.paymentAmount = newData.amount;
		}
		const knex = TransactionBank.knex();
		return transaction(knex, () =>
			this.query(tx)
				.patch(newData)
				.where('company_id', companyId)
				.where('id', id)
				.then(() => BankAccount.updateBalance(companyId, bankAccountId, updateBalance)));
	}

	static editFlagReconcilement(ids, { flagReconcilement, bankReconcilementId }, companyId) {
		return this.query()
			.patch({ flagReconcilement, bankReconcilementId })
			.where('company_id', companyId)
			.whereIn('id', ids);
	}

	static updateStateOpeningClose(terminaleId) {
		return this.query()
			.patch({ stateOpening: 2 })
			.where('terminal_id', terminaleId)
			.where('state_opening', 1);
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
			.where('bank_account_id', bankAccountId)
			.orderBy('id', 'desc')
			.first();
		return lastBalance ? lastBalance.balance : 0;
	}

	static async lastBalanceRaw(companyId, bankAccountId, amount) {
		return raw(
			`${amount} + (COALESCE((SELECT tra.balance FROM com_transaction_bank AS tra WHERE tra.bank_account_id = ? AND tra.company_id = ? ORDER BY tra.id DESC LIMIT 1), 0))`,
			[bankAccountId, companyId],
		);
	}

	static lastBalanceMultiple(companyId, bankAccountId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('bank_account_id', bankAccountId)
			.orderBy('id', 'desc')
			.first();
	}

	static removeByDocument(purDocumentId, companyId) {
		return this.query()
			.softDelete()
			.where('company_id', companyId)
			.where('pur_documents_id', purDocumentId);
	}

	static getByDocument(purDocumentId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('pur_documents_id', purDocumentId);
	}

	static getAmountByTypeMovement(bankAccountId, filter = {}, companyId) {
		return this.query()
			.select(raw('type_movement, sum(amount) as amount'))
			.where('bank_account_id', bankAccountId)
			.where('company_id', companyId)
			.where('state_id', filter.stateId)
			.where(raw('type_movement is not null'))
			.groupBy('type_movement');
	}

	static getAmountByModule(bankAccountId, filter = {}, companyId) {
		const query = this.query()
			.select(raw(`${this.tableName}.module_origin_id as id, com_module.name, sum(amount) as amount`))
			.innerJoin('com_module', `${this.tableName}.module_origin_id`, 'com_module.id')
			.where(`${this.tableName}.bank_account_id`, bankAccountId)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.state_id`, filter.stateId)
			.where(raw(`${this.tableName}.module_origin_id is not null`))
			.groupBy(`${this.tableName}.module_origin_id`);

		if (filter.typeMovement) {
			query.where(`${this.tableName}.type_movement`, filter.typeMovement);
		}
		return query;
	}

	static getAmountByTypeTransaction(bankAccountId, filter = {}, companyId) {
		const query = this.query()
			.select(raw(`${this.tableName}.type_transaction_bank_id as id, ms_type_transaction_bank.name, sum(${
				this.tableName
			}.amount) as amount`))
			.innerJoin(
				'ms_type_transaction_bank',
				`${this.tableName}.type_transaction_bank_id`,
				'ms_type_transaction_bank.id',
			)
			.where(`${this.tableName}.bank_account_id`, bankAccountId)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.state_id`, filter.stateId)
			.where(raw(`${this.tableName}.type_transaction_bank_id is not null`))
			.groupBy(`${this.tableName}.type_transaction_bank_id`);

		if (filter.typeMovement) {
			query.where(`${this.tableName}.type_movement`, filter.typeMovement);
		}
		return query;
	}

	static isDocumentNumberIn(documentNumber, companyId, id) {
		return this.query()
			.select('company_id', 'document_number')
			.skipUndefined()
			.where('id', '!=', id)
			.where('document_number', documentNumber)
			.where('company_id', companyId)
			.first();
	}

	static validReconcilement(
		ids,
		companyId,
		flagReconcilement = Reconcilement.reconcilement,
		reconcilementId,
	) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.where('company_id', companyId)
			.skipUndefined()
			.where('bank_reconcilement_id', reconcilementId)
			.where('flag_reconcilement', '!=', flagReconcilement);
	}

	static getTotalAmount(companyId, filter) {
		const query = this.query()
			.select(raw(`SUM(${this.tableName}.amount) AS totalBank, ANY_VALUE(cash_id) as cash_id`))
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('bank_account_id', filter.bankAccount)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('currency', filter.currency)
			.where('company_id', companyId);

		if (filter.stateOpening) {
			query.where(`${this.tableName}.state_opening`, filter.stateOpening);
		}

		if (filter.notStateOpening) {
			query.whereNotNull(`${this.tableName}.sal_cash_desk_closing_id`).where((builder) => {
				builder
					.where(`${this.tableName}.state_opening`, '!=', filter.notStateOpening)
					.orWhereRaw(`${this.tableName}.state_opening IS NULL`);
			});
		}

		if (filter.flagReconcilement) {
			query.where('flag_reconcilement', filter.flagReconcilement);
		}

		if (filter.typeTransactionBankId) {
			query.where('type_transaction_bank_id', filter.typeTransactionBankId);
		}

		if (filter.bankId) {
			query.where('bank_id', filter.bankId);
		}

		if (filter.cashId) {
			query.where('cash_id', filter.cashId);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		return query;
	}

	static getAmountByEmployeeAndTypeMovement(cashId, filter = {}, companyId) {
		const query = this.query()
			.where('company_id', companyId)
			.where('currency', filter.currency)
			.where('state_id', filter.stateId)
			.where('cash_id', cashId)
			.whereNotNull('type_movement')
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId);

		if (filter.employeeId) {
			query.select(raw('type_movement, employee_id = ? AS isEmployee, SUM(amount) AS amount', [
				filter.employeeId,
			]));
		} else {
			query.select(raw('type_movement, SUM(amount) AS amount'));
		}

		if (filter.stateOpening) {
			if (filter.stateOpening === 1 && filter.report && filter.salCashDeskClosingId) {
				query.whereRaw(`(state_opening = ${
					filter.stateOpening
				} OR state_opening is null) AND sal_cash_desk_closing_id = ${
					filter.salCashDeskClosingId
				}`);
			} else {
				query.where(`${this.tableName}.state_opening`, filter.stateOpening);
			}
		}

		if (filter.cashClosingId) {
			query.where('sal_cash_desk_closing_id', filter.cashClosingId);
		} else {
			query.whereNull('sal_cash_desk_closing_id');
		}

		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}

		if (filter.employeeId) {
			query.groupBy(raw('type_movement, employee_id = ?', [filter.employeeId]));
		} else {
			query.groupBy('type_movement');
		}
		return query;
	}

	static getAmountByTypePayment(cashId, filter = {}, companyId) {
		const columns = filter.dashboard
			? raw(`ANY_VALUE(${
				this.tableName
			}.type_payment_id) as id, ANY_VALUE(com_ms_type_payments.name) as name, ANY_VALUE(com_ms_type_payments.code) as code, ANY_VALUE(com_ms_type_payments.type_payment_id) as type_payment_id, sum(amount) as amount, ANY_VALUE(com_ms_type_payments.flag_form) as flag_form, ${
				this.tableName
			}.type_movement, count(${this.tableName}.type_movement) as type_movement_count`)
			: raw(`ANY_VALUE(${
				this.tableName
			}.type_payment_id) as id, ANY_VALUE(com_ms_type_payments.name) as name, ANY_VALUE(com_ms_type_payments.code) as code, ANY_VALUE(com_ms_type_payments.type_payment_id) as type_payment_id, sum(amount) as amount, ANY_VALUE(com_ms_type_payments.flag_form) as flag_form`);
		const query = this.query()
			.select(columns)
			.innerJoin(
				'com_ms_type_payments',
				`${this.tableName}.type_payment_id`,
				'com_ms_type_payments.id',
			)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, cashId)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.currency`, filter.currency)
			.where(`${this.tableName}.state_id`, filter.stateId)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleId)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('employee_id', filter.employeeId);

		if (filter.dashboard) {
			query.groupBy(['com_ms_type_payments.code', `${this.tableName}.type_movement`]);
		}

		if (filter.startDate && filter.endDate) {
			query.whereBetween(`${this.tableName}.payment_date`, [filter.startDate, filter.endDate]);
		}

		if (filter.stateOpening) {
			if (filter.stateOpening === 1 && filter.report && filter.salCashDeskClosingId) {
				query.whereRaw(`(state_opening = ${
					filter.stateOpening
				} OR state_opening is null) AND sal_cash_desk_closing_id = ${
					filter.salCashDeskClosingId
				}`);
			} else {
				query.where(`${this.tableName}.state_opening`, filter.stateOpening);
			}
		}

		if (filter.cashClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashClosingId);
		} else if (!filter.report) {
			query.where(raw(`${this.tableName}.sal_cash_desk_closing_id is null`));
		}

		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}
		return query;
	}

	static getByTypePayment(typePaymentIds, currency, companyId, filter) {
		const query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('state_id', filter.stateId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('cash_id', filter.cashId)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.where('company_id', companyId)
			.where('currency', currency)
			.whereIn('type_payment_id', typePaymentIds);

		if (filter.stateOpening) {
			if (filter.stateOpening === 1 && filter.salCashDeskClosingId) {
				query.whereRaw(`(state_opening = ${
					filter.stateOpening
				} OR state_opening is null) AND sal_cash_desk_closing_id = ${
					filter.salCashDeskClosingId
				}`);
			} else {
				query.where(`${this.tableName}.state_opening`, filter.stateOpening);
			}
		}
		if (filter.salCashDeskClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId);
		} else if (filter.closing) {
			query.whereNull(`${this.tableName}.sal_cash_desk_closing_id`);
		}
		return query;
	}

	static getTransactionByBankId(bankAccountId, companyId) {
		return this.query()
			.where('company_id', companyId)
			.where('bank_account_id', bankAccountId)
			.first();
	}

	static editBySale(companyId, saleId, data, tx) {
		return this.query(tx)
			.patch(data)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.sal_documents_id`, saleId);
	}

	async $afterInsert(queryContext) {
		try {
			if (this.typeAmortization === TypeAmortization.simple) {
				const newDate = new Date(this.paymentDate);
				const dataAmortizations = [];
				dataAmortizations.push({
					amount: this.amount,
					bankAccountId: this.bankAccountId,
					employeeId: this.employeeId,
					observations: this.concept,
					paymentDate: this.paymentDate ? helper.localDate(newDate) : this.createdAt,
					typePaymentId: this.typePaymentId,
					purDocumentId: this.purDocumentsId ? this.purDocumentsId : null,
					salDocumentId: this.salDocumentsId ? this.salDocumentsId : null,
					companyId: this.companyId,
				});

				const {
					subsidiaryId,
					description,
					emissionDate,
					expiratedAt,
					typeDocumentCode,
					countryId,
				} = this.additionalInformation;

				const amortization = {
					amount: this.amount,
					comEmployeeId: this.employeeId,
					typePaymentId: this.typePaymentId,
					companyId: this.companyId,
					amortizationDetails: dataAmortizations,
					currency: this.currency,
					moduleId: this.moduleOriginId,
					typeAmortization: this.typeAmortization,
					transactionBankId: this.id,
					warehouseId: this.warWarehousesId || this.warehouseId,
					subsidiaryId,
				};
				if (this.additionalInformation && countryId && typeDocumentCode) {
					const typeTransaction = await MsTypeTransaction.getByCode(
						typeDocumentCode,
						countryId,
						undefined,
						queryContext.transaction,
					);
					if (typeTransaction) {
						const documentAccountStatus = {
							customerId: this.typeEntityId === 2 ? this.entityExternalId : null,
							supplierId: this.typeEntityId === 3 ? this.entityExternalId : null,
							moduleId: this.moduleOriginId,
							subsidiaryId,
							warehouseId: this.warWarehousesId || this.warehouseId,
							employeeId: this.employeeId,
							documentNumber: this.documentNumber,
							dueAmount: this.amount,
							currency: this.currency,
							amount: this.amount,
							description,
							emissionDate,
							receptionDate: emissionDate,
							reference: this.documentNumber,
							companyId: this.companyId,
							paymentDate: this.paymentDate,
							expirationDate: expiratedAt,
							concept: this.concept,
							saleDocumentId: this.salDocumentsId ? this.salDocumentsId : null,
							purDocumentId: this.purDocumentsId ? this.purDocumentsId : null,
							typeTransactionId: typeTransaction.id,
							status: PaymentState.payOut,
						};
						amortization.documentAccountStatus = documentAccountStatus;
					}
				}

				if (this.typeEntityId === 2) {
					amortization.customerId = this.entityExternalId;
				} else if (this.typeEntityId === 3) {
					amortization.supplierId = this.entityExternalId;
				}
				const newTx = {
					id: this.id,
					amortization,
				};
				const options = {
					noDelete: false,
					unrelate: false,
				};
				return TransactionBank.query(queryContext.transaction).upsertGraph(newTx, options);
			}
			return this;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static createSimple(data) {
		return this.query().insert(data);
	}

	static getPayloadAccountingSeat({ newTransaction, subsidiary }) {
		let transactionBank;
		if (Array.isArray(newTransaction) && newTransaction.length > 0) {
			[transactionBank] = newTransaction;
		} else {
			transactionBank = newTransaction;
		}
		return {
			currency: transactionBank.currency,
			data: transactionBank,
			dateRegister: transactionBank.createdAt,
			documentNumber: transactionBank.documentNumber,
			reference: transactionBank.documentReference,
			typeAccounting: subsidiary.flagAccountingAutomatic ? 1 : 0,
			amount: transactionBank.amount,
			moduleCode: bank,
			ruc: subsidiary.ruc,
			configIntegrations: subsidiary.configIntegrations,
			codeAccounting: 'transactionBank',
		};
	}

	static exportExcelTransactionBank({
		companyId,
		startDate,
		endDate,
		warehouseIds,
		typeTransactionBank,
		employee,
		bankAccount,
		moduleOrigin,
		bankId,
		flagReconcilement,
		typePaymentId,
		customerId,
		typeMovement,
		subsidiaryId,
	}) {
		const tdColumns = [
			'com_companies_bank_accounts.account_number',
			'com_transaction_bank.created_at',
			'com_module.name as module_name',
			'ms_type_transaction_bank.code as typeTransactionBankCode',
			'ms_type_transaction_bank.name as typeTransactionBankName',
			'com_transaction_bank.document_number',
			'com_transaction_bank.in_line_extra_data as comment',
			'com_transaction_bank.amount',
			'com_transaction_bank.concept',
		];
		const query = this.query()
			.select(tdColumns)
			.leftJoin(
				'com_companies_bank_accounts',
				'com_companies_bank_accounts.id',
				`${this.tableName}.bank_account_id`,
			)
			.join('com_module', 'com_module.id', `${this.tableName}.module_origin_id`)
			.join(
				'ms_type_transaction_bank',
				'ms_type_transaction_bank.id',
				`${this.tableName}.type_transaction_bank_id`,
			)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.type_transaction_bank_id`, typeTransactionBank)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, employee)
			.skipUndefined()
			.where(`${this.tableName}.bank_account_id`, bankAccount)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, moduleOrigin)
			.skipUndefined()
			.where(`${this.tableName}.bank_id`, bankId)
			.skipUndefined()
			.where(`${this.tableName}.flag_reconcilement`, flagReconcilement)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, customerId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, subsidiaryId)
			.orderBy(`${this.tableName}.payment_date`, 'DESC');
		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}
		if (warehouseIds) {
			query.whereIn(`${this.tableName}.warehouse_id`, warehouseIds);
		}
		return query;
	}

	static buildTransaction(
		amount,
		bankAccountId,
		companyId,
		{
			isWithholding, typePaymentId, currency, employeeId, subsidiaryId,
		},
	) {
		const extraConcept = isWithholding ? ' por retenciones y comisiones' : '';
		return {
			salDocumentsId: null,
			paymentAmount: amount,
			amount,
			typeMovement: income,
			bankAccountId,
			balance: this.lastBalanceRaw(companyId, bankAccountId, amount),
			typeTransaction: TypeTransactionCash.normalTransaction,
			stateId: 2, // TODO obtain from enum (finished)
			companyId,
			typePaymentId,
			moduleOriginId: ModuleCode.bank,
			concept: `Transacción a banco de ${currency} ${amount}${extraConcept}`,
			employeeId,
			subsidiaryId,
			currency,
			additionalInformation: null,
			paymentDate: new Date(),
			purDocumentsId: null,
			entityExternalId: null,
			documentNumber: null,
			typeEntityId: null,
			accountingSeatCode: null,
			reference: null,
			documentReference: null,
			transferredTransactions: null,
			typeTransactionBankId: null,
			urlImage: null,
		};
	}

	static removeAll(idSale, companyId) {
		return this.query()
			.softDelete()
			.where(`${this.tableName}.sal_documents_id`, idSale)
			.skipUndefined()
			.where(`${this.tableName}.company_id`, companyId);
	}
}

module.exports = TransactionBank;
