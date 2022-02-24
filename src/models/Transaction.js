'use strict';

const baseModel = require('./base');
const { Model, raw, transaction } = require('objection');
const TypeMovement = require('./TypeMovement');
const TypeTransactionCash = require('./TypeTransactionCash');
const TransactionBank = require('./TransactionBank');
const SalSeries = require('./SalSeries');
const { finalized } = require('./MsTransactionStates');
const helper = require('./helper');
const TypeAmortization = require('./TypeAmortization');
const MsTypeTransaction = require('./MsTypeTransaction');
const TransactionState = require('./TransactionStates');
const TypePayment = require('./MsTypePayment');
const Cash = require('./Cash');
const Module = require('./Module');
const PaymentState = require('./PaymentState');
const {
	registered, canceled, pending, accounted,
} = require('./EntityStateCode');
const transactionStates = require('./enums/transaction-states-enum');
const { credit } = require('./PaymentMethodCode');
const { isNullOrUndefined } = require('../shared/helper');

class Transaction extends baseModel {
	static get tableName() {
		return 'sal_transactions';
	}

	static get relationMappings() {
		return {
			saleDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_transactions.sal_sale_documents_id',
					to: 'sal_documents.id',
				},
			},
			state: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TransactionStates.js`,
				join: {
					from: 'sal_transactions.state_id',
					to: 'sal_transactions_states.id',
				},
			},
			typePayment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'sal_transactions.type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'sal_transactions.cash_id',
					to: 'com_cash.id',
				},
			},
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'sal_transactions.module_origin_id',
					to: 'com_module.id',
				},
			},
			paymentMethod: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PaymentMethod.js`,
				join: {
					from: 'sal_transactions.payment_method_id',
					to: 'sal_method_payments.id',
				},
			},
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'sal_transactions.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			bank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComMsBank.js`,
				join: {
					from: 'sal_transactions.bank_id',
					to: 'com_ms_banks.id',
				},
			},
			amortization: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Amortization.js`,
				join: {
					from: 'sal_transactions.id',
					to: 'ca_amortizations.transaction_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['stateId', 'amount', 'currency', 'typePaymentId'],
			properties: {
				additionalInformation: {
					type: ['object', 'null'],
				},
				salSaleDocumentsId: {
					type: ['integer', 'null'],
				},
				stateId: {
					type: 'integer',
				},
				typePaymentId: {
					type: ['integer', 'null'],
				},
				paymentDate: {
					type: 'date',
				},
				paymentAmount: {
					type: 'number',
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				salCashDeskClosingId: {
					type: ['integer', 'null'],
				},
				hashOffline: {
					type: ['string', 'null'],
				},
				typeMovement: {
					type: ['integer', 'null'],
					default: 1,
				},
				cashId: {
					type: ['integer', 'null'],
				},
				typeAmortization: {
					type: ['integer', 'null'],
					enum: [1, 2, 3, null],
					default: null,
				},
				moduleOriginId: {
					type: ['integer', 'null'],
				},
				concept: {
					type: ['string', 'null'],
				},
				purDocumentsId: {
					type: ['integer', 'null'],
				},
				ntcDocumentId: {
					type: ['integer', 'null'],
				},
				entityExternalId: {
					type: ['integer', 'null'],
				},
				typeTransaction: {
					type: ['integer', 'null'],
				},
				flagTransfer: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				currency: {
					type: 'string',
				},
				typeEntityId: {
					type: ['integer', 'null'],
				},
				accountingSeatCode: {
					type: ['string', 'null'],
				},
				reference: {
					type: ['string', 'null'],
				},
				documentReference: {
					type: ['string', 'null'],
				},
				transferredTransactions: {
					type: ['array', 'null'],
				},
				balance: {
					type: 'decimal',
					default: 0,
				},
				paymentMethodId: {
					type: ['integer', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				documents: {
					type: ['array', 'null'],
				},
				dataGateway: {
					type: ['object', 'null'],
				},
				subsidiaryId: {
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
				transactionsExternalId: {
					type: ['integer', 'null'],
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				accountingSeat: {
					type: ['object', 'null'],
				},
				flagTrigger: {
					type: ['boolean', 'integer', 'null'],
					default: true,
				},
				originCashId: {
					type: ['integer', 'null'],
				},
				...defaultsProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'sal_sale_documents_id',
			'state_id',
			'type_payment_id',
			'payment_date',
			'payment_amount',
			'terminal_id',
			'currency',
			'amount',
			'additional_information',
			'war_warehouses_id',
			'employee_id',
			'created_at',
			'sal_cash_desk_closing_id',
			'hash_offline',
			'type_movement',
			'cash_id',
			'module_origin_id',
			'concept',
			'pur_documents_id',
			'entity_external_id',
			'ntc_document_id',
			'type_transaction',
			'flag_transfer',
			'document_number',
			'type_entity_id',
			'accounting_seat_code',
			'reference',
			'document_reference',
			'balance',
			'payment_method_id',
			'type_amortization',
			'code',
			'bank_account_id',
			'bank_id',
			'url_image',
			'documents',
			'data_gateway',
			'subsidiary_id',
			'entity_state_id',
			'transactions_external_id',
			'accounting_account',
			'accounting_seat',
			'flag_trigger',
			'state_opening',
			'origin_cash_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static basicColumns(otherColumns = []) {
		let columns = [
			'id',
			'payment_date',
			'payment_amount',
			'currency',
			'amount',
			'type_payment_id',
			'additional_information',
			'war_warehouses_id',
			'type_movement',
			'module_origin_id',
			'concept',
			'type_transaction',
			'flag_transfer',
			'document_number',
			'type_entity_id',
			'accounting_seat_code',
			'reference',
			'document_reference',
			'payment_method_id',
			'code',
			'url_image',
			'origin_cash_id',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static get virtualAttributes() {
		return [
			'currencySymbol',
			'typeMovementName',
			'typeEntityName',
			'entityStateName',
			'documentNumberOrigin',
		];
	}

	get currencySymbol() {
		let name;
		switch (this.currency) {
		case 'PEN':
			name = 'S/';
			break;
		case 'USD':
			name = '$';
			break;
		default:
			break;
		}
		return name;
	}

	get typeMovementName() {
		let name;
		switch (this.typeMovement) {
		case 1:
			name = 'Ingreso';
			break;
		case 2:
			name = 'Egreso';
			break;
		default:
			break;
		}
		return name;
	}

	get typeEntityName() {
		let name;
		switch (this.typeEntityId) {
		case 1:
			name = 'Empleado';
			break;
		case 2:
			name = 'Cliente';
			break;
		case 3:
			name = 'Proveedor';
			break;
		default:
			break;
		}
		return name;
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

	static match(query, search) {
		query.whereRaw(
			'MATCH(document_number, concept, document_reference, reference, accounting_seat_code, code) AGAINST(?)',
			[search],
		);
		return query;
	}

	static getAllTypePayment(filter, companyId, status, typeDocument) {
		let query = this.query()
			.select(`${this.tableName}.type_payment_id`, `${this.tableName}.sal_sale_documents_id`)
			.sum(`${this.tableName}.amount as amount`)
			.innerJoin('sal_documents', `${this.tableName}.sal_sale_documents_id`, 'sal_documents.id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.where(`${this.tableName}.state_id`, this.finished)
			.where('sal_documents.sal_states_id', status)
			.where('sal_documents.sal_type_document_id', '!=', typeDocument)
			.groupBy(`${this.tableName}.type_payment_id`, `${this.tableName}.sal_sale_documents_id`);

		if (filter.search) {
			query = this.match(query, filter.search);
		}

		return query;
	}

	static getAllTypeDocument(filter, companyId, states, typeDocument = []) {
		let query = this.query()
			.select(raw('sal_documents.sal_type_document_id as typeDocumentId, sum(sal_transactions.amount) as total, count(sal_transactions.id) as quantity'))
			.innerJoin('sal_documents', `${this.tableName}.sal_sale_documents_id`, 'sal_documents.id')
			.skipUndefined()
			.where('sal_documents.com_employee_id', filter.comEmployeeId)
			.where('sal_documents.com_company_id', companyId)
			.where('sal_documents.sal_states_id', states)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupBy('sal_documents.sal_type_document_id');

		if (typeDocument.length > 0) {
			query.whereNotIn('sal_documents.sal_type_document_id', typeDocument);
		}

		if (filter.search) {
			query = this.match(query, filter.search);
		}

		return query;
	}

	static get pending() {
		return 1;
	}

	static get finished() {
		return 2;
	}

	static get canceled() {
		return 3;
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);

		if (filter.search) {
			query = this.match(query, filter.search);
		}

		return query;
	}

	static async create(data, flagAccredit, transactionsExternalId) {
		try {
			const newTransaction = Object.assign({}, data);
			const balanceRaw = this.lastBalanceRaw(
				newTransaction.companyId,
				newTransaction.cashId,
				data.currency,
				data.amount,
			);
			newTransaction.stateId =
				newTransaction.stateId !== this.canceled ? this.finished : this.canceled;
			newTransaction.balance = balanceRaw;
			delete newTransaction.typeTransactionBankId;
			delete newTransaction.bankDestinationId;

			// eslint-disable-next-line max-len
			// newTransaction.flagTransfer = isNullOrUndefined(newTransaction.flagTransfer) && flagAccredit ?
			// 	flagAccredit : newTransaction.flagTransfer;

			let newTransactionBank;
			const serieUpdateId = newTransaction.cashId;
			let serieUpdateReflexId;
			let reflexTransaction;
			if (data.typeTransaction === TypeTransactionCash.transferToBox) {
				const { cashDestinationId, warWarehousesIdDestination } = newTransaction;
				delete newTransaction.cashDestinationId;
				delete newTransaction.warWarehousesIdDestination;
				reflexTransaction = Object.assign({}, newTransaction);
				delete reflexTransaction.salCashDeskClosingId;
				reflexTransaction.paymentAmount = data.paymentAmount * -1;
				reflexTransaction.amount = data.amount * -1;
				reflexTransaction.typeMovement =
					data.typeMovement === TypeMovement.income ? TypeMovement.expenses : TypeMovement.income;
				reflexTransaction.cashId = cashDestinationId;
				reflexTransaction.warWarehousesId = warWarehousesIdDestination;
				const balanceCashDestinationRaw = this.lastBalanceRaw(
					newTransaction.companyId,
					cashDestinationId,
					data.currency,
					reflexTransaction.amount,
				);
				reflexTransaction.balance = balanceCashDestinationRaw;

				serieUpdateReflexId = cashDestinationId;
			} else if (data.typeTransaction === TypeTransactionCash.transferToBank) {
				newTransactionBank = Object.assign({}, data);
				newTransactionBank.salDocumentsId = newTransactionBank.salSaleDocumentsId;
				delete newTransactionBank.salSaleDocumentsId;
				delete newTransactionBank.cashId;
				delete newTransactionBank.cashDestinationId;
				delete newTransactionBank.warWarehousesIdDestination;
				const { bankDestinationId } = newTransactionBank;
				delete newTransactionBank.bankDestinationId;
				delete newTransactionBank.warWarehousesId;
				const balanceBank = await TransactionBank.lastBalance(
					newTransaction.companyId,
					bankDestinationId,
				);
				newTransactionBank.paymentAmount = data.paymentAmount * -1;
				newTransactionBank.amount = data.amount * -1;
				newTransactionBank.typeMovement = TypeMovement.income;
				newTransactionBank.bankAccountId = bankDestinationId;
				newTransactionBank.balance = balanceBank + newTransactionBank.amount;
				newTransactionBank.typeTransaction = TypeTransactionCash.normalTransaction;
				newTransactionBank.stateId = this.finished;
			}
			const ids = data.transferredTransactions;
			const transactionsResponse = await transaction(
				this,
				TransactionBank,
				SalSeries,
				async (TransactionTx, TransactionBankTx, SalSeriesTx) => {
					let newSerie = await SalSeriesTx.getByCash(serieUpdateId, newTransaction.companyId);
					if (newSerie) {
						newSerie = await SalSeriesTx.editNumberById(newSerie.id, newTransaction.companyId);
						newTransaction.code = newSerie.number;
					}
					const newTransactions = [newTransaction];
					if (serieUpdateReflexId) {
						let newSerie2 = await SalSeriesTx.getByCash(
							serieUpdateReflexId,
							newTransaction.companyId,
						);
						if (newSerie2) {
							newSerie2 = await SalSeriesTx.editNumberById(newSerie2.id, newTransaction.companyId);
							reflexTransaction.code = newSerie2.number;
						}
						newTransactions.push(reflexTransaction);
					}
					const newTransactionResponse = await TransactionTx.query().insertGraph(newTransactions);
					if (
						ids &&
						ids.length > 0 &&
						data.typeTransaction === TypeTransactionCash.transferToBank
					) {
						await TransactionTx.editFlagTransferMultiple(ids, data.companyId);
					}
					if (
						ids &&
						ids.length > 0 &&
						flagAccredit &&
						data.typeTransaction === TypeTransactionCash.transferToBox
					) {
						await TransactionTx.editFlagTransferMultiple(
							ids,
							data.companyId,
							flagAccredit,
							transactionsExternalId,
						);
					}
					if (data.typeTransaction === TypeTransactionCash.transferToBank) {
						const transactionBank = await TransactionBankTx.create(newTransactionBank);
						if (Array.isArray(newTransactionResponse)) {
							newTransactionResponse.push(...transactionBank);
						}
					}
					return newTransactionResponse;
				},
			);
			return transactionsResponse;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async createReflexToCash(data, transactionsReflexToCash) {
		try {
			const { transactionReflex, totalTransation, ids } = transactionsReflexToCash;
			const newTransactions = transactionReflex;
			const newTransaction = Object.assign({}, data);
			// Verificar saldo actual de la caja suma todas las transactiones
			const balanceRaw = this.lastBalanceRaw(
				newTransaction.companyId,
				newTransaction.cashId,
				data.currency,
				data.amount - totalTransation,
			);
			newTransaction.stateId =
				newTransaction.stateId !== this.canceled ? this.finished : this.canceled;
			newTransaction.balance = balanceRaw;

			const serieUpdateId = newTransaction.cashId;
			const { cashDestinationId, warWarehousesIdDestination } = newTransaction;
			delete newTransaction.cashDestinationId;
			delete newTransaction.warWarehousesIdDestination;
			delete newTransaction.typeTransactionBankId;
			delete newTransaction.bankDestinationId;

			const reflexTransaction = Object.assign({}, newTransaction);
			delete reflexTransaction.salCashDeskClosingId;
			reflexTransaction.paymentAmount = data.paymentAmount * -1;
			reflexTransaction.amount = data.amount * -1;
			reflexTransaction.typeMovement =
				data.typeMovement === TypeMovement.income ? TypeMovement.expenses : TypeMovement.income;
			reflexTransaction.cashId = cashDestinationId;
			reflexTransaction.warWarehousesId = warWarehousesIdDestination;

			// Aumenta saldo de caja destino
			const balanceCashDestinationRaw = this.lastBalanceRaw(
				newTransaction.companyId,
				cashDestinationId,
				data.currency,
				reflexTransaction.amount + totalTransation,
			);
			reflexTransaction.balance = balanceCashDestinationRaw;

			const serieUpdateReflexId = cashDestinationId;
			const transactionsResponse = await transaction(
				this,
				SalSeries,
				async (TransactionTx, SalSeriesTx) => {
					let newSerie = await SalSeriesTx.getByCash(serieUpdateId, newTransaction.companyId);
					if (newSerie) {
						newSerie = await SalSeriesTx.editNumberById(newSerie.id, newTransaction.companyId);
						newTransaction.code = newSerie.number;
					}
					newTransactions.push(newTransaction);
					if (serieUpdateReflexId) {
						let newSerie2 = await SalSeriesTx.getByCash(
							serieUpdateReflexId,
							newTransaction.companyId,
						);
						if (newSerie2) {
							newSerie2 = await SalSeriesTx.editNumberById(newSerie2.id, newTransaction.companyId);
							reflexTransaction.code = newSerie2.number;
						}
						newTransactions.push(reflexTransaction);
					}
					const newTransactionResponse = await TransactionTx.query().insertGraph(newTransactions);
					await TransactionTx.updateMultiple(ids, data.companyId, {
						cashId: cashDestinationId,
						warWarehousesId: warWarehousesIdDestination,
						balance: 0,
						stateOpening: null,
						salCashDeskClosingId: null,
					});
					return newTransactionResponse;
				},
			);
			return transactionsResponse;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[saleDocument(selectColumns).[customer(selectColumns), details(selectColumns), typeDocument(documentTypeData), payment(selectColumns)], state(selectColumns), typePayment(selectColumns), cash(selectColumns), module(selectColumns), paymentMethod(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static exportExcelTransaction({
		companyId,
		startDate,
		endDate,
		warehouseIds,
		employee,
		bankAccount,
		moduleOrigin,
		bankId,
		typePaymentId,
		typeMovement,
		subsidiaryId,
	}) {
		const tdColumns = [
			'com_companies_bank_accounts.account_number',
			'sal_transaction.created_at',
			'com_module.name as module_name',
			'ms_type_transaction_bank.code as typeTransactionBankCode',
			'ms_type_transaction_bank.name as typeTransactionBankName',
			'sal_transaction.document_number',
			'sal_transaction.amount',
			'sal_transaction_bank.concept',
			'JSON_EXTRACT(IFNULL(sal_transaction.additional_info, "{}"), "$.comment") as comment',
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
			.where(`${this.tableName}.employee_id`, employee)
			.skipUndefined()
			.where(`${this.tableName}.bank_account_id`, bankAccount)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, moduleOrigin)
			.skipUndefined()
			.where(`${this.tableName}.bank_id`, bankId)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, typePaymentId)
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

	static getByIds(ids, companyId, filter = { stateId: transactionStates.finalized }) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('state_id', filter.stateId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.whereIn('type_payment_id', filter.typePaymentIds)
			.whereIn('id', ids);
	}

	static createMultiple(data, trx) {
		return this.query(trx).insertGraph(data);
	}

	static createSimple(data) {
		return this.query().insert(data);
	}

	static setSale(ids, salSaleDocumentsId, companyId) {
		return this.query()
			.patch({ salSaleDocumentsId, stateId: this.finished })
			.whereIn('id', ids)
			.where('state_id', this.pending)
			.where('company_id', companyId);
	}

	static getEmployeeWareHouse(companyId, stateId, currency, filter = {}) {
		let query = this.query()
			.distinct(
				`${this.tableName}.war_warehouses_id`,
				`${this.tableName}.employee_id`,
				`${this.tableName}.currency`,
			)
			.select(raw(`sum(${this.tableName}.payment_amount) as amountTotal`))
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.state_id`, stateId)
			.where(raw(`${this.tableName}.war_warehouses_id is not null`))
			.where(raw(`${this.tableName}.employee_id is not null`))
			.where(`${this.tableName}.sal_cash_desk_closing_id`, null)
			.skipUndefined()
			.where(`${this.tableName}.currency`, currency)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId)
			.groupBy(raw(`${this.tableName}.war_warehouses_id, ${this.tableName}.employee_id, ${
				this.tableName
			}.currency`));

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.payment_date, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.payment_date, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getListCashClosing(companyId, stateId, currency, filter = {}) {
		const saleTable = 'sal_documents';
		let query = this.query()
			.eager('[saleDocument(selectColumns).[customer(selectColumns), details(selectColumns), typeDocument(documentTypeData), payment(selectColumns)], state(selectColumns), typePayment(selectColumns), paymentMethod(selectColumns), cash(selectColumns), module(selectColumns)]')
			.select(this.defaultColumns())
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.state_id`, stateId)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, filter.cashId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, currency)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, filter.typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleOriginId)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, filter.subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.amount`, filter.amount)
			.skipUndefined()
			.where(`${this.tableName}.type_entity_id`, filter.typeEntityId)
			.orderBy('id', 'desc');

		if (filter.entityStateId) {
			query.where(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}
		if (filter.stateIds && filter.stateIds.length > 0) {
			query.whereIn('state_id', filter.stateIds);
		}
		if (filter.cashIds) {
			query.whereIn('cash_id', filter.cashIds);
		}
		if (filter.typePaymentIds) {
			query.whereIn('type_payment_id', filter.typePaymentIds);
		}
		if (filter.moduleIds) {
			query.whereIn('module_origin_id', filter.moduleIds);
		}
		if (filter.typeMovements) {
			query.whereIn(`${this.tableName}.type_movement`, filter.typeMovements);
		}
		if (filter.salTypeDocumentId) {
			query
				.join(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
				.where(`${saleTable}.sal_type_document_id`, filter.salTypeDocumentId);
		}
		if (filter.closing) {
			query
				.whereNull(`${this.tableName}.sal_cash_desk_closing_id`)
				.whereNotNull(`${this.tableName}.type_movement`);
			if (filter.paymentMethodId) {
				query.where((builder) => {
					builder
						.where(`${this.tableName}.payment_method_id`, '!=', filter.paymentMethodId)
						.orWhereRaw(`${this.tableName}.payment_method_id IS NULL`);
				});
			}
		} else {
			query.skipUndefined().where(`${this.tableName}.payment_method_id`, filter.paymentMethodId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, filter.endDate);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		if (filter.typePaymentCodes) {
			const msTypePaymentTable = 'com_ms_type_payments';
			query
				.join(
					`${msTypePaymentTable}`,
					`${msTypePaymentTable}.id`,
					`${this.tableName}.type_payment_id`,
				)
				.whereIn(`${msTypePaymentTable}.code`, filter.typePaymentCodes);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static lastBalanceClosing(companyId, cashId, currency, filter = {}) {
		const query = this.query()
			.select(raw(`${this.tableName}.cash_id as id, sum(amount) as amount, ${this.tableName}.currency`))
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.state_id`, filter.stateId)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, cashId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, currency)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, filter.typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleOriginId)
			.groupBy(`${this.tableName}.currency`)
			.first();

		if (filter.typePaymentIds) {
			query.whereIn('type_payment_id', filter.typePaymentIds);
		}

		if (filter.moduleIds) {
			query.whereIn('module_origin_id', filter.moduleIds);
		}

		if (filter.closing) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, null);
			if (filter.paymentMethodId) {
				query.where((builder) => {
					builder
						.where(`${this.tableName}.payment_method_id`, '!=', filter.paymentMethodId)
						.orWhereRaw(`${this.tableName}.payment_method_id IS NULL`);
				});
			}
		} else {
			query.skipUndefined().where(`${this.tableName}.payment_method_id`, filter.paymentMethodId);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, filter.endDate);
		}
		return query;
	}

	static getQuantityOfTransactions(companyId, startDate, endDate) {
		const query = this.query().where('company_id', companyId);

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

		return query.count('*').first();
	}

	static updateCashDeskClosing(data, ids) {
		const query = this.query()
			.patch(data)
			.whereIn('id', ids);
		return query;
	}

	static updateStateOpeningClose(terminaleId) {
		return this.query()
			.patch({ stateOpening: 2 })
			.where('terminal_id', terminaleId)
			.where('state_opening', 1);
	}

	static closeCashOffline(cashClosingId, { hashOffline, companyId }, trx) {
		const query = this.query(trx)
			.patch({ salCashDeskClosingId: cashClosingId })
			.where(`${this.tableName}.hash_offline`, hashOffline)
			.where(`${this.tableName}.company_id`, companyId);
		return query;
	}

	static getCashOffline(cashClosingIds, companyId, trx) {
		const query = this.query(trx)
			.select(raw('sal_cash_desk_closing_id, SUM(payment_amount) AS amountTotal'))
			.whereIn('sal_cash_desk_closing_id', cashClosingIds)
			.where('company_id', companyId)
			.groupBy('sal_cash_desk_closing_id');
		return query;
	}

	static getByCashOffline(cashClosingIds, companyId, trx) {
		const query = this.query(trx)
			.select(this.defaultColumns())
			.whereIn('sal_cash_desk_closing_id', cashClosingIds)
			.where('company_id', companyId);
		return query;
	}

	static validTransactions(companyId, {
		currency, stateId, cashId, ids,
	}) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('id', ids)
			.where('currency', '!=', currency)
			.where('type_movement', TypeMovement.expenses)
			.where('state_id', '!=', stateId)
			.where('cash_id', '!=', cashId)
			.first();
	}

	static async lastBalance(companyId, cashId, currency) {
		const lastBalance = await this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('cash_id', cashId)
			.skipUndefined()
			.where('currency', currency)
			.orderBy('id', 'desc')
			.first();
		return lastBalance ? lastBalance.balance : 0;
	}

	static lastBalanceRaw(companyId, cashId, currency, amount, flagTransfer = 0) {
		return raw(
			`${amount} + (COALESCE((SELECT tra.balance FROM sal_transactions AS tra WHERE tra.cash_id = ? AND tra.company_id = ? AND tra.currency = ? AND tra.flag_transfer = ? AND tra.state_id = ? AND (tra.payment_method_id != ? or tra.payment_method_id is null) ORDER BY tra.id DESC LIMIT 1), 0))`,
			[cashId, companyId, currency, flagTransfer, transactionStates.finalized, credit],
		);
	}

	static editBySale(companyId, saleId, data, tx) {
		return this.query(tx)
			.patch(data)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.sal_sale_documents_id`, saleId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('company_id', companyId)
			.where('id', id);
	}

	static editFlagTransferMultiple(ids, companyId, flagAccredit, transactionsExternalId) {
		const data = { flagTransfer: true };
		if (flagAccredit) {
			data.stateId = 4;
			data.transactionsExternalId = transactionsExternalId;
		}
		return this.query()
			.patch(data)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static updateMultiple(ids, companyId, data) {
		return this.query()
			.patch(data)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static lastBalanceMultiple(companyId, cashId, currency) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('cash_id', cashId)
			.skipUndefined()
			.where('currency', currency)
			.orderBy('id', 'desc')
			.first();
	}

	static remove(id, companyId, { cashId, amount, currency }) {
		const knex = Transaction.knex();
		return transaction(knex, () => {
			const promise = this.query()
				.softDelete()
				.where('company_id', companyId)
				.findById(id);
			return promise.then(() => Cash.updateCashBalance(cashId, amount, currency, companyId));
		});
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

	static getAmountByTypeMovement(cashIds, filter = {}, companyId) {
		return this.query()
			.select(raw('type_movement, sum(amount) as amount'))
			.skipUndefined()
			.whereIn('cash_id', cashIds)
			.where('company_id', companyId)
			.where(raw('sal_cash_desk_closing_id is null'))
			.where('currency', filter.currency)
			.where('state_id', filter.stateId)
			.where(raw('type_movement is not null'))
			.skipUndefined()
			.where('war_warehouses_id', filter.warehouseId)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.groupBy('type_movement');
	}

	static getAmountByEmployeeAndTypeMovement(cashIds, filter = {}, companyId) {
		const query = this.query();
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
		query
			.skipUndefined()
			.whereIn('cash_id', cashIds)
			.where('company_id', companyId)
			.where('currency', filter.currency)
			.where('state_id', filter.stateId)
			.whereNotNull('type_movement')
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('war_warehouses_id', filter.warehouseId);
		if (filter.notPaymentMethodId) {
			query.where((builder) => {
				builder
					.where('payment_method_id', '!=', filter.notPaymentMethodId)
					.orWhereNull('payment_method_id');
			});
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

	static getAmountByTypePayment(cashIds, filter = {}, companyId) {
		const columns = filter.dashboard
			? raw(`ANY_VALUE(${
				this.tableName
			}.type_payment_id) as id, ANY_VALUE(com_ms_type_payments.name) as name, ANY_VALUE(com_ms_type_payments.code) as code, ANY_VALUE(com_ms_type_payments.type_payment_id) as type_payment_id, sum(amount) as amount, ANY_VALUE(com_ms_type_payments.flag_form) as flag_form, ${
				this.tableName
			}.type_movement, count(sal_transactions.type_movement) as type_movement_count`)
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
			.where(`${this.tableName}.flag_transfer`, !filter.flagTransfer ? 0 : filter.flagTransfer)
			.skipUndefined()
			.whereIn(`${this.tableName}.cash_id`, cashIds)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.currency`, filter.currency)
			.where(`${this.tableName}.state_id`, filter.stateId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleId)
			.skipUndefined()
			.whereNot(`${this.tableName}.module_origin_id`, filter.notModuleId)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.skipUndefined()
			.where('employee_id', filter.employeeId);

		if (filter.dashboard) {
			if (filter.report) {
				query.groupBy(['com_ms_type_payments.code']);
			} else {
				query.groupBy(['com_ms_type_payments.code', `${this.tableName}.type_movement`]);
			}
		}

		if (filter.startDate && filter.endDate) {
			query.whereBetween(`${this.tableName}.payment_date`, [filter.startDate, filter.endDate]);
		}

		if (filter.stateOpening) {
			if (filter.stateOpening === 1 && filter.report && filter.salCashDeskClosingId) {
				if (filter.report) {
					query.whereRaw(`(state_opening = ${filter.stateOpening} OR sal_cash_desk_closing_id = ${
						filter.salCashDeskClosingId
					})`);
				} else {
					query.whereRaw(`(state_opening = ${
						filter.stateOpening
					} OR state_opening is null) AND sal_cash_desk_closing_id = ${
						filter.salCashDeskClosingId
					}`);
				}
			} else {
				query.where(`${this.tableName}.state_opening`, filter.stateOpening);
			}
		}

		if (filter.cashClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashClosingId);
		} else if (!filter.report) {
			query.where(raw(`${this.tableName}.sal_cash_desk_closing_id is null`));
		}
		if (filter.notPaymentMethodId) {
			query.where((builder) => {
				builder
					.where('payment_method_id', '!=', filter.notPaymentMethodId)
					.orWhereNull('payment_method_id');
			});
		}
		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}
		return query;
	}

	static getAmountByModule(cashIds, filter = {}, companyId) {
		const query = this.query()
			.select(raw('module_origin_id as id, com_module.name, sum(amount) as amount'))
			.innerJoin('com_module', `${this.tableName}.module_origin_id`, 'com_module.id')
			.skipUndefined()
			.whereIn(`${this.tableName}.cash_id`, cashIds)
			.where(`${this.tableName}.flag_transfer`, !filter.flagTransfer ? 0 : filter.flagTransfer)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.currency`, filter.currency)
			.where(`${this.tableName}.state_id`, filter.stateId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.groupBy(`${this.tableName}.module_origin_id`);
		if (filter.cashClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashClosingId);
		} else {
			query.where(raw(`${this.tableName}.sal_cash_desk_closing_id is null`));
		}
		if (filter.notPaymentMethodId) {
			query.where((builder) => {
				builder
					.where('payment_method_id', '!=', filter.notPaymentMethodId)
					.orWhereNull('payment_method_id');
			});
		}
		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
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

	static getTotalAmount(companyId, currency, filter) {
		const query = this.query()
			.select(raw(`SUM(${this.tableName}.amount) AS totalCash, ANY_VALUE(cash_id) as cash_id`))
			.where('company_id', companyId)
			.where('state_id', 2)
			.skipUndefined()
			.where('currency', currency)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.where(`${this.tableName}.flag_transfer`, !filter.flagTransfer ? 0 : filter.flagTransfer);

		if (filter.typeMovement) {
			query.where(`${this.tableName}.type_movement`, filter.typeMovement);
		}

		if (filter.employeeId) {
			query.where(`${this.tableName}.employee_id`, filter.employeeId);
		}

		if (filter.cashIds) {
			query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
		}

		if (filter.typePaymentIds) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, filter.endDate);
		}

		if (filter.notPaymentMethodId) {
			query.where((builder) => {
				builder
					.where('payment_method_id', '!=', filter.notPaymentMethodId)
					.orWhereNull('payment_method_id');
			});
		}
		if (filter.stateOpening) {
			query.where(`${this.tableName}.state_opening`, filter.stateOpening);
		}
		if (filter.salCashDeskClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId);
		} else if (filter.closedAlready) {
			query.whereNotNull(`${this.tableName}.sal_cash_desk_closing_id`);
		}
		return query;
	}

	static validTransactionByCashId(companyId, cashId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('cash_id', cashId)
			.first();
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
					salDocumentId: this.salSaleDocumentsId ? this.salSaleDocumentsId : null,
					companyId: this.companyId,
				});

				const {
					subsidiaryId,
					description,
					emissionDate,
					expiratedAt,
					typeDocumentCode,
					countryId,
					totalWithoutWithholding,
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
					transactionId: this.id,
					warehouseId: this.warWarehousesId,
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
							warehouseId: this.warWarehousesId,
							employeeId: this.employeeId,
							documentNumber: this.documentNumber,
							dueAmount: totalWithoutWithholding || this.amount,
							currency: this.currency,
							amount: totalWithoutWithholding || this.amount,
							description,
							emissionDate,
							receptionDate: emissionDate,
							reference: this.documentNumber,
							companyId: this.companyId,
							paymentDate: this.paymentDate,
							expirationDate: expiratedAt,
							concept: this.concept,
							saleDocumentId: this.salSaleDocumentsId ? this.salSaleDocumentsId : null,
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
				return Transaction.query(queryContext.transaction).upsertGraph(newTx, options);
			}
			return this;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static exportExcelTransferMovements({
		companyId,
		currency,
		startDate,
		endDate,
		typeMovement,
		employeeId,
		cashId,
		warWarehousesId,
		typePaymentId,
		salCashDeskClosingId,
		moduleOriginId,
		cashIds,
		typePaymentIds,
		moduleIds,
		salTypeDocumentId,
		closing,
		paymentMethodId,
	}) {
		const rawColumns = [
			raw('@rownum:=@rownum+1 AS c1'),
			raw('mod.name AS c2'),
			raw(`CASE WHEN ${this.tableName}.type_movement = 1 THEN "Ingreso" ELSE "Egreso" END AS c3`),
			raw('tp.name AS c4'),
			raw('td.name AS c5'),
			raw(`${this.tableName}.payment_amount AS c6`),
			raw(`${this.tableName}.concept AS c7`),
		];
		const query = this.query()
			.select(rawColumns)
			.from(raw(`(SELECT @rownum:=0) AS r, ${this.tableName}`))
			.leftJoin('com_module AS mod', 'mod.id', `${this.tableName}.module_origin_id`)
			.leftJoin('com_ms_type_payments AS tp', 'tp.id', `${this.tableName}.type_payment_id`)
			.leftJoin('sal_documents AS sd', 'sd.id', `${this.tableName}.sal_sale_documents_id`)
			.innerJoin('com_ms_type_documents AS td', 'td.id', 'sd.sal_type_document_id')
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.state_id`, finalized)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, cashId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, warWarehousesId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, currency)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, employeeId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, salCashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, moduleOriginId)
			.skipUndefined()
			.where('sd.sal_type_document_id', salTypeDocumentId)
			.orderBy(`${this.tableName}.id`, 'DESC');

		if (cashIds) {
			query.whereIn(`${this.tableName}.cash_id`, cashIds.split(','));
		}
		if (typePaymentIds) {
			query.whereIn(`${this.tableName}.cash_id`, typePaymentIds.split(','));
		}
		if (moduleIds) {
			query.whereIn(`${this.tableName}.cash_id`, moduleIds.split(','));
		}
		if (closing) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, null);
			if (paymentMethodId) {
				query.where((builder) => {
					builder
						.where(`${this.tableName}.payment_method_id`, '!=', paymentMethodId)
						.orWhereRaw(`${this.tableName}.payment_method_id IS NULL`);
				});
			}
		} else {
			query.skipUndefined().where(`${this.tableName}.payment_method_id`, paymentMethodId);
		}
		if (startDate && endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, startDate);
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, endDate);
		}
		return query;
	}

	static async makeTransactionToCash(
		{
			credentials,
			cashDestinationId,
			cashAmountKept,
			cashBalance,
			transactionsReflexToCash,
			warWarehousesIdDestination,
			warWarehousesId,
			notMoveTrigger,
		},
		cashDeskClosing,
	) {
		if (cashDestinationId) {
			const {
				cms_companies_id: companyId,
				com_subsidiaries_id: subsidiaryId,
				id: employeeId,
				employee,
			} = credentials;
			const { company } = employee || {};
			const state = await TransactionState.getId('FINALIZADO');
			const typePayment = await TypePayment.getByCode('efectivo', undefined, company.comCountryId);
			const moduleOrigin = await Module.getByCode('CAJA');
			const data = {
				stateId: state && state.id,
				typePaymentId: typePayment && typePayment.id,
				moduleOriginId: moduleOrigin && moduleOrigin.id,
				concept: 'transferencia de caja a caja por cierre caja',
				companyId,
				warWarehousesId,
				warWarehousesIdDestination,
				employeeId,
				subsidiaryId,
				typeTransaction: TypeTransactionCash.transferToBox,
				currency: cashDeskClosing.currency,
				cashId: cashDeskClosing.cashId,
				typeMovement: TypeMovement.expenses,
				amount: ((cashBalance || 0) - (cashAmountKept || 0)) * -1,
				paymentAmount: ((cashBalance || 0) - (cashAmountKept || 0)) * -1,
				paymentDate: helper.localDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
				cashDestinationId,
				salCashDeskClosingId: cashDeskClosing.id,
			};
			if (notMoveTrigger) {
				data.flagTrigger = false;
			}
			if (transactionsReflexToCash) {
				return Transaction.createReflexToCash(data, transactionsReflexToCash);
			}
			return Transaction.create(data);
		}
		return null;
	}

	static isIn(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static async getMovementCashiersTotal(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([raw('sum(sal_transactions.amount) AS totalAmountCashiers')])
			.join('sal_terminals as cmtp', 'cmtp.war_warehouses_id', 'sal_transactions.war_warehouses_id')
			.where('sal_transactions.currency', filter.currency)
			.skipUndefined()
			.where('sal_transactions.subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.whereIn('cmtp.id', filter.terminalIds)
			.skipUndefined()
			.where('sal_transactions.type_movement', filter.typeMovement)
			.where(`${this.tableName}.company_id`, companyId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}

		if (warehouseIds) {
			query.whereIn('sal_transactions.war_warehouses_id', warehouseIds);
		}
		return query;
	}

	static async getMovementCashiersDetailsTotal(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw('sum(CASE WHEN sal_transactions.type_movement = 1 and sal_transactions.amount > 0 THEN (sal_transactions.amount) END) AS entry'),
				raw('sum(CASE WHEN sal_transactions.type_movement = 2 and sal_transactions.amount < 0 THEN sal_transactions.amount END) AS egress'),
			])
			.join('sal_terminals as cmtp', 'cmtp.war_warehouses_id', 'sal_transactions.war_warehouses_id')
			.where('sal_transactions.currency', filter.currency)
			.skipUndefined()
			.where('sal_transactions.subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('sal_transactions.type_movement', filter.typeMovement)
			.skipUndefined()
			.whereIn('cmtp.id', filter.terminalIds)
			.where(`${this.tableName}.company_id`, companyId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}

		if (warehouseIds) {
			query.whereIn('sal_transactions.war_warehouses_id', warehouseIds);
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
			.where('employee_id', filter.employeeId)
			.skipUndefined()
			.where('terminal_id', filter.terminalId)
			.where(`${this.tableName}.flag_transfer`, !filter.flagTransfer ? 0 : filter.flagTransfer)
			.where('company_id', companyId)
			.where('currency', currency)
			.whereIn('type_payment_id', typePaymentIds);
		if (filter.notPaymentMethodId) {
			query.where((builder) => {
				builder
					.where('payment_method_id', '!=', filter.notPaymentMethodId)
					.orWhereNull('payment_method_id');
			});
		}
		if (filter.stateOpening) {
			if (filter.stateOpening === 1 && filter.salCashDeskClosingId) {
				if (filter.transfer) {
					query.whereRaw(`(state_opening = ${filter.stateOpening} OR sal_cash_desk_closing_id = ${
						filter.salCashDeskClosingId
					})`);
				} else if (filter.report) {
					query.whereRaw(`(state_opening = ${
						filter.stateOpening
					} OR state_opening is null OR sal_cash_desk_closing_id = ${
						filter.salCashDeskClosingId
					})`);
				} else {
					query.whereRaw(`(state_opening = ${
						filter.stateOpening
					} OR state_opening is null) AND sal_cash_desk_closing_id = ${
						filter.salCashDeskClosingId
					}`);
				}
			} else {
				query.where('state_opening', filter.stateOpening);
			}
		} else if (filter.salCashDeskClosingId) {
			query.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId);
		} else if (filter.closing) {
			query.whereNull(`${this.tableName}.sal_cash_desk_closing_id`);
		}
		return query;
	}

	static buildReflexTransaction(transactions, companyId, employeeId, salCashDeskClosingId = 0) {
		const transactionKeys = transactions.reduce((acum, item) => {
			const newAcum = { ...acum };
			const cashDeskClosing = !isNullOrUndefined(item.salCashDeskClosingId)
				? item.salCashDeskClosingId
				: salCashDeskClosingId;
			if (
				!newAcum ||
				!newAcum[`${cashDeskClosing}`] ||
				!newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`]
			) {
				newAcum[`${cashDeskClosing}`] = !isNullOrUndefined(newAcum[`${cashDeskClosing}`])
					? newAcum[`${cashDeskClosing}`]
					: {};
				newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`] = {
					...item,
					companyId,
					employeeId,
					transferredTransactions: [item.id],
					warWarehousesId: null,
					typeEntityId: null,
					entityExternalId: null,
					flagTransfer: 1,
					stateOpening: null,
					concept: 'Transferencia de caja a caja',
				};
				if (cashDeskClosing && cashDeskClosing !== 0) {
					newAcum[`${cashDeskClosing}`][
						`${item.typePaymentId}`
					].salCashDeskClosingId = cashDeskClosing;
					newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].originCashId = cashDeskClosing;
				}
				delete newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].id;
				newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].balance = 0;
			} else {
				newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].transferredTransactions.push(item.id);
				newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].amount += item.amount;
				newAcum[`${cashDeskClosing}`][`${item.typePaymentId}`].paymentAmount += item.paymentAmount;
			}
			return newAcum;
		}, {});
		const transactionReflex = [];
		const keysCashClosing = Object.keys(transactionKeys);
		keysCashClosing.forEach((item) => {
			const keysTrans = Object.keys(transactionKeys[`${item}`]);
			keysTrans.forEach((k) => {
				transactionReflex.push(transactionKeys[`${item}`][`${k}`]);
			});
		});
		return transactionReflex;
	}

	static getSaleTransaction(salSaleDocumentsId) {
		return this.query()
			.select(this.defaultColumns('cmtp.name as typePaymentName'))
			.join('com_ms_type_payments as cmtp', 'cmtp.id', 'sal_transactions.type_payment_id')
			.where('sal_transactions.flag_transfer', 0)
			.whereIn('sal_transactions.sal_sale_documents_id', salSaleDocumentsId);
	}

	static getListCashClosingReportExcel(companyId, filter = {}) {
		let query = this.query()
			.select([
				raw('sal_transactions.id as transactionId'),
				raw('cas.id as cashId'),
				raw('cas.name as cashName'),
				raw('mod.id as idModule'),
				raw('mod.name as moduleName'),
				raw('cmtp.id as idTypePayment'),
				raw('cmtp.name as typePaymentRow'),
				raw('cmtd.id as idTypeDocument'),
				raw('cmtd.name as typeDocumentName'),
				raw('sal_transactions.amount'),
				raw('sal_transactions.concept'),
				raw('sal_transactions.type_movement'),
				raw(`DATE_FORMAT(sal_transactions.payment_date,  '${'%Y-%m-%d %H:%M:%S'}') AS paymentDate`),
				raw('JSON_EXTRACT(sal_transactions.additional_information, "$.comment") as comment'),
			])
			.join('com_cash as cas', 'cas.id', 'sal_transactions.cash_id')
			.join('com_module as mod', 'mod.id', 'sal_transactions.module_origin_id')
			.join('com_ms_type_payments as cmtp', 'cmtp.id', 'sal_transactions.type_payment_id')
			.leftJoin('sal_documents as sd', 'sd.id', 'sal_transactions.sal_sale_documents_id')
			.leftJoin('com_ms_type_documents as cmtd', 'cmtd.id', 'sd.sal_type_document_id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.state_id`, filter.stateId)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, filter.cashId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, filter.currency)
			.skipUndefined()
			.where(`${this.tableName}.type_payment_id`, filter.typePaymentId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.type_movement`, filter.typeMovement)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.salCashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.module_origin_id`, filter.moduleOriginId)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, filter.subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.amount`, filter.amount)
			.skipUndefined()
			.where(`${this.tableName}.type_entity_id`, filter.typeEntityId)
			.orderBy('sal_transactions.id', 'desc');

		if (filter.entityStateId) {
			query.whereIn(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}
		if (filter.stateIds && filter.stateIds.length > 0) {
			query.whereIn(`${this.tableName}.state_id`, filter.stateIds);
		}
		if (filter.cashIds && filter.cashIds.length > 0) {
			query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
		}
		if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
			query.whereIn(`${this.tableName}.type_payment_id`, filter.typePaymentIds);
		}
		if (filter.moduleIds && filter.moduleIds.length > 0) {
			query.whereIn(`${this.tableName}.module_origin_id`, filter.moduleIds);
		}
		if (filter.typeMovements && filter.typeMovements.length > 0) {
			query.whereIn(`${this.tableName}.type_movement`, filter.typeMovements);
		}
		if (filter.salTypeDocumentId) {
			query.where('sd.sal_type_document_id', filter.salTypeDocumentId);
		}
		if (filter.closing) {
			query
				.whereNull(`${this.tableName}.sal_cash_desk_closing_id`)
				.whereNotNull(`${this.tableName}.type_movement`);
			if (filter.paymentMethodId) {
				query.where((builder) => {
					builder
						.where(`${this.tableName}.payment_method_id`, '!=', filter.paymentMethodId)
						.orWhereRaw(`${this.tableName}.payment_method_id IS NULL`);
				});
			}
		} else {
			query.skipUndefined().where(`${this.tableName}.payment_method_id`, filter.paymentMethodId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.payment_date) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.payment_date) <= ?`, filter.endDate);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		if (filter.typePaymentCodes && filter.typePaymentCodes.length > 0) {
			const msTypePaymentTable = 'com_ms_type_payments';
			query
				.join(
					`${msTypePaymentTable}`,
					`${msTypePaymentTable}.id`,
					`${this.tableName}.type_payment_id`,
				)
				.whereIn(`${msTypePaymentTable}.code`, filter.typePaymentCodes);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}
}

module.exports = Transaction;
