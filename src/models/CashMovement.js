'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');
const TypeTransaction = require('./TypeTransaction');

class CashMovement extends baseModel {
	static get tableName() {
		return 'com_cash_movement';
	}

	static get relationMappings() {
		return {
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalCashDeskClosing.js`,
				join: {
					from: 'com_cash_movement.sal_cash_desk_closing_id',
					to: 'sal_cash_desk_closing.id',
				},
			},
			transaction: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Transaction.js`,
				join: {
					from: 'com_cash_movement.transaction_id',
					to: 'sal_transactions.id',
				},
			},
			transactionBank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TransactionBank.js`,
				join: {
					from: 'com_cash_movement.transaction_bank_id',
					to: 'com_transaction_bank.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['salCashDeskClosingId'],
			properties: {
				salCashDeskClosingId: {
					type: 'integer',
				},
				typeTransaction: {
					type: 'integer',
				},
				transactionId: {
					type: ['integer', 'null'],
				},
				transactionBankId: {
					type: ['integer', 'null'],
				},
				moduleOriginId: {
					type: ['integer', 'null'],
				},
				amount: {
					type: 'decimal',
					default: 0,
				},
				concept: {
					type: ['string', 'null'],
				},
				reference: {
					type: ['string', 'null'],
				},
				typePaymentId: {
					type: ['integer', 'null'],
				},
				typeMovement: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
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
		let columns = [
			'id',
			'sal_cash_desk_closing_id',
			'additional_information',
			'transaction_bank_id',
			'type_transaction',
			'transaction_id',
			'amount',
			'concept',
			'reference',
			'type_movement',
			'company_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, salCashDeskClosingId, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[transaction(basicColumns).[typePayment(selectColumns), module(selectColumns)], transactionBank(basicColumns).[typePayment(selectColumns), moduleOrigin(selectColumns), bankAccount(selectColumns), bank(selectColumns)]]')
			.skipUndefined()
			.where('sal_cash_desk_closing_id', salCashDeskClosingId)
			.where('company_id', companyId);

		if (filter.typeMovements) {
			query.whereIn('type_movement', filter.typeMovements);
		}

		if (filter.moduleIds) {
			query.whereIn('module_origin_id', filter.moduleIds);
		}

		if (filter.typePaymentIds) {
			query.whereIn('type_payment_id', filter.typePaymentIds);
		}

		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static createMultiple(data, trx) {
		return this.query(trx).insertGraph(data);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[transaction(selectColumns), transactionBank(basicColumns)]')
			.skipUndefined()
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static generateCashMovement(cashMovement) {
		const transactionIds = [];
		const transactionBankIds = [];
		const newCashMovement = cashMovement.reduce((acum, item) => {
			const newItems = { ...item };
			const transaction = item.transaction || {};
			newItems.moduleOriginId = transaction.moduleOriginId;
			newItems.typePaymentId = transaction.typePaymentId;
			newItems.reference = transaction.reference;
			newItems.concept = transaction.concept;
			newItems.additionalInformation = {
				moduleName: transaction.module && transaction.module.name,
				commentary: transaction.saleDocument && transaction.saleDocument.commentary,
				typePaymentName: transaction.typePayment && transaction.typePayment.name,
				currencySymbol: transaction.currencySymbol,
				code: transaction.code,
				documentNumber: transaction.documentNumber,
				createdAt: transaction.createdAt,
				accountingSeatCode: transaction.accountingSeatCode,
				customerName:
					(transaction.saleDocument &&
						transaction.saleDocument.customer &&
						transaction.saleDocument.customer.name) ||
					(transaction.customer &&
						transaction.customer.typePerson &&
						transaction.customer.typePerson.fullName),
				paymentAmount: transaction.paymentAmount,
				bankName: transaction.bank && transaction.bank.name,
				bankAccountName: transaction.bankAccount && transaction.bankAccount.name,
				bankAccountNumber: transaction.bankAccount && transaction.bankAccount.accountNumber,
			};
			delete newItems.transactionBank;
			delete newItems.transaction;
			if (
				item.typeTransaction === TypeTransaction.cash &&
				transactionIds.indexOf(item.transactionId) <= -1
			) {
				transactionIds.push(item.transactionId);
				acum.push(newItems);
			} else if (
				item.typeTransaction === TypeTransaction.bank &&
				transactionBankIds.indexOf(item.transactionBankId) <= -1
			) {
				transactionBankIds.push(item.transactionBankId);
				acum.push(newItems);
			}
			return acum;
		}, []);
		return this.query().insertGraph(newCashMovement);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = CashMovement;
