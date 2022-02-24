'use strict';

const { Model, transaction, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const Sales = require('./Sales');
const CaDocuments = require('./CaDocuments');
const CaDocumentsDetails = require('./CaDocumentsDetails');
const Transaction = require('./Transaction');
const TransactionBank = require('./TransactionBank');
const PaymentState = require('./PaymentState');
const TypeMovement = require('./TypeMovement');
const TypeTransactionCash = require('./TypeTransactionCash');
const ModuleCode = require('./ModuleCode');
const Purchases = require('./Purchases');
const TypeTransaction = require('./TypeTransaction');
const TypeAmortization = require('./TypeAmortization');
const ComBankAccounts = require('./ComBankAccounts');
const Supplier = require('./Supplier');
const Customer = require('./Customer');
const DocumentAccountStatus = require('./DocumentAccountStatus');
const AmortizationDetails = require('./AmortizationDetails');
const WithholdingTax = require('./WithholdingTax');
const {
	registered, canceled, pending, accounted,
} = require('./EntityStateCode');
const numberToWords = require('../shared/numberToWords');

class Amortization extends baseModel {
	static get tableName() {
		return 'ca_amortizations';
	}

	static get relationMappings() {
		const relation = {
			typePayment: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'ca_amortizations.type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
			bankAccount: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'ca_amortizations.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			employee: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'ca_amortizations.com_employee_id',
					to: 'com_employee.id',
				},
			},
			amortizationDetails: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/AmortizationDetails.js`,
				join: {
					from: 'ca_amortizations.id',
					to: 'ca_amortizations_details.amortization_id',
				},
			},
			transaction: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Transaction.js`,
				join: {
					from: 'ca_amortizations.transaction_id',
					to: 'sal_transactions.id',
				},
			},
			transactionBank: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/TransactionBank.js`,
				join: {
					from: 'ca_amortizations.transaction_bank_id',
					to: 'com_transaction_bank.id',
				},
			},
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'ca_amortizations.customer_id',
					to: 'com_customers.id',
				},
			},
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'ca_amortizations.module_id',
					to: 'com_module.id',
				},
			},
			supplier: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Supplier.js`,
				join: {
					from: 'ca_amortizations.supplier_id',
					to: 'pur_suppliers.id',
				},
			},
			documentAccountStatus: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/DocumentAccountStatus.js`,
				join: {
					from: 'ca_amortizations.document_account_status_id',
					to: 'com_document_account_status.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'ca_amortizations.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'comEmployeeId', 'amount', 'typePaymentId'],
			properties: {
				amount: {
					type: 'decimal',
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				comEmployeeId: {
					type: 'integer',
				},
				observations: {
					type: ['string', 'null'],
				},
				typePaymentId: {
					type: 'integer',
				},
				urlImage: {
					type: ['string', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				transactionId: {
					type: ['integer', 'null'],
				},
				transactionBankId: {
					type: ['integer', 'null'],
				},
				typeAmortization: {
					type: ['integer', 'null'],
					enum: [1, 2, 3, null],
					default: null,
				},
				typeTransaction: {
					type: ['integer', 'null'],
					enum: [1, 2, null],
					default: null,
				},
				customerId: {
					type: ['integer', 'null'],
				},
				currency: {
					type: ['string', 'null'],
					default: 'PEN',
				},
				moduleId: {
					type: ['integer', 'null'],
				},
				supplierId: {
					type: ['integer', 'null'],
				},
				documents: {
					type: ['array', 'null'],
				},
				documentAccountStatusId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				operationNumber: {
					type: ['string', 'null'],
				},
				originPlatform: {
					type: ['integer', 'null'],
					default: 2,
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				accountingSeat: {
					type: ['object', 'null'],
				},
				entityStateId: {
					type: ['integer', 'null'],
					default: 1,
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

	static get virtualAttributes() {
		return [
			'currencySymbol',
			'totalSaleDocuments',
			'debtsSalesCustomer',
			'amountInWords',
			'typeAmortizationName',
			'entityStateName',
		];
	}

	get debtsSalesCustomer() {
		let result = 0;
		const payment = this.typePayment;
		const debts = this.customer;
		if (payment || debts) {
			if (payment && payment.currency === 'PEN') {
				result =
					payment.currency === 'PEN' ? (debts && debts.debtsSales && debts.debtsSales.PEN) || 0 : 0;
			}
			if (payment && payment.currency === 'USD') {
				result =
					payment.currency === 'USD' ? (debts && debts.debtsSales && debts.debtsSales.USD) || 0 : 0;
			}
			return result;
		}
		return result;
	}

	get totalSaleDocuments() {
		let data = 0;
		if (this.amortizationDetails) {
			data = this.amortizationDetails.reduce(
				(acum, item) => acum + ((item.sale && item.sale.amount) || 0),
				0,
			);
		}
		return data;
	}

	get amountInWords() {
		const currencyPlural = this.currency === 'PEN' ? 'SOLES' : 'DOLARES AMERICANOS';
		const currencySingular = this.currency === 'PEN' ? 'SOL' : 'DOLAR AMERICANO';
		return numberToWords(this.amount, currencyPlural, currencySingular);
	}

	get typeAmortizationName() {
		let typeAmortizationName = 'Simple';
		if (this.typeAmortization === 2) {
			typeAmortizationName = 'Múltiple';
		} else if (this.typeAmortization === 3) {
			typeAmortizationName = 'Free - Simple';
		}
		return typeAmortizationName;
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'amount',
			'bank_account_id',
			'com_employee_id',
			'observations',
			'type_payment_id',
			'url_image',
			'additional_information',
			'transaction_id',
			'transaction_bank_id',
			'type_amortization',
			'type_transaction',
			'customer_id',
			'module_id',
			'supplier_id',
			'documents',
			'document_account_status_id',
			'created_at',
			'subsidiary_id',
			'warehouse_id',
			'operation_number',
			'origin_platform',
			'flag_active',
			'company_id',
			'accounting_account',
			'accounting_seat',
			'entity_state_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static async createByDocument(data, companyId, {
		employee, warehouse, cashId, paymentMethodId,
	}) {
		const txResult = await transaction(
			Amortization,
			CaDocuments,
			CaDocumentsDetails,
			Sales,
			Transaction,
			async (AmortizationTx, CaDocumentsTx, CaDocumentsDetailsTx, SalesTx, TransactionTx) => {
				const detailsIds = data.payments.map(item => item.id);
				const detailsToUpdate = [];
				const transactions = [];
				const detailsToPay = await CaDocumentsDetailsTx.query()
					.select('id', 'amount', 'amount_payment', 'expiration_date')
					.whereIn('id', detailsIds)
					.where('company_id', companyId);

				const additionalInformation = data.additionalInformation ? data.additionalInformation : {};
				if (data.beneficiary && data.beneficiary.typePerson) {
					additionalInformation.beneficiary = data.beneficiary.typePerson.fullName;
				}
				additionalInformation.dateReference = new Date();

				let totalDueAmount = 0;
				let totalPayments = 0;

				const amortizations = data.payments.map((item) => {
					const newAmortization = Object.assign({}, item);
					newAmortization.companyId = companyId;
					newAmortization.employeeId = employee;
					newAmortization.caDocumentId = data.caDocumentId;
					newAmortization.salDocumentId = data.salDocumentId;
					const currentDetailToPay = detailsToPay.find(dtp => dtp.id === newAmortization.id);
					totalDueAmount += newAmortization.amount;
					if (currentDetailToPay) {
						const newTransaction = {
							amount: newAmortization.amount,
							currency: helper.defaultCurrency.PEN,
							paymentDate: newAmortization.paymentDate,
							paymentAmount: newAmortization.amount,
							salSaleDocumentsId: newAmortization.salDocumentId,
							stateId: 2,
							typePaymentId: newAmortization.typePaymentId,
							employeeId: employee,
							warWarehousesId: warehouse,
							cashId,
							typeAmortization: TypeAmortization.multiples,
							typeMovement: TypeMovement.income,
							typeTransaction: TypeTransactionCash.normalTransaction,
							paymentMethodId,
							companyId,
							concept: `Pago de amortizacion de documento por ${newAmortization.amount}`,
							moduleOriginId: data.moduleId,
							entityExternalId: data.customerId,
							additionalInformation,
							balance: TransactionTx.lastBalanceRaw(
								companyId,
								cashId,
								helper.defaultCurrency.PEN,
								newAmortization.amount,
							),
						};
						const newPaymentDetail = {
							id: currentDetailToPay.id,
							typePaymentId: newAmortization.typePaymentId,
							amountPayment: newAmortization.amount,
							status: helper.checkingAccountStatus.PAID_OUT,
						};
						const amountToPay = currentDetailToPay.amount - currentDetailToPay.amountPayment;
						if (amountToPay - newAmortization.amount === 0) {
							totalPayments += 1;
							detailsToUpdate.push(newPaymentDetail);
						} else {
							newPaymentDetail.status = helper.checkingAccountStatus.PENDING;
							detailsToUpdate.push(newPaymentDetail);
						}
						transactions.push(TransactionTx.createSimple(newTransaction));
					}
					return newAmortization;
				});

				const updateCheckingAccountDetail = detailsToUpdate.map(dtu =>
					CaDocumentsDetailsTx.query()
						.patch(dtu)
						.where('id', dtu.id));

				const amortizationData = {
					amount: totalDueAmount,
					comEmployeeId: employee,
					typePaymentId: amortizations[0].typePaymentId,
					companyId,
					urlImage: data.urlImage,
					amortizationDetails: amortizations,
					customerId: data.customerId,
					currency: data.currency,
					moduleId: data.moduleId,
					typeAmortization: TypeAmortization.multiples,
				};

				const promises = [
					AmortizationTx.query().insertGraph(amortizationData),
					...updateCheckingAccountDetail,
					SalesTx.query()
						.patch({ dueAmount: totalDueAmount })
						.where('id', data.salDocumentId)
						.where('com_company_id', companyId),
				];
				if (totalPayments === detailsToPay.length) {
					promises.push(CaDocumentsTx.query()
						.patch({ status: helper.checkingAccountStatus.PAID_OUT })
						.where('id', data.caDocumentId)
						.where('company_id', companyId));
				}
				if (transactions.length > 0) {
					promises.push(...transactions);
				}
				return Promise.all(promises);
			},
		);
		return txResult;
	}

	static create(
		data,
		company,
		{
			// employee, warehouse, cashId, paymentMethodId, typePayment, balance = 0,
			employee,
			warehouse,
			cashId,
			paymentMethodId,
			typePayment,
			terminalId,
			salCashDeskClosingId,
		},
		salTypePaymentId,
		caDocuments,
		documentAccountStatus,
	) {
		const {
			bankAccountId,
			bankId,
			documentNumber,
			reference,
			urlImage,
			additionalInformation,
		} = data;

		const newData = data;
		delete newData.bankId;
		delete newData.documentNumber;
		delete newData.reference;

		const knex = Amortization.knex();
		let newAmortizations;
		const dataDocumentDetails = [];
		const dataAmortizations = [];
		const dataSaleDocument = [];
		const dataPurchaseDocument = [];
		let sumAmountTotal = 0;
		let salCurrency = 'PEN';
		let subsidiaryId;
		if (data.currency) {
			salCurrency = data.currency;
		}
		const flagSale = data.moduleId === ModuleCode.accountsReceivable;
		let flagBank = false;
		const documents = [];
		const promiseDocuments = newData.documents.map((item) => {
			const newitem = item;
			let sumAmount = 0;
			let caStatus = PaymentState.pending;
			const caDocumentData = caDocuments.find(itemCa => itemCa.id === newitem.caDocumentId);
			const caDocumentDetails = caDocumentData.details;

			newitem.payments.forEach((item2) => {
				let statusDetails = PaymentState.pending;
				let sumAmountDetails = 0;
				const itemCaDocumentDetails = caDocumentDetails.find(itemD => itemD.id === item2.id);
				sumAmountDetails = item2.amountPayment + itemCaDocumentDetails.amountPayment;

				if (sumAmountDetails === item2.amount) {
					statusDetails = PaymentState.payOut;
				}
				if (sumAmountDetails > 0 && sumAmountDetails < item2.amount) {
					statusDetails = PaymentState.partial;
				}

				sumAmount += item2.amountPayment;
				const dataCaDocumentDetail = {
					ccDocumentId: newitem.caDocumentId,
					typePaymentId: salTypePaymentId,
					status: statusDetails,
					amountPayment: sumAmountDetails,
					expirationDate: item2.expirationDate,
				};
				dataAmortizations.push({
					amount: item2.amountPayment,
					bankAccountId: data.bankAccountId,
					caDocumentId: newitem.caDocumentId,
					employeeId: employee,
					observations: data.description,
					paymentDate: item2.expirationDate,
					typePaymentId: salTypePaymentId,
					caDocumentDetailId: item2.id,
					salDocumentId: newitem.salDocumentId,
					purDocumentId: newitem.purDocumentId,
					companyId: company,
				});
				dataDocumentDetails.push({
					id: item2.id,
					data: dataCaDocumentDetail,
				});
			});
			const dueAmount = flagSale
				? caDocumentData.saleDocument.dueAmount
				: caDocumentData.purchaseDocument.dueAmount;
			subsidiaryId = flagSale
				? caDocumentData.saleDocument.comSubsidiaryId
				: caDocumentData.purchaseDocument.subsidiaryId;
			const newDueAmount = dueAmount + sumAmount;
			let newPaymentState = PaymentState.partial;
			if (newitem.amount === newDueAmount) {
				caStatus = PaymentState.payOut;
				newPaymentState = PaymentState.payOut;
			}
			if (flagSale) {
				dataSaleDocument.push({
					id: newitem.salDocumentId,
					dueAmount: newDueAmount,
					paymentState: newPaymentState,
				});
				documents.push(`${caDocumentData.saleDocument.typeDocument.code}${
					caDocumentData.saleDocument.documentNumber
				}`);
			} else {
				dataPurchaseDocument.push({
					id: newitem.purDocumentId,
					dueAmount: newDueAmount,
					paymentStateId: newPaymentState,
				});
				documents.push(`${caDocumentData.purchaseDocument.typeDocument.code}${
					caDocumentData.purchaseDocument.documentNumber
				}`);
			}

			sumAmountTotal += sumAmount;
			return CaDocuments.edit(newitem.caDocumentId, { status: caStatus }, company);
		});

		const concept = flagSale
			? `Pago amortizacion multiple de documentos de venta por ${sumAmountTotal}`
			: `Pago amortizacion multiple de documentos de compra por ${sumAmountTotal}`;

		let newAdditionalInformation;
		if (additionalInformation) {
			newAdditionalInformation = additionalInformation;
		} else {
			newAdditionalInformation = {};
		}
		if (data.beneficiary) {
			if (flagSale) {
				if (data.beneficiary.typePerson) {
					newAdditionalInformation.beneficiary = data.beneficiary.typePerson.fullName;
				}
			} else {
				newAdditionalInformation.beneficiary = data.beneficiary.name;
			}
		}
		newAdditionalInformation.dateReference = new Date();
		const dataTransaction = {
			subsidiaryId,
			stateId: PaymentState.partial,
			typePaymentId: salTypePaymentId,
			paymentDate: new Date(),
			paymentAmount: flagSale ? sumAmountTotal : -1 * sumAmountTotal,
			amount: flagSale ? sumAmountTotal : -1 * sumAmountTotal,
			currency: salCurrency,
			companyId: company,
			employeeId: employee,
			warWarehousesId: warehouse,
			cashId,
			typeMovement: flagSale ? TypeMovement.income : TypeMovement.expenses,
			typeTransaction: TypeTransactionCash.normalTransaction,
			paymentMethodId,
			concept,
			moduleOriginId: data.moduleId,
			documents,
			entityExternalId: flagSale ? data.customerId : data.supplierId,
			typeAmortization: TypeAmortization.multiples,
			additionalInformation: newAdditionalInformation,
			terminalId,
			bankAccountId,
			salCashDeskClosingId,
			// balance: balance + (flagSale ? sumAmountTotal : -sumAmountTotal),
			balance: Transaction.lastBalanceRaw(
				company,
				cashId,
				salCurrency,
				flagSale ? sumAmountTotal : -1 * sumAmountTotal,
			),
		};

		const amortization = {
			amount: sumAmountTotal,
			bankAccountId,
			comEmployeeId: employee,
			observations: data.description,
			typePaymentId: salTypePaymentId,
			urlImage: data.urlImage,
			amortizationDetails: dataAmortizations,
			companyId: company,
			additionalInformation,
			customerId: data.customerId,
			supplierId: data.supplierId,
			currency: data.currency,
			moduleId: data.moduleId,
			typeAmortization: TypeAmortization.multiples,
			typeTransaction: typePayment.flagTypeTransaction,
			documents,
			subsidiaryId,
			warehouseId: warehouse,
			originPlatform: data.originPlatform,
		};
		if (typePayment.flagTypeTransaction === TypeTransaction.bank) {
			dataTransaction.warehouseId = dataTransaction.warWarehousesId;
			delete dataTransaction.warWarehousesId;
			delete dataTransaction.cashId;
			delete dataTransaction.paymentMethodId;
			dataTransaction.typeTransactionBankId = typePayment.typeTransactionBankId;
			dataTransaction.documentNumber = documentNumber;
			dataTransaction.reference = reference;
			dataTransaction.urlImage = urlImage;
			dataTransaction.bankId = bankId;
			delete amortization.transaction;
			amortization.transactionBank = dataTransaction;
			flagBank = true;
		} else {
			amortization.transaction = dataTransaction;
		}

		return transaction(knex, () =>
			this.query()
				.insertGraph(amortization)
				.then((newRecords) => {
					newAmortizations = newRecords;
					const promiseDocumentDetails = dataDocumentDetails.map(item =>
						CaDocumentsDetails.edit(item.id, item.data, company));
					return Promise.all(promiseDocumentDetails);
				})
				.then(() => Promise.all(promiseDocuments))
				.then(() => {
					if (documentAccountStatus) {
						documentAccountStatus.forEach(async (item) => {
							let newItem = { ...item };
							if (!item.id) {
								const document = { ...item };
								newItem = await DocumentAccountStatus.create(document);
							}
							const editPaymentStatus = {
								id: newItem.saleDocumentId,
								field: 'sale_document_id',
								data: {
									status:
										newItem.amount === newItem.dueAmount
											? PaymentState.payOut
											: PaymentState.partial,
									dueAmount: newItem.dueAmount,
								},
								companyId: newItem.companyId,
							};
							await DocumentAccountStatus.editPaymentStatus(editPaymentStatus);
							if (newItem.saleDocumentId || newItem.purDocumentId) {
								const filterData = {
									data: {
										documentAccountStatusId: newItem.id,
									},
								};
								if (newItem.saleDocumentId) {
									filterData.salDocumentId = newItem.saleDocumentId;
								} else if (newItem.purDocumentId) {
									filterData.purDocumentId = newItem.purDocumentId;
								}
								await AmortizationDetails.editByDocumentId(filterData, company);
							}
						});
					}
					return null;
				})
				.then(() => {
					let promiseDocument = [];
					if (flagSale) {
						promiseDocument = dataSaleDocument.map(item =>
							Sales.editDueAmount(
								item.id,
								{ dueAmount: item.dueAmount, paymentState: item.paymentState },
								company,
							));
					} else {
						promiseDocument = dataPurchaseDocument.map(item =>
							Purchases.edit(
								item.id,
								{ dueAmount: item.dueAmount, paymentStateId: item.paymentStateId },
								company,
							));
					}
					return Promise.all(promiseDocument);
				})
				.then(() =>
					(flagBank
						? ComBankAccounts.updateBalance(company, bankAccountId, dataTransaction.amount)
						: true))
				.then(() => {
					if (flagSale && data.customerId) {
						const flagDiscountBalance = true;
						return Customer.updateSalesQuantity(data.customerId, company, {
							currency: salCurrency,
							debtsSales: dataTransaction.paymentAmount * -1,
							subsidiaryId,
							flagDiscountBalance,
						});
					} else if (!flagSale && data.supplierId) {
						return Supplier.updateCurrencyAmount(
							data.supplierId,
							salCurrency,
							dataTransaction.paymentAmount,
							0,
						);
					}
					return null;
				})
				.then(() => newAmortizations));
	}

	static getWithholdingTax({
		data, newAmortization, saleDocumentId, purDocumentId,
	}) {
		const withholdingTax = { ...data };
		withholdingTax.purchaseDocumentId = purDocumentId || null;
		withholdingTax.saleDocumentId = saleDocumentId || null;
		withholdingTax.documentAccountStatusId = newAmortization.documentAccountStatusId || null;
		withholdingTax.moduleId = newAmortization.moduleId;
		withholdingTax.warehouseId = newAmortization.warehouseId;
		withholdingTax.employeeId = newAmortization.comEmployeeId;
		withholdingTax.companyId = newAmortization.companyId;
		withholdingTax.documentNumber = `${data.serie}-${data.number}`;
		withholdingTax.details = data.details.map((item) => {
			const newItem = { ...item };
			newItem.companyId = newAmortization.companyId;
			return newItem;
		});
		return withholdingTax;
	}

	static async createFree({
		amortization,
		collection,
		flagTypeTransaction,
		transactionsExternalId,
		paymentDate,
		documents,
		flagAccredit,
	}) {
		try {
			const knex = Amortization.knex();
			const {
				saleDocumentId,
				purDocumentId,
				dueAmount,
				amount,
				documentNumber,
				withholdingTax,
				documentAccountStatusId,
			} = documents;
			let newAmortization;
			let newRecord = {};
			const txResult = transaction(knex, () =>
				this.query()
					.insertGraph(amortization)
					.then((auxAmortization) => {
						newAmortization = auxAmortization;
						if (!withholdingTax) {
							if (flagTypeTransaction === TypeTransaction.bank) {
								const newCol = { ...collection };
								newCol.paymentDate = paymentDate;
								delete newCol.documentExternalId;
								return TransactionBank.create(newCol, Transaction, undefined, flagAccredit);
							}
							return Transaction.create(collection, flagAccredit, transactionsExternalId);
						}
						return WithholdingTax.createFree(this.getWithholdingTax({
							data: withholdingTax,
							newAmortization,
							saleDocumentId,
							purDocumentId,
						}));
					})
					.then((newTransaction) => {
						newRecord = Array.isArray(newTransaction) ? newTransaction[0] : newTransaction;
						let dataUpdate = {
							transactionId: flagTypeTransaction !== TypeTransaction.bank ? newRecord.id : null,
							transactionBankId: flagTypeTransaction === TypeTransaction.bank ? newRecord.id : null,
						};
						if (withholdingTax) {
							dataUpdate = {
								operationNumber: newRecord.documentNumber,
								observations: `Comprobante de Retención ${
									newRecord.documentNumber
								} del documento ${documentNumber}`,
							};
						}
						return this.query()
							.patch(dataUpdate)
							.where('id', newAmortization.id);
					})
					.then(() => {
						if (!Array.isArray(dueAmount)) {
							const editPaymentStatus = {
								id: documentAccountStatusId,
								field: 'id',
								data: {
									status: amount === dueAmount ? PaymentState.payOut : PaymentState.partial,
									dueAmount,
								},
								companyId: amortization.companyId,
							};

							newAmortization.editPaymentStatus = editPaymentStatus;
							if (saleDocumentId) {
								editPaymentStatus.id = saleDocumentId;
								editPaymentStatus.field = 'sale_document_id';
								newAmortization.editPaymentStatus = editPaymentStatus;
								return Sales.editDueAmount(
									saleDocumentId,
									{ dueAmount, paymentState: editPaymentStatus.data.status },
									amortization.companyId,
								);
							} else if (purDocumentId) {
								editPaymentStatus.id = purDocumentId;
								editPaymentStatus.field = 'pur_document_id';
								newAmortization.editPaymentStatus = editPaymentStatus;
								return Purchases.edit(
									purDocumentId,
									{ dueAmount, paymentStateId: editPaymentStatus.data.status },
									amortization.companyId,
								);
							}
						}
						return null;
					})
					.then(() => {
						if (!Array.isArray(dueAmount)) {
							return DocumentAccountStatus.editPaymentStatus(newAmortization.editPaymentStatus);
						}
						return null;
					})
					.then(() => {
						if (Array.isArray(dueAmount) && dueAmount.length > 0) {
							const upsertData = dueAmount.reduce(
								(a, i) => {
									const newAcum = { ...a };
									const status =
										i.total === i.dueAmount ? PaymentState.payOut : PaymentState.partial;
									newAcum.docsAcc.push({
										id: i.id,
										dueAmount: i.dueAmount,
										status,
									});
									if (i.saleId || i.purId) {
										const doc = {
											id: i.saleId,
											dueAmount: i.dueAmount,
											paymentState: status,
										};
										if (i.purId) {
											doc.id = i.purId;
											doc.paymentStateId = status;
											delete doc.paymentState;
										}
										newAcum.docs.push(doc);
									}
									return newAcum;
								},
								{ docsAcc: [], docs: [] },
							);
							newAmortization.upsertData = upsertData;
							if (upsertData.docs.length > 0) {
								if (amortization.moduleId === ModuleCode.accountsReceivable) {
									return Sales.editMultiple(upsertData.docs);
								}
								return Purchases.editMultiple(upsertData.docs);
							}
						}
						return null;
					})
					.then(() => {
						if (Array.isArray(dueAmount) && dueAmount.length > 0) {
							return DocumentAccountStatus.editMultiple(newAmortization.upsertData.docsAcc);
						}
						return null;
					})
					.then(() => newAmortization));
			return txResult
				.then(response => Promise.resolve(response))
				.catch(error => Promise.reject(error));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async createMultiTransactions({
		amortization,
		collection,
		documents,
		transactionsCash,
		amortizationWithholding,
	}) {
		try {
			const knex = Amortization.knex();
			const {
				saleDocumentId, purDocumentId, documentNumber, withholdingTax,
			} = documents;
			let newAmortization;
			let newRecord = {};
			const txResult = transaction(knex, () =>
				this.query()
					.insertGraph(amortization)
					.then((auxAmortization) => {
						newAmortization = auxAmortization;
						const newCol = { ...collection };
						delete newCol.documentExternalId;
						return TransactionBank.create(newCol, Transaction);
					})
					.then((newTransaction) => {
						newRecord = Array.isArray(newTransaction) ? newTransaction[0] : newTransaction;
						return this.query()
							.patch({
								transactionBankId: newRecord.id,
							})
							.where('id', newAmortization.id);
					})
					.then(() => {
						const amortizationNew = { ...amortization };
						// Salida de caja por monto total de transaction
						const transactionsExternalId = newRecord.id;
						amortizationNew.amount = transactionsCash.collection.amount * -1;
						amortizationNew.amortizationDetails[0].amount = transactionsCash.collection.amount * -1;
						return this.createFree({
							amortization: amortizationNew,
							...transactionsCash,
							transactionsExternalId,
							flagAccredit: true,
							documents: {
								dueAmount: [],
								amount: amortizationNew.amount,
							},
						});
					})
					.then(() => {
						if (amortizationWithholding) {
							return this.query().insertGraph(amortizationWithholding);
						}
						return undefined;
					})
					.then((auxAmortization) => {
						if (auxAmortization) {
							newAmortization = auxAmortization;
							return WithholdingTax.createFree(this.getWithholdingTax({
								data: withholdingTax,
								newAmortization,
								saleDocumentId,
								purDocumentId,
							}));
						}
						return undefined;
					})
					.then((newTransaction) => {
						if (newTransaction) {
							newRecord = newTransaction;
							return this.query()
								.patch({
									operationNumber: newRecord.documentNumber,
									observations: `Comprobante de Retención ${
										newRecord.documentNumber
									} del documento ${documentNumber}`,
								})
								.where('id', newAmortization.id);
						}
						return undefined;
					})
					.then(() => newAmortization));
			return txResult
				.then(response => Promise.resolve(response))
				.catch(error => Promise.reject(error));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove({ id, amortization }, companyId) {
		const { transactionId, transactionBankId } = amortization;
		const knex = Amortization.knex();
		return transaction(knex, async (trx) => {
			await this.query(trx)
				.softDelete()
				.findById(id)
				.where('company_id', companyId);
			if (transactionId) {
				await Transaction.query(trx)
					.softDelete()
					.findById(transactionId)
					.where('company_id', companyId);
			}
			if (transactionBankId) {
				await TransactionBank.query(trx)
					.softDelete()
					.findById(transactionBankId)
					.where('company_id', companyId);
			}
			if (amortization.documentAccountStatusId) {
				const { dueAmount, purDocumentId, saleDocumentId } = amortization.documentAccountStatus;
				const status = dueAmount - amortization.amount === 0 ? 1 : 2;
				await DocumentAccountStatus.edit(
					amortization.documentAccountStatusId,
					{
						status,
						dueAmount: raw('due_amount-??', [amortization.amount]),
					},
					companyId,
					trx,
				);
				if (saleDocumentId) {
					await Sales.query(trx)
						.patch({
							dueAmount: raw('due_amount-??', [amortization.amount]),
							paymentState: status,
						})
						.where('id', saleDocumentId)
						.where('com_company_id', companyId);
				}
				if (purDocumentId) {
					await Purchases.query(trx)
						.patch({
							dueAmount: raw('due_amount-??', [amortization.amount]),
							paymentStateId: status,
						})
						.where('id', purDocumentId)
						.where('company_id', companyId);
				}
			}
			return amortization;
		});
	}

	static async matchPurDocument(purDocumentId, companyId) {
		try {
			const details = await AmortizationDetails.getByPurchaseDocument(purDocumentId, companyId);
			const detail = details.find(i => i.amortization.documentAccountStatusId);
			const detailMatch = details.find(i => !i.amortization.documentAccountStatusId);
			if (detail && detailMatch) {
				return this.query()
					.patch({
						documentAccountStatusId: detail.amortization.documentAccountStatusId,
					})
					.where('id', detailMatch.amortization.id)
					.where('company_id', companyId);
			}
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[documentAccountStatus(selectColumns), typePayment(selectColumns), bankAccount(selectColumns), employee(selectColumns), customer(selectColumns), supplier(selectColumns), subsidiary(selectColumns), amortizationDetails(selectColumns).[sale(selectColumns).typeDocument(documentTypeData), purchase(selectColumns)]]')
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static isIn(id, companyId) {
		return this.query()
			.eager('documentAccountStatus(selectColumns)')
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static getAll(
		filter = {},
		companyId,
		moduleId = ModuleCode.accountsReceivable,
		typeAmoritzation = TypeAmortization.multiples,
	) {
		let query = this.query()
			.eager('[documentAccountStatus(selectColumns), typePayment(selectColumns), bankAccount(selectColumns), employee(selectColumns), customer(selectColumns), supplier(selectColumns), subsidiary(selectColumns), amortizationDetails(selectColumns).[sale(selectColumns).typeDocument(documentTypeData), purchase(selectColumns)]]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('module_id', moduleId)
			.where('type_amortization', typeAmoritzation)
			.where('currency', filter.currency)
			.skipUndefined()
			.where('com_employee_id', filter.comEmployeeId)
			.skipUndefined()
			.where('type_payment_id', filter.typePaymentId)
			.skipUndefined()
			.where('customer_id', filter.customerId)
			.skipUndefined()
			.where('document_account_status_id', filter.documentAccountStatus);

		if (filter.entityStateId) {
			query.where('entity_state_id', filter.entityStateId);
		}

		if (filter.flagSale) {
			query.whereRaw('customer_id is NOT NULL');
		}
		if (!moduleId && filter.moduleId === ModuleCode.debtsToPay) {
			query.where('module_id', filter.moduleId);
			query.where('com_employee_id', filter.comEmployeeId);
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
		query = this.includePaginationAndSort(query, filter);
		return query;
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

	static createMultiple(data, tx) {
		return this.query(tx).insertGraph(data);
	}

	static getByAmortizationDetail(amortizationId, companyId) {
		return this.query()
			.eager('[typePayment(selectColumns), transaction(selectColumns).[typePayment(selectColumns)], transactionBank(selectColumns).[typeTransactionBank(selectColumns), bankAccount(selectColumns), typePayment(selectColumns)]]')
			.select(this.defaultColumns())
			.where('id', amortizationId)
			.where('company_id', companyId)
			.first();
	}

	static getByDocumentAccountStatus(documentAccountStatusId, companyId) {
		return this.query()
			.where('document_account_status_id', documentAccountStatusId)
			.where('company_id', companyId);
	}
}
module.exports = Amortization;
