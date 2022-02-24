'use strict';

const { Model, transaction, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const Transaction = require('./Transaction');
const TerminalUser = require('./TerminalUser');
const TransactionBank = require('./TransactionBank');
const Expenses = require('./PurExpense');
const CashMovement = require('./CashMovement');
const MsTypeDocument = require('./MsTypeDocument');
const CashState = require('./CashState');
const Cash = require('./Cash');
const ComEmployee = require('./ComEmployee');
const moment = require('moment');
const Boom = require('boom');
const { isNullOrUndefined } = require('util');
const {
	cashIdNotFound,
	cashInactiveError,
	cashClosingUserExist,
} = require('./../api/shared/error-codes');
const { isDevOrProd } = require('./../shared/helper');
const TypeTransaction = require('./TypeTransaction');
const PaymentForm = require('./enums/type-payment-form-enum');
const { income } = require('./TypeMovement');
const format = require('date-fns/format');

class SalCashDeskClosing extends baseModel {
	static get tableName() {
		return 'sal_cash_desk_closing';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['employeeId', 'companyId', 'closedAt'],
			properties: {
				employeeId: {
					type: 'integer',
				},
				companyId: {
					type: 'integer',
				},
				currency: {
					type: ['string', 'null'],
				},
				dateOpened: {
					type: 'timestamp',
				},
				closedEmployeeId: {
					type: 'integer',
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				startAmount: {
					type: 'decimal',
					default: 0,
				},
				endAmount: {
					type: 'decimal',
					default: 0,
				},
				cashRegisterInformation: {
					type: ['object', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		return {
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_cash_desk_closing.employee_id',
					to: 'com_employee.id',
				},
			},
			closedEmployee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_cash_desk_closing.closed_employee_id',
					to: 'com_employee.id',
				},
			},
			sales: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_cash_desk_closing.id',
					to: 'sal_documents.sal_cash_desk_closing_id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'sal_cash_desk_closing.cash_id',
					to: 'com_cash.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'sal_cash_desk_closing.terminal_id',
					to: 'sal_terminals.id',
				},
			},
		};
	}

	static defaultColumns(otherColumns = []) {
		return [
			'id',
			'closed_at',
			'employee_id',
			'hash_offline',
			'currency',
			'date_opened',
			'closed_employee_id',
			'terminal_id',
			'start_amount',
			'end_amount',
			'cash_id',
			'cash_register_information',
			'created_at',
			'updated_at',
		]
			.map(c => `${this.tableName}.${c}`)
			.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return ['currencySymbol', 'totalSales'];
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

	get totalSales() {
		const keys = Object.keys(this.cashRegisterInformation || {});
		const paymentFormValid = Object.values(PaymentForm);
		const amount = keys.reduce((acum, item) => {
			let newAcum = acum;
			if (paymentFormValid.indexOf(item) > -1) {
				newAcum += this.cashRegisterInformation[item] || 0;
			}
			return newAcum;
		}, 0);
		if (amount === 0) {
			return isNullOrUndefined(this.closedAt) ? 0 : this.endAmount - this.startAmount;
		}
		return amount;
	}

	static getList(companyId, filter) {
		const employeeTable = 'com_employee';
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[employee(selectColumns), closedEmployee(selectColumnsVendor), cash(selectColumns)]')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, filter.currency)
			.skipUndefined()
			.where(`${this.tableName}.cash_id`, filter.cashId);

		if (filter.search) {
			if (!filter.employeeId) {
				query
					.innerJoin(`${employeeTable}`, `${employeeTable}.id`, `${this.tableName}.employee_id`)
					.whereRaw(
						`MATCH(${employeeTable}.name, ${employeeTable}.lastname, ${employeeTable}.email, ${employeeTable}.code) AGAINST(?)`,
						[filter.search],
					);
			}
		}
		if (filter.closed) {
			query
				.whereNotNull(`${this.tableName}.closed_at`)
				.orderBy(`${this.tableName}.closed_at`, 'desc');
		} else {
			query.orderBy(`${this.tableName}.created_at`, 'desc');
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.closed_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.closed_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.warehouseId) {
			const cashTable = 'com_cash';
			query
				.join(`${cashTable}`, `${this.tableName}.cash_id`, `${cashTable}.id`)
				.where(`${cashTable}.war_warehouses_id`, filter.warehouseId);
		}

		this.includePaginationAndSort(query, filter);
		return query;
	}

	static createCashClosing(id, data, dataTransaction, companyId, credentialsData = {}) {
		try {
			const dataUpdate = {
				salCashDeskClosingId: id,
				stateOpening: credentialsData.cashDestinationId ? 2 : 1,
			};
			let lastBal;
			let cashDeskClosing;
			const newCashMovement = [];
			return transaction(
				SalCashDeskClosing,
				Transaction,
				TransactionBank,
				Cash,
				async (SalCashDeskClosingTx, TransactionTx, TransactionBankTx, CashTx) => {
					cashDeskClosing = await SalCashDeskClosingTx.getById(id);
					if (credentialsData.cashDestinationId) {
						await TransactionTx.makeTransactionToCash(
							{ ...credentialsData, notMoveTrigger: true },
							cashDeskClosing,
						);
					}

					if (dataTransaction.sale && dataTransaction.sale.length > 0) {
						const transactionIds = dataTransaction.sale.map((item) => {
							newCashMovement.push({
								companyId,
								salCashDeskClosingId: id,
								transactionId: item.id,
								transaction: item,
								amount: item.amount,
								typeTransaction: TypeTransaction.cash,
								typeMovement: item.typeMovement,
							});
							return item.id;
						});
						await TransactionTx.updateCashDeskClosing(dataUpdate, transactionIds);
					}

					if (dataTransaction.depositBank && dataTransaction.depositBank.length > 0) {
						const transactionBankIds = dataTransaction.depositBank.map((item) => {
							newCashMovement.push({
								companyId,
								salCashDeskClosingId: id,
								transactionBankId: item.id,
								transaction: item,
								amount: item.amount,
								typeTransaction: TypeTransaction.bank,
								typeMovement: item.typeMovement,
							});
							return item.id;
						});
						await TransactionBankTx.updateCashDeskClosing(dataUpdate, transactionBankIds);
					}

					await SalCashDeskClosingTx.edit(id, data).where('company_id', companyId);

					const { currency, cashId } = cashDeskClosing;
					const editCashData = [];
					if (
						credentialsData.cashDestinationId &&
						credentialsData.updateCashDestination &&
						credentialsData.updateCashDestination > 0 &&
						credentialsData.terminalId
					) {
						editCashData.push({
							id: credentialsData.cashDestinationId,
							balance: raw(
								`JSON_SET(balance, "$.${currency}", JSON_EXTRACT(balance, "$.${currency}") + ?)`,
								[credentialsData.updateCashDestination],
							),
						});
					}

					if (
						credentialsData.cashDestinationId &&
						credentialsData.updateOriginCash &&
						credentialsData.updateOriginCash > 0 &&
						credentialsData.terminalId
					) {
						editCashData.push({
							id: cashId,
							balance: raw(
								`JSON_SET(balance, "$.${currency}", JSON_EXTRACT(balance, "$.${currency}") + ?)`,
								[credentialsData.updateOriginCash * -1],
							),
						});
					}

					if (editCashData && editCashData.length > 0) {
						await CashTx.updateMultiple(editCashData);
					}
					return cashDeskClosing;
				},
			)
				.then(() => {
					if (credentialsData.cashDestinationId && credentialsData.terminalId) {
						return Transaction.updateStateOpeningClose(credentialsData.terminalId);
					}
					return null;
				})
				.then(() => {
					if (credentialsData.cashDestinationId && credentialsData.terminalId) {
						return TransactionBank.updateStateOpeningClose(credentialsData.terminalId);
					}
					return null;
				})
				.then(() => {
					if (newCashMovement && newCashMovement.length > 0) {
						return CashMovement.generateCashMovement(newCashMovement);
					}
					return [];
				})
				.then(() => {
					const { currency, cashId } = cashDeskClosing;
					return Transaction.getTotalAmount(companyId, currency, {
						cashIds: [cashId],
						typePaymentIds: dataTransaction.typePaymentIds,
					});
				})
				.then((amountCash) => {
					const { currency, cashId } = cashDeskClosing;
					lastBal = amountCash.length > 0 ? amountCash[0].totalCash : 0;
					if (credentialsData.terminalId) {
						return TransactionBank.getTotalAmount(companyId, {
							cashId,
							currency,
							notStateOpening: 2,
						});
					}
					return [];
				})
				.then((amountBank) => {
					const { currency, cashId } = cashDeskClosing;
					lastBal += amountBank.length >= 1 ? amountBank[0].totalBank : 0;
					return Cash.updateCashBalance(cashId, undefined, currency, companyId, income, {
						state: raw(`JSON_SET(state, "$.${currency}", ?)`, [CashState.closed]),
						balance: raw(`JSON_SET(balance, "$.${currency}", ?)`, [lastBal]),
					});
				})
				.then(() => cashDeskClosing);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async createCashOpening(data) {
		const knex = SalCashDeskClosing.knex();
		const newData = Array.isArray(data) ? data : [data];
		const promises = [];
		newData.forEach((item) => {
			const response = knex.schema.raw(
				`UPDATE com_cash SET state = JSON_SET(state, "$.${item.currency}", ?) WHERE id = ?`,
				[CashState.opened, item.cashId],
			);
			promises.push(response);
		});
		await Promise.all(promises);
		return this.query().insertGraph(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static getByIdDetails(id, companyId) {
		return this.query()
			.eager('[employee(selectColumnsVendor), cash(basicColumns).subsidiary(reportColumns)]')
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static getByIdAll(id, companyId) {
		return this.query()
			.eager('[employee(selectColumnsVendor), cash(selectColumns).subsidiary(reportColumns)]')
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static getByCashCurrency(cashId, currency, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('cash_id', cashId)
			.where('currency', currency)
			.where('company_id', companyId)
			.whereRaw('closed_employee_id IS NULL')
			.first();
	}

	static getCashOpening(companyId, cashId, currency, lastRecord = false) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('cash_id', cashId)
			.where('company_id', companyId)
			.where('currency', currency);
		if (lastRecord) {
			query.orderBy('id', 'desc').whereNotNull('closed_employee_id');
		} else {
			query.whereRaw('closed_employee_id IS NULL');
		}
		query.first();
		return query;
	}

	static edit(id, data, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static createOffline(data, {
		companyId, employeeId, terminalId, cashId,
	}) {
		const knex = this.knex();
		const closingInfo = data.map((item) => {
			const newItem = { ...item };
			const date = moment(newItem.closedAt)
				.utc()
				.format('YYYY-MM-DD HH:mm:ss');
			newItem.companyId = companyId;
			newItem.employeeId = employeeId;
			newItem.closedEmployeeId = employeeId;
			newItem.cashId = cashId;
			newItem.terminalId = terminalId;
			newItem.startAmount = 0;
			newItem.closedAt = date;
			newItem.dateOpened = date;
			return newItem;
		});
		return transaction(knex, async (trx) => {
			const newClosingCash = await this.query(trx).insertGraph(closingInfo);
			const updateSales = newClosingCash.map(({ id, hashOffline }) =>
				Transaction.closeCashOffline(id, { hashOffline, companyId }, trx));

			const updateExpenses = newClosingCash.map(({ id, hashOffline }) =>
				Expenses.closeCashOffline(id, { hashOffline, companyId }, trx));

			await Promise.all(updateSales);
			await Promise.all(updateExpenses);

			const ids = newClosingCash.map(item => item.id);
			const dataSumTotal = await Transaction.getCashOffline(ids, companyId, trx);
			const updateClosingCash = dataSumTotal.map(item =>
				SalCashDeskClosing.edit(item.salCashDeskClosingId, { endAmount: item.amountTotal }, trx));

			await Promise.all(updateClosingCash);
			const transactions = await Transaction.getByCashOffline(ids, companyId, trx);
			const newCashMovement = transactions.map(item => ({
				companyId,
				salCashDeskClosingId: item.salCashDeskClosingId,
				transactionId: item.id,
				amount: item.paymentAmount,
				typeMovement: item.typeMovement,
			}));
			await CashMovement.createMultiple(newCashMovement, trx);

			return newClosingCash;
		});
	}

	static getLastClosing(companyId, cashId, currency = 'PEN') {
		return this.query()
			.select(this.defaultColumns())
			.where('cash_id', cashId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('currency', currency)
			.orderBy('created_at', 'desc')
			.first();
	}

	static getLastClosingByUser(companyId, cashId, currency, terminalIds) {
		return this.query()
			.select(this.defaultColumns([
				raw('com_employee.name as nameUser'),
				raw('com_employee.lastname as lastnameUser'),
			]))
			.join('com_employee', 'com_employee.id', 'sal_cash_desk_closing.employee_id')
			.whereNotNull('sal_cash_desk_closing.terminal_id')
			.skipUndefined()
			.where('sal_cash_desk_closing.currency', currency)
			.whereIn('terminalId', terminalIds)
			.where('cash_id', cashId)
			.where('company_id', companyId)
			.orderBy('created_at', 'desc')
			.groupBy('terminalId');
	}

	static async openAllCashDesks(companyId, employee) {
		try {
			if (employee.cashId && (employee.currency || !isDevOrProd())) {
				const newEmployee = employee;
				const cash = await Cash.getByIdAndClosing(employee.cashId, employee.currency, companyId);
				if (cash && !cash.flagActive) {
					return Boom.badRequest(cashInactiveError);
				}
				newEmployee.warehouseId = cash.warWarehousesId;
				const flagErrorAdmin = ComEmployee.validAdminRoleGlobal(employee.codeTypeRol);
				let cashOpeningId;
				if (cash.terminalId && !flagErrorAdmin) {
					const validUserTerminal = await TerminalUser.validByUser(
						employee.id,
						cash.terminalId,
						companyId,
					);
					if (!validUserTerminal) {
						return Boom.badRequest(cashClosingUserExist);
					}
					const { id: employeeId, cashId, company } = employee;
					if (!employee.currency) {
						newEmployee.currency = company.country.currency;
					}
					let cashOpening = await SalCashDeskClosing.getByCashCurrency(
						cashId,
						employee.currency,
						companyId,
					);
					if (!cashOpening) {
						const newCashDeskOpening = {
							companyId,
							employeeId,
							currency: employee.currency,
							dateOpened: new Date(),
							terminalId: cash.terminalId,
							startAmount: (cash && cash.balance[employee.currency]) || 0,
							closedAt: null,
							cashId,
						};
						cashOpening = await this.createCashOpening(newCashDeskOpening);
						cashOpeningId = cashOpening.id;
					}
					newEmployee.cashOpening = cashOpening;
				}
				cashOpeningId = cashOpeningId || cash.closingId;
				cashOpeningId = ComEmployee.setCashClosing(employee.codeTypeRol) ? cashOpeningId : null;
				return { ...employee, cashOpeningId };
			}
			return Boom.badRequest(cashIdNotFound);
		} catch (error) {
			return Boom.badImplementation(error, error);
		}
	}

	static getNewDetailSummary(acum = [], obj) {
		const newAcum = acum;
		const typePaymentIdx = acum.findIndex(item => item.id === obj.typePaymentId);
		if (typePaymentIdx >= 0) {
			newAcum[typePaymentIdx].amount = Number(newAcum[typePaymentIdx].amount) + Number(obj.amount);
			newAcum[typePaymentIdx].amount = Number(newAcum[typePaymentIdx].amount).toFixed(2);
		} else {
			newAcum.push({
				id: obj.typePaymentId,
				description: obj.typePaymentName,
				amount: Number(obj.amount).toFixed(2),
			});
		}
		return newAcum;
	}

	static async getReportSummary({
		companyId,
		salCashClosingId,
		countryId,
		salCashClosing,
		typeReport,
	}) {
		try {
			const typeDocs = await MsTypeDocument.getAll({ countryId });
			let query = Transaction.query()
				.select([
					raw('sd.id as saleId'),
					raw('p.id as purId'),
					raw('sd.sal_type_document_id as salTypeDoc'),
					raw('p.type_document_id as purTypeDoc'),
					raw('sal_transactions.created_at as dateEmision'),
					raw('tp.id as typePaymentId'),
					raw('tp.name as typePaymentName, 1 as flagTransaction'),
					raw('IF(sal_transactions.pur_documents_id is not null'),
					raw('if(s.name is not null, s.name, s.commercial_name)'),
					raw('if(c.rz_social is not null, c.rz_social'),
					raw('CONCAT(c.name, " ", c.lastname))) as entityName'),
					raw('IF(sal_transactions.pur_documents_id is not null'),
					raw('s.document_number'),
					raw('if(c.ruc is not null, c.ruc, c.dni)) as entityDocumentNumber'),
					raw('sal_transactions.currency'),
					raw('cmm.code as moduleOrigin'),
					raw('if(sal_transactions.document_number is not null, sal_transactions.document_number, sal_transactions.documents) as documentNumberComplete'),
					raw('sal_transactions.amount'),
				])
				.innerJoin(raw('com_ms_type_payments tp on tp.id = sal_transactions.type_payment_id'))
				.innerJoin(raw(
					'com_cash_movement cm on cm.transaction_id = sal_transactions.id and cm.sal_cash_desk_closing_id = ?',
					[salCashClosingId],
				))
				.leftJoin(raw('sal_documents sd on sd.id = sal_transactions.sal_sale_documents_id'))
				.leftJoin(raw('pur_documents p on p.id = sal_transactions.pur_documents_id'))
				.leftJoin(raw('com_customers c on c.id = sd.customer_id'))
				.leftJoin(raw('pur_suppliers s on s.id = p.supplier_id'))
				.innerJoin('com_module as cmm', 'cmm.id', 'sal_transactions.module_origin_id')
				.where('sal_transactions.company_id', companyId)
				// .skipUndefined()
				// .where('sal_transactions.cash_id', salCashClosing.cashId)
				.where('cm.sal_cash_desk_closing_id', salCashClosingId);
			let documentsCash = await query;
			query = TransactionBank.query()
				.select([
					raw('sd.id as saleId'),
					raw('p.id as purId'),
					raw('bai.name as nameBank'),
					raw('bai.account_number as accountNumber'),
					raw('sd.sal_type_document_id as salTypeDoc'),
					raw('p.type_document_id as purTypeDoc'),
					raw('com_transaction_bank.created_at as dateEmision'),
					raw('tp.id as typePaymentId'),
					raw('tp.name as typePaymentName, 2 as flagTransaction'),
					raw('IF(com_transaction_bank.pur_documents_id is not null'),
					raw('if(s.name is not null, s.name, s.commercial_name)'),
					raw('if(c.rz_social is not null, c.rz_social'),
					raw('CONCAT(c.name, " ", c.lastname))) as entityName'),
					raw('IF(com_transaction_bank.pur_documents_id is not null'),
					raw('s.document_number'),
					raw('if(c.ruc is not null, c.ruc, c.dni)) as entityDocumentNumber'),
					raw('com_transaction_bank.currency'),
					raw('cmm.code as moduleOrigin'),
					raw('if(com_transaction_bank.document_number is not null, com_transaction_bank.document_number, com_transaction_bank.documents) as documentNumberComplete'),
					raw('com_transaction_bank.amount'),
				])
				.innerJoin(raw('com_ms_type_payments tp on tp.id = com_transaction_bank.type_payment_id'))
				.innerJoin(raw('com_companies_bank_accounts bai on bai.id = com_transaction_bank.bank_account_id'))
				.innerJoin(raw(
					'com_cash_movement cm on cm.transaction_bank_id = com_transaction_bank.id and cm.sal_cash_desk_closing_id = ?',
					salCashClosingId,
				))
				.leftJoin(raw('sal_documents sd on sd.id = com_transaction_bank.sal_documents_id'))
				.leftJoin(raw('pur_documents p on p.id = com_transaction_bank.pur_documents_id'))
				.leftJoin(raw('com_customers c on c.id = sd.customer_id'))
				.leftJoin(raw('pur_suppliers s on s.id = p.supplier_id'))
				.innerJoin('com_module as cmm', 'cmm.id', 'com_transaction_bank.module_origin_id')
				.where('com_transaction_bank.company_id', companyId)
				.skipUndefined()
				.where('com_transaction_bank.cash_id', salCashClosing.cashId)
				.where('com_transaction_bank.sal_cash_desk_closing_id', salCashClosingId);
			let documentsBank = await query;
			let totalCash = 0;
			let totalBank = 0;
			let totalEntry = 0;
			let totalEgress = 0;
			documentsCash = documentsCash.map((i, idx) => {
				const typeDocument = typeDocs.find(e => e.id === i.salTypeDoc || e.id === i.purTypeDoc);
				const newItem = {
					...i,
					typeDocumentName: typeDocument ? typeDocument.name : i.moduleOrigin,
					order: idx + 1,
					typeTransaction: i.purId ? 'Compra' : 'Venta',
					amount: Number(i.amount).toFixed(2),
					dateEmision: helper.localDate(i.dateEmision, 'DD/MM/YYYY HH:mm'),
				};
				totalCash += i.amount;
				totalEntry = i.amount > 0 ? i.amount + totalEntry : totalEntry;
				totalEgress = i.amount < 0 ? i.amount + totalEgress : totalEgress;
				return newItem;
			});
			documentsBank = documentsBank.map((i, idx) => {
				const typeDocument = typeDocs.find(e => e.id === i.salTypeDoc || e.id === i.purTypeDoc);
				const newItem = {
					...i,
					typeDocumentName: typeDocument ? typeDocument.name : i.moduleOrigin,
					order: idx + 1,
					typeTransaction: i.purId ? 'Compra' : 'Venta',
					amount: Number(i.amount).toFixed(2),
					dateEmision: helper.localDate(i.dateEmision, 'DD/MM/YYYY HH:mm'),
				};
				totalBank += i.amount;
				totalEntry = i.amount > 0 ? i.amount + totalEntry : totalEntry;
				totalEgress = i.amount < 0 ? i.amount + totalEgress : totalEgress;
				return newItem;
			});
			const balance = totalEntry + totalEgress;
			const finalBalance = Number(salCashClosing.startAmount) + balance;
			const response = {
				currencySymbol: countryId === 1 ? 'S/.' : '$',
				subsidiary: {
					name: salCashClosing.cash.subsidiary ? salCashClosing.cash.subsidiary.sucursalName : '',
					ruc: salCashClosing.cash.subsidiary ? salCashClosing.cash.subsidiary.ruc : '',
					address: salCashClosing.cash.subsidiary ? salCashClosing.cash.subsidiary.address : '',
				},
				startDate: helper.localDate(salCashClosing.dateOpened, 'DD/MM/YYYY HH:mm'),
				endDate: format(salCashClosing.closedAt, 'DD/MM/YYYY HH:mm'),
				documentsCash,
				documentsBank,
				employeeName: salCashClosing.employee.name,
				terminalName: 'Terminal',
				typeReport: typeReport !== 1,
				cashState: salCashClosing.closedEmployeeId ? 'Cerrada' : 'Abierta',
				cash: {
					name: salCashClosing.cash.name || 'Caja',
					amount: Number(totalCash).toFixed(2),
				},
				bank: {
					name: 'Banco',
					amount: Number(totalBank).toFixed(2),
				},
				amountOperation: {
					lastBalance: '0.00',
					initialBalance: Number(salCashClosing.startAmount).toFixed(2),
					finalBalance: Number(finalBalance).toFixed(2),
					entry: Number(totalEntry).toFixed(2),
					egress: Number(totalEgress).toFixed(2),
					balance: Number(balance).toFixed(2),
				},
			};
			if (typeReport !== 1) {
				delete response.documentsCash;
				delete response.documentsBank;
			}
			documentsCash = documentsCash.concat(documentsBank);
			if (documentsCash.length > 0) {
				const detailTypePayment = documentsCash.reduce(
					(a, e) => {
						const newA = a;
						const { amount, flagTransaction } = e;
						const type = Number(amount) > 0 ? 'entry' : 'egress';
						const flagTrn = flagTransaction === 1 ? 'cash' : 'bank';
						newA[type].amount = Number(newA[type].amount) + Number(amount);
						newA[type].amount = newA[type].amount.toFixed(2);
						newA[type][flagTrn].amount = Number(newA[type][flagTrn].amount) + Number(amount);
						newA[type][flagTrn].amount = newA[type][flagTrn].amount.toFixed(2);
						newA[type][flagTrn].details = this.getNewDetailSummary(newA[type][flagTrn].details, e);
						return newA;
					},
					{
						entry: {
							amount: '0.00',
							cash: { amount: '0.00', details: [] },
							bank: { amount: '0.00', details: [] },
						},
						egress: {
							amount: '0.00',
							cash: { amount: '0.00', details: [] },
							bank: { amount: '0.00', details: [] },
						},
					},
				);
				response.detailTypePayment = detailTypePayment;
			}
			return Promise.resolve(response);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static validCashId(companyId, cashId) {
		return this.query()
			.select(this.defaultColumns())
			.where('cash_id', cashId)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = SalCashDeskClosing;
