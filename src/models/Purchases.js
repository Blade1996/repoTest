'use strict';

const { Model, transaction, raw } = require('objection');
const simpleAxios = require('./../api/shared/simple-axios');
const format = require('date-fns/format');
const baseModel = require('./base');
const helper = require('./helper');
const PurMsState = require('./PurMsState');
const TransactionState = require('./TransactionStates');
const PaymentMethod = require('./PaymentMethod');
const PaymentState = require('./PaymentState');
const Transaction = require('./Transaction');
const TypeMovement = require('./TypeMovement');
const TypeTransactionCash = require('./TypeTransactionCash');
const TypeEntity = require('./TypeEntity');
const ModuleCode = require('./ModuleCode');
const QuotaState = require('./QuotaState');
const Supplier = require('./Supplier');
const { uniqueValues, isDevOrProd } = require('../shared/helper');
const numberToWords = require('../shared/numberToWords');
const TypeTransaction = require('./TypeTransaction');
const TransactionBank = require('./TransactionBank');
const IncomeStatus = require('./IncomeStatus');
const AmortizationDetail = require('./AmortizationDetails');
const CaDocuments = require('./CaDocuments');
const PurchaseDocumentsDetail = require('./PurchaseDocumentsDetail');
const Cash = require('./Cash');
const ComBankAccounts = require('./ComBankAccounts');
const StatusTaxEcu = require('./StatusTaxEcu');
const SalSeries = require('./SalSeries');
const FlagUse = require('./FlagUse');
const WithholdingTax = require('./WithholdingTax');
const DocumentAccountStatus = require('./DocumentAccountStatus');
const MsTypePayment = require('./MsTypePayment');
const MsTypeDocument = require('./MsTypeDocument');
const StatusOrc = require('./../models/StatusOrc');
const TypeAmortization = require('./TypeAmortization');
const { Promise } = require('bluebird');
const {
	hashOnlinePurchasesDuplicate,
	purchaseCannotDeleterror,
} = require('./../api/shared/error-codes');
const { pending } = require('./enums/status-dispatch-guides-enum');
const StatusDispatch = require('./enums/status-dispatch-guides-enum');

class Purchases extends baseModel {
	static get tableName() {
		return 'pur_documents';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'pur_documents.company_id',
					to: 'com_companies.id',
				},
			},
			payment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PaymentMethod.js`,
				join: {
					from: 'pur_documents.payment_method_id',
					to: 'sal_method_payments.id',
				},
			},
			state: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PurMsState.js`,
				join: {
					from: 'pur_documents.state_id',
					to: 'pur_ms_states.id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'pur_documents.cash_id',
					to: 'com_cash.id',
				},
			},
			typeDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeDocument.js`,
				join: {
					from: 'pur_documents.type_document_id',
					to: 'com_ms_type_documents.id',
				},
			},
			supplier: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Supplier.js`,
				join: {
					from: 'pur_documents.supplier_id',
					to: 'pur_suppliers.id',
				},
			},
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/PurchaseDocumentsDetail.js`,
				join: {
					from: 'pur_documents.id',
					to: 'pur_documents_details.purchase_document_id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'pur_documents.com_employees_id',
					to: 'com_employee.id',
				},
			},
			transactions: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Transaction.js`,
				join: {
					from: 'pur_documents.id',
					to: 'sal_transactions.pur_documents_id',
				},
			},
			transactionBank: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/TransactionBank.js`,
				join: {
					from: 'pur_documents.id',
					to: 'com_transaction_bank.pur_documents_id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'pur_documents.terminal_id',
					to: 'sal_terminals.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'pur_documents.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			typeCatalog: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CatalogSunatDetails.js`,
				join: {
					from: 'pur_documents.type_catalog_id',
					to: 'ms_catalog_sunat_details.id',
				},
			},
			entityState: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/EntityState.js`,
				join: {
					from: 'pur_documents.entity_state_id',
					to: 'ms_entity_states.id',
				},
			},
			typeExpense: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PurTypeExpense.js`,
				join: {
					from: 'pur_documents.type_expense_id',
					to: 'pur_type_expenses.id',
				},
			},
			checkingAccounts: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CaDocuments.js`,
				join: {
					from: 'pur_documents.id',
					to: 'ca_documents.pur_document_id',
				},
			},
			withholdingTax: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/WithholdingTax.js`,
				join: {
					from: 'pur_documents.id',
					to: 'com_withholding_tax.purchase_document_id',
				},
			},
			withholdingTaxActive: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/WithholdingTax.js`,
				join: {
					from: 'pur_documents.withholding_tax_id',
					to: 'com_withholding_tax.id',
				},
			},
			amortizationDetails: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/AmortizationDetails.js`,
				filter: query =>
					query
						.groupBy('ca_amortizations_details.amortization_id')
						.select(raw('SUM(ca_amortizations_details.amount) AS amountDetails')),
				join: {
					from: 'pur_documents.id',
					to: 'ca_amortizations_details.pur_document_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'stateId', 'comEmployeesId', 'currency'],
			properties: {
				companyId: {
					type: 'integer',
				},
				stateId: {
					type: 'integer',
				},
				comEmployeesId: {
					type: 'integer',
				},
				currency: {
					type: ['string', 'null'],
				},
				amount: {
					type: 'decimal',
				},
				subTotal: {
					type: 'decimal',
				},
				totalWithoutWithholding: {
					type: 'decimal',
					default: 0,
				},
				taxes: {
					type: 'decimal',
				},
				closedAt: {
					type: 'timestamp',
				},
				statusTax: {
					type: ['integer', 'null'],
				},
				purDocumentAnnexId: {
					type: ['integer', 'null'],
				},
				sunatError: {
					type: ['string', 'null'],
				},
				taxesAmount: {
					type: ['object', 'null'],
				},
				flagDispatch: {
					type: ['integer', 'boolean', 'null'],
				},
				commentary: {
					type: ['string', 'null'],
				},
				urlImages: {
					type: ['array', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				number: {
					type: ['string', 'null'],
				},
				serie: {
					type: ['string', 'null'],
				},
				entityStateId: {
					type: ['integer', 'null'],
					default: 1,
				},
				paymentStateId: {
					type: ['integer', 'null'],
				},
				typeCatalogId: {
					type: ['integer', 'null'],
				},
				dueAmount: {
					type: 'decimal',
				},
				exchangeRate: {
					type: 'decimal',
				},
				exchangeAmount: {
					type: 'decimal',
				},
				discountPercentage: {
					type: 'decimal',
				},
				discountAmount: {
					type: 'decimal',
				},
				supplierId: {
					type: ['integer', 'null'],
				},
				typeDocumentId: {
					type: 'integer',
				},
				paymentMethodId: {
					type: ['integer', 'null'],
				},
				dateDocument: {
					type: 'datetime',
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				purDocumentsId: {
					type: ['integer', 'null'],
				},
				statusTaxSri: {
					type: ['integer', 'null'],
					default: StatusTaxEcu.unSent,
				},
				flagConfigTaxes: {
					type: ['integer', 'null'],
				},
				withholdingTaxId: {
					type: ['integer', 'null'],
				},
				flagIncludesTaxes: {
					type: ['boolean', 'integer', 'null'],
					default: true,
				},
				flagTransferOrc: {
					type: ['boolean', 'integer', 'null'],
				},
				typeTransferKardex: {
					type: ['boolean', 'integer', 'null'],
				},
				statusOrcId: {
					type: ['integer', 'null'],
				},
				typeBiling: {
					type: ['integer', 'null'],
				},
				flagIncomeStatus: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				authorizationNumber: {
					type: ['string', 'null'],
				},
				environment: {
					type: ['string', 'null'],
				},
				emission: {
					type: ['string', 'null'],
				},
				password: {
					type: ['string', 'null'],
				},
				urlPassword: {
					type: ['string', 'null'],
				},
				serieId: {
					type: ['integer', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				originPlatform: {
					type: ['integer', 'null'],
					default: 2,
				},
				hashOnline: {
					type: ['string', 'null'],
				},
				sendKardexStatus: {
					type: ['integer', 'null'],
				},
				sendKardexMessage: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'date_document',
			'payment_method_id',
			'type_document_id',
			'supplier_id',
			'discount_amount',
			'discount_percentage',
			'exchange_amount',
			'exchange_rate',
			'due_amount',
			'type_catalog_id',
			'state_id',
			'payment_state_id',
			'serie',
			'number',
			'document_number',
			'commentary',
			'url_images',
			'flag_dispatch',
			'taxes_amount',
			'sunat_error',
			'status_tax',
			'status_tax_sri',
			'company_id',
			'com_employees_id',
			'currency',
			'amount',
			'sub_total',
			'total_without_withholding',
			'taxes',
			'pur_documents_id',
			'entity_state_id',
			'closed_at',
			'created_at',
			'type_expense_id',
			'warehouse_id',
			'flag_config_taxes',
			'withholding_tax_id',
			'terminal_id',
			'flag_includes_taxes',
			'flag_transfer_orc',
			'type_transfer_kardex',
			'status_orc_id',
			'type_billing',
			'flag_income_status',
			'authorization_number',
			'authorization_date',
			'environment',
			'emission',
			'password',
			'url_password',
			'serie_id',
			'qr_url',
			'cash_id',
			'additional_information',
			'origin_platform',
			'date_online',
			'hash_online',
			'send_kardex_status',
			'send_kardex_message',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static accountingColumns(otherColumns = []) {
		let columns = [
			'id',
			'date_document',
			'payment_method_id',
			'type_document_id',
			'supplier_id',
			'payment_state_id',
			'serie',
			'number',
			'document_number',
			'commentary',
			'taxes_amount',
			'company_id',
			'com_employees_id',
			'currency',
			'amount',
			'sub_total',
			'total_without_withholding',
			'taxes',
			'entity_state_id',
			'closed_at',
			'created_at',
			'flag_config_taxes',
			'withholding_tax_id',
			'terminal_id',
			'flag_includes_taxes',
			'type_transfer_kardex',
			'type_billing',
			'flag_income_status',
			'serie_id',
			'cash_id',
			'additional_information',
			'origin_platform',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static basicColumns(otherColumns = []) {
		let columns = ['id', 'cash_id'].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get namedFilters() {
		return {
			basicColumns: builder => builder.select(this.basicColumns()),
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return [
			'amountInWords',
			'paymentStateName',
			'currencySymbol',
			'accounted',
			'statusTaxName',
			'statusTaxSriName',
			'createdAtSri',
			'statusOrcName',
			'debtAmount',
		];
	}

	get statusOrcName() {
		let name;
		switch (this.statusOrcId) {
		case StatusOrc.pending:
			name = 'Pendiente';
			break;
		case StatusOrc.accepted:
			name = 'Aceptada';
			break;
		case StatusOrc.rejected:
			name = 'Rechazada';
			break;
		default:
			break;
		}
		return name;
	}

	get accounted() {
		return this.entityStateId === 4 ? 'Sí' : 'No';
	}

	get amountInWords() {
		const currencyPlural = this.currency === 'PEN' ? 'SOLES' : 'DOLARES AMERICANOS';
		const currencySingular = this.currency === 'PEN' ? 'SOL' : 'DOLAR AMERICANO';
		return numberToWords(this.amount, currencyPlural, currencySingular);
	}

	get paymentStateName() {
		let name;
		switch (this.paymentStateId) {
		case 1:
			name = 'En proceso';
			break;
		case 2:
			name = 'Parcial';
			break;
		case 3:
			name = 'Pagado';
			break;
		default:
			break;
		}
		return name;
	}

	get currencySymbol() {
		let name;
		switch (this.currency) {
		case 'PEN':
			name = 'S/';
			break;
		case 'USD':
			name = 'USD$';
			break;
		default:
			break;
		}
		return name;
	}

	get statusTaxName() {
		let name;
		switch (this.statusTax) {
		case 1:
			name = 'sin enviar';
			break;
		case 2:
			name = 'en proceso';
			break;
		case 3:
			name = 'validado';
			break;
		case 4:
			name = 'error';
			break;
		case 5:
			name = 'firmado';
			break;
		case 6:
			name = 'error al firmar';
			break;
		default:
			break;
		}
		return name;
	}

	get statusTaxSriName() {
		let name;
		switch (this.statusTaxSri) {
		case 1:
			name = 'sin enviar';
			break;
		case 2:
			name = 'firmado';
			break;
		case 3:
			name = 'error de firmado';
			break;
		case 4:
			name = 'enviado';
			break;
		case 5:
			name = 'error de enviado';
			break;
		case 6:
			name = 'en proceso de autorización';
			break;
		case 7:
			name = 'autorizado';
			break;
		case 8:
			name = 'error de autorizado';
			break;
		case 9:
			name = 'en proceso de envío';
			break;
		default:
			break;
		}
		return name;
	}

	get debtAmount() {
		return this.amount - this.dueAmount;
	}

	get createdAtSri() {
		return format(this.createdAt, 'DD/MM/YYYY');
	}

	// Any filter changes applied to "getAll" method should be also affect
	// "getTotalAmount" filters.
	static getAll(companyId, filter = {}) {
		const transactionTable = 'sal_transactions';
		const eager =
			'[withholdingTaxActive(selectColumns).details(selectColumns), supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), company(selectColumns), terminal(selectColumns), subsidiary(selectColumns), entityState(selectColumns), typeExpense(selectColumns), withholdingTax(selectColumns).details(selectColumns), transactions(selectColumns).[bankAccount(selectColumns), bank(selectColumns), typePayment(selectColumns), module(selectColumns)], transactionBank(selectColumns).[bankAccount(selectColumns), bank(selectColumns), moduleOrigin(selectColumns)]]';
		let query = this.query()
			.eager(eager)
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('payment_method_id', filter.paymentMethodId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('com_employees_id', filter.employeeId)
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId)
			.skipUndefined()
			.where('state_id', filter.stateId)
			.skipUndefined()
			.where('pur_document_annex_id', filter.purDocumentAnnexId)
			.skipUndefined()
			.where('supplier_id', filter.supplierId)
			.skipUndefined()
			.where('send_kardex_status', filter.sendKardexStatus);
		if (filter.entityStateId) {
			query.where(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}
		if (filter.currencies) {
			const currencies = `${filter.currencies}`;
			query.whereIn(`${this.tableName}.currency`, currencies.split(','));
		}

		if (filter.warehouseIds && filter.warehouseIds.length > 0) {
			query.whereIn(`${this.tableName}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn('type_document_id', filter.typeDocumentIds);
		}

		if (filter.stateIds) {
			query.whereIn('state_id', filter.stateIds);
		}

		if (filter.paymentStateIds) {
			query.whereIn('payment_state_id', filter.paymentStateIds);
		}

		if (filter.typePaymentId) {
			query
				.join(`${transactionTable}`, `${transactionTable}.pur_documents_id`, `${this.tableName}.id`)
				.where(`${transactionTable}.type_payment_id`, filter.typePaymentId);
		}

		if (query.aclFilters && query.aclFilters.subsidiaries) {
			query.aclFilter(query.aclFilters.subsidiaries, this.tableName);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.date_document) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.date_document) <= ?`, filter.endDate);
		}
		if (filter.search) {
			const fields = [
				'currency',
				'commentary',
				'document_number',
				'number',
				'serie',
				'environment',
			];
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getProductsInformation(ids = [], hapiAxios, url = '/v2/products/by-ids') {
		try {
			return hapiAxios.post(`${url}`, {
				products: ids,
			});
		} catch (error) {
			return error;
		}
	}

	static async setProductsToPurchases(
		purchases,
		hapiAxios,
		isArray = true,
		url = '/v2/products/by-ids',
	) {
		const productIds = purchases.reduce((acum, purchase) => {
			const ids = purchase.details.map(d => d.productId);
			return [...ids, ...acum];
		}, []);
		const productIdsUnique = uniqueValues(productIds);
		if (productIdsUnique.length > 0) {
			const products = await this.getProductsInformation(productIdsUnique, hapiAxios, url);
			const purchasesWithProducts = purchases.map((purchase) => {
				const newPurchase = purchase;
				newPurchase.details = newPurchase.details.map((detail) => {
					const newDetail = detail;
					const product = products.data.find(p => p.id === newDetail.productId);
					if (product) {
						newDetail.product = product;
					}
					return newDetail;
				});
				return newPurchase;
			});
			return isArray ? purchasesWithProducts : purchasesWithProducts[0];
		}
		return [];
	}

	static processPurchase(purchase, token) {
		const purchaseData = {};
		purchaseData.companyId = token.cms_companies_id;
		purchaseData.comEmployeesId = token.id;
		purchaseData.subsidiaryId = purchase.subsidiaryId || token.com_subsidiaries_id;
		purchaseData.details = purchase.details.map((detail) => {
			const newDetail = Object.assign({}, detail);
			delete newDetail.id;
			delete newDetail.series;
			delete newDetail.location;
			return newDetail;
		});
		if (purchase.exchangeRate) {
			purchaseData.exchangeAmount = purchase.amount / purchase.exchangeRate;
		}
		return purchaseData;
	}

	static updateBalanceBank(data = [], id, amount) {
		const newData = data.map((i) => {
			const newItem = i;
			const newBalance = newItem.newBalance || 0;
			if (i.id === id) {
				newItem.balance += amount;
				newItem.newBalance = newBalance + amount;
			}
			return newItem;
		});
		return newData;
	}

	static async create(data, token, typeDocumentCode, comModule, flagIncomeStatus) {
		try {
			const newPurchase = Object.assign(data, this.processPurchase(data, token, typeDocumentCode));
			const { comCountryId } = token.employee.company;
			let codeStates = flagIncomeStatus ? 'ING' : 'NIN';
			codeStates = typeDocumentCode === 'ORC' ? 'NIN' : codeStates;
			const responseCashId = data.cashId || token.employee.cashId;

			const promises = [PurMsState.getByCode(codeStates), TransactionState.getId('FINALIZADO')];
			const [statesItem, transactionState] = await Promise.all(promises);
			newPurchase.stateId = statesItem.id;
			newPurchase.dueAmount = newPurchase.amount;

			const puchaseResulTx = await transaction(
				this,
				Cash,
				Supplier,
				SalSeries,
				Transaction,
				PaymentMethod,
				MsTypePayment,
				MsTypeDocument,
				ComBankAccounts,
				async (
					PurchasesTx,
					CashTx,
					SupplierTx,
					SalSeriesTx,
					TransactionTx,
					PaymentMethodTx,
					MsTypePaymentTx,
					MsTypeDocumentTx,
					ComBankAccountsTx,
				) => {
					if (newPurchase.paymentMethodId) {
						const paymentMethod = await PaymentMethodTx.getById(newPurchase.paymentMethodId);
						const paymentState =
							paymentMethod.code === 'CONTADO' ? PaymentState.payOut : PaymentState.pending;
						if (
							paymentMethod.code === 'CREDITO' &&
							newPurchase.transactions &&
							newPurchase.transactions.length > 0
						) {
							delete newPurchase.transactions;
						}
						newPurchase.paymentStateId = paymentState;
					}

					let checkingAccount;
					if (Array.isArray(newPurchase.detailsPayments)) {
						const totalPayments = newPurchase.detailsPayments.length;
						if (totalPayments > 0) {
							newPurchase.dueAmount = 0;
							checkingAccount = {
								companyId: token.cms_companies_id,
								employeeId: token.id,
								userId: token.id,
								amount: newPurchase.amount,
								type: ModuleCode.purchases,
								status: QuotaState.pending,
								description: '',
								details: [],
								expirationDate: newPurchase.detailsPayments[totalPayments - 1].expirationDate,
								moduleId: ModuleCode.debtsToPay,
							};
							checkingAccount.details = newPurchase.detailsPayments.map((detail, idx) => {
								const detailPayment = Object.assign({}, detail);
								detailPayment.companyId = token.cms_companies_id;
								detailPayment.status = QuotaState.pending;
								detailPayment.amountPayment = 0;
								detailPayment.number = idx + 1;
								return detailPayment;
							});
							newPurchase.checkingAccounts = [checkingAccount];
						}
						delete newPurchase.detailsPayments;
					}

					if (newPurchase.terminalId && newPurchase.serieId && typeDocumentCode === 'LQC') {
						await SalSeriesTx.query()
							.patch({ number: raw('number+??', [1]) })
							.where('sal_terminals_id', newPurchase.terminalId)
							.where('id', newPurchase.serieId)
							.where('sal_type_documents_id', newPurchase.typeDocumentId)
							.where('company_id', newPurchase.companyId);

						const currentSerie = await SalSeriesTx.query()
							.where('sal_terminals_id', newPurchase.terminalId)
							.where('id', newPurchase.serieId)
							.where('sal_type_documents_id', newPurchase.typeDocumentId)
							.where('company_id', newPurchase.companyId)
							.first();

						newPurchase.serie = currentSerie.serie;
						newPurchase.number = currentSerie.number;
						newPurchase.documentNumber = `${currentSerie.serie}-${currentSerie.number}`;
					}
					if (
						Array.isArray(newPurchase.transactions) &&
						newPurchase.paymentStateId === PaymentState.payOut
					) {
						const newBalance = {};
						let bankAccountIds = newPurchase.transactions.map(item => item.bankAccountId);
						bankAccountIds = bankAccountIds.filter(item => item);
						let balanceB =
							bankAccountIds.length > 1
								? await ComBankAccountsTx.lastBalanceMultiple(
									token.cms_companies_id,
									bankAccountIds,
									// eslint-disable-next-line no-mixed-spaces-and-tabs
								  )
								: [];

						let balance = await TransactionTx.lastBalance(
							token.cms_companies_id,
							responseCashId,
							newPurchase.currency,
						);

						const newTransactions = [];
						const newTransactionBank = [];
						newPurchase.transactions = newPurchase.transactions.forEach((tx) => {
							const newTx = Object.assign({}, tx);
							if (newBalance[newTx.currency]) {
								newBalance[newTx.currency] += newTx.amount;
							} else {
								newBalance[newTx.currency] = newTx.amount;
							}
							newTx.employeeId = token.id;
							newTx.companyId = token.cms_companies_id;
							newTx.typeTransaction = TypeTransactionCash.normalTransaction;
							newTx.entityExternalId = newPurchase.supplierId;
							newTx.typeEntityId = TypeEntity.supplier;
							newTx.typeMovement = TypeMovement.expenses;
							newTx.moduleOriginId = comModule.id;
							newTx.typeAmortization = TypeAmortization.simple;
							const { company } = token.employee;
							let countryId;
							if (company.comCountryId) {
								countryId = company.comCountryId;
							}
							newTx.documentNumber = newPurchase.documentNumber;
							if (!newTx.concept) {
								newTx.additionalInformation = {
									subsidiaryId: newPurchase.subsidiaryId,
									documentNumber: newPurchase.documentNumber,
									dueAmount: newPurchase.dueAmount,
									description: newPurchase.commentary,
									emissionDate: helper.localDate(newPurchase.createdAt),
									expiratedAt: newPurchase.expiratedAt,
									typeDocumentCode,
									countryId,
									totalWithoutWithholding: newPurchase.withholdingTaxActive
										? newPurchase.totalWithoutWithholding
										: 0,
								};
								newTx.stateId = transactionState.id;
								newTx.concept = `Transaccion de compra ${typeDocumentCode} ${
									newPurchase.documentNumber
								} por ${newTx.currency} ${newPurchase.amount}`;
							}
							newTx.cashId = responseCashId;
							newTx.terminalId = data.terminalId;
							if (newTx.flagTypeTransaction === TypeTransaction.bank) {
								balanceB = PurchasesTx.updateBalanceBank(
									balanceB,
									newTx.bankAccountId,
									newTx.amount,
								);
								// eslint-disable-next-line max-len
								const dataBalance = balanceB.find(item => item.bankAccountId === newTx.bankAccountId);
								const bankAccountBalance = dataBalance ? dataBalance.balance : newTx.amount;

								delete newTx.flagTypeTransaction;
								newTx.balance = bankAccountBalance;
								newTx.warehouseId = data.warehouseId || token.war_warehouses_id;
								newTransactionBank.push(newTx);
							} else {
								delete newTx.typeTransactionBankId;
								delete newTx.flagTypeTransaction;
								delete newTx.bankAccountId;
								newTx.warWarehousesId = data.warehouseId || token.war_warehouses_id;
								newTx.hashOffline = newPurchase.hashOffline;
								balance += newTx.amount;
								newTx.balance = balance;
								newTx.paymentMethodId = newPurchase.paymentMethodId;
								newTransactions.push(newTx);
							}
						});
						newPurchase.transactions = newTransactions;
						newPurchase.transactionBank = newTransactionBank;

						await CashTx.updateBalance(token.cms_companies_id, responseCashId, newBalance);
						if (balanceB.length > 0) {
							const editTransactionBank = balanceB.map(item => ({
								balance: raw('balance+??', [item.newBalance]),
								id: item.id,
							}));
							await ComBankAccountsTx.editMultiple(editTransactionBank);
						}
					}
					if (
						newPurchase.paymentStateId === PaymentState.pending &&
						checkingAccount &&
						MsTypeDocumentTx.generateTransaction(typeDocumentCode)
					) {
						const totalWithholdingTax =
							newPurchase.withholdingTaxActive && typeDocumentCode !== 'LQC'
								? newPurchase.totalWithoutWithholding - newPurchase.amount
								: 0;
						const typePayment = await MsTypePaymentTx.getByCode(
							'comprobante-retencion',
							null,
							comCountryId,
						);
						checkingAccount.additionalInformation = {
							typeDocumentCode,
							comCountryId: comCountryId || token.comCountryId,
							supplierId: newPurchase.supplierId,
							subsidiaryId: newPurchase.subsidiaryId,
							warehouseId: newPurchase.warehouseId,
							documentNumber: newPurchase.documentNumber,
							currency: newPurchase.currency,
							emissionDate: helper.localDate(
								newPurchase.createdAt || new Date(),
								'YYYY-MM-DD HH:mm:ss',
							),
							totalWithholdingTax,
							typePaymentId: typePayment ? typePayment.id : null,
						};
						checkingAccount.description = `Compra a crédito ${typeDocumentCode} ${
							newPurchase.documentNumber
						} por ${newPurchase.currency} ${newPurchase.amount}`;
						newPurchase.checkingAccounts = [checkingAccount];
					}
					const debtAmount = newPurchase.amount - newPurchase.dueAmount;
					await SupplierTx.updateCurrencyAmount(
						newPurchase.supplierId,
						newPurchase.currency,
						debtAmount,
						newPurchase.amount,
					);

					await SupplierTx.updatePurchaseQuantity(data.supplierId, token.cms_companies_id);

					if (newPurchase.withholdingTaxActive) {
						const serieData = await SalSeriesTx.editNumber(
							newPurchase.withholdingTaxActive.serieId,
							token.cms_companies_id,
						);
						newPurchase.withholdingTaxActive.serie = serieData.serie;
						newPurchase.withholdingTaxActive.number = serieData.number;
						newPurchase.withholdingTaxActive.numberOperation = `${serieData.serie}-${
							serieData.number
						}`;
						newPurchase.flagConfigTaxes = FlagUse.alreadyUsed;
					}
					newPurchase.hashOnline = PurchasesTx.generateHashOnline(newPurchase);
					const hashEureka = await PurchasesTx.getHashOnline(
						newPurchase.companyId,
						newPurchase.hashOnline,
					);
					if (hashEureka) {
						// se debe devolver el error antes de terminar el metodo.
						newPurchase.reason = hashOnlinePurchasesDuplicate;
						return Promise.reject(newPurchase.reason);
					}
					const purchaseResponse = await PurchasesTx.query().insertGraph(newPurchase);
					return purchaseResponse;
				},
			);
			return Promise.resolve(puchaseResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async delete(dataPurchase, { purchaseDeleteId, withholdingTaxId }, companyId) {
		try {
			const txResult = await transaction(
				Purchases,
				PurchaseDocumentsDetail,
				AmortizationDetail,
				CaDocuments,
				Transaction,
				TransactionBank,
				Cash,
				WithholdingTax,
				DocumentAccountStatus,
				ComBankAccounts,
				async (
					PurchaseTx,
					PurchaseDetailTx,
					AmortizationDetailTx,
					CaDocumentsTx,
					TransactionTx,
					TransactionBankTx,
					CashTx,
					WithholdingTaxTx,
					DocumentAccountStatusTx,
					ComBankAccountsTx,
				) => {
					const data = await TransactionTx.getByDocument(purchaseDeleteId, companyId);
					const dataB = await TransactionBankTx.getByDocument(purchaseDeleteId, companyId);
					const newBalance = {};
					let newData = [];
					if (data.length > 0) {
						data.forEach((item) => {
							const amount = item.amount * -1;
							if (newBalance[item.currency]) {
								newBalance[item.currency] += amount;
							} else {
								newBalance[item.currency] = amount;
							}
						});
					}
					if (dataB.length > 0) {
						let bankAccountIds = dataB.map(item => item.bankAccountId);
						bankAccountIds = bankAccountIds.filter(item => item);
						newData =
							bankAccountIds.length > 1
								? await ComBankAccountsTx.lastBalanceMultiple(companyId, bankAccountIds)
								: [];
						dataB.forEach((item) => {
							const amount = item.amount * -1;
							if (newBalance[item.currency]) {
								newBalance[item.currency] += amount;
							} else {
								newBalance[item.currency] = amount;
							}
							newData = PurchaseTx.updateBalanceBank(newData, item.bankAccountId, item.amount);
						});
					}
					const promise = [
						PurchaseTx.remove(purchaseDeleteId, companyId),
						PurchaseDetailTx.removeByDocument(purchaseDeleteId),
						AmortizationDetailTx.removeByPurDocument(purchaseDeleteId, companyId),
						CaDocumentsTx.removeByPurDocument(purchaseDeleteId, companyId),
						TransactionTx.removeByDocument(purchaseDeleteId, companyId),
						TransactionBankTx.removeByDocument(purchaseDeleteId, companyId),
						DocumentAccountStatusTx.removeByDocument(purchaseDeleteId, companyId),
					];
					if (withholdingTaxId) {
						promise.push(WithholdingTaxTx.remove(withholdingTaxId, companyId));
					}
					if (Object.keys(newBalance).length > 0) {
						await CashTx.updateBalance(
							companyId,
							dataPurchase.cashId ||
								dataPurchase.data.cashId ||
								(dataPurchase.credentials.employee && dataPurchase.credentials.employee.cashId),
							newBalance,
						);
					}
					if (newData.length > 0) {
						const editTransactionBank = newData.map(item => ({
							balance: raw('balance+??', [item.newBalance]),
							id: item.id,
						}));
						await ComBankAccountsTx.editMultiple(editTransactionBank);
					}
					const response = await Promise.all(promise);
					return response;
				},
			);
			return Promise.resolve(txResult);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async update(newPurchase, { purchaseDeleteId, withholdingTaxId }, companyId) {
		try {
			let respPurchase;
			if (purchaseDeleteId && isDevOrProd()) {
				const { credentials } = newPurchase;
				const { status } = await simpleAxios({
					url: `${process.env.PRODUCTS_NEW_URL}/kardex/recalculate`,
					method: 'POST',
					headers: {
						authorization: credentials.authorization,
					},
					data: {
						companyId,
						documentId: purchaseDeleteId,
						moduleId: ModuleCode.purchases,
					},
					validateStatus: () => true,
				});
				if (status !== 200) {
					return Promise.reject(purchaseCannotDeleterror);
				}
			}
			return this.create(
				newPurchase.data,
				newPurchase.credentials,
				newPurchase.typeDocumentCode,
				newPurchase.module,
				newPurchase.flagIncomeStatus,
			)
				.then((respo) => {
					respPurchase = respo;
					return this.delete(newPurchase, { purchaseDeleteId, withholdingTaxId }, companyId);
				})
				.then(() => respPurchase)
				.catch(error => Promise.reject(error));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static editMultiple(data, trx) {
		const options = {
			noDelete: true,
			unrelate: false,
		};
		return this.query(trx).upsertGraph(data, options);
	}

	static editSendKardexStatus(ids, message) {
		return this.query()
			.patch({
				sendKardexStatus: StatusDispatch.delivered,
				sendKardexMessage: message,
				flagIncomeStatus: 1,
			})
			.whereIn('id', ids);
	}

	static getById(id, companyId) {
		const eager =
			'[withholdingTaxActive(selectColumns).details(selectColumns), company(selectColumns).country(selectColumns), supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), cash(basicColumns), payment(selectColumns), terminal(selectColumns), subsidiary(selectColumns), entityState(selectColumns), typeExpense(selectColumns), transactions(selectColumns).[bankAccount(selectColumns), bank(selectColumns)], transactionBank(selectColumns), checkingAccounts(selectColumns).details(selectColumns), withholdingTax(selectColumns).details(selectColumns)]';
		return this.query()
			.eager(eager)
			.findById(id)
			.where('company_id', companyId);
	}

	static getByIdSimple(id, companyId) {
		return this.query()
			.select(this.basicColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getByIds(id, companyId) {
		const eager =
			'[withholdingTaxActive(selectColumns).details(selectColumns), company(selectColumns).country(selectColumns), supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), terminal(selectColumns), subsidiary(selectColumns), entityState(selectColumns), typeExpense(selectColumns), transactions(selectColumns).[bankAccount(selectColumns), bank(selectColumns)], transactionBank(selectColumns), checkingAccounts(selectColumns).details(selectColumns), withholdingTax(selectColumns).details(selectColumns)]';
		return this.query()
			.eager(eager)
			.whereIn('id', id)
			.where('company_id', companyId);
	}

	static getListTaxes(ids, companyId) {
		const eager =
			'[company(selectColumns).country(selectColumns), supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), terminal(selectColumns), subsidiary(selectColumns), entityState(selectColumns), typeExpense(selectColumns), transactions(selectColumns).[bankAccount(selectColumns), bank(selectColumns)], transactionBank(selectColumns), checkingAccounts(selectColumns).details(selectColumns), withholdingTax(selectColumns).details(selectColumns), withholdingTaxActive(selectColumns).details(selectColumns)]';
		return this.query()
			.eager(eager)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getListKardex(ids, companyId, filters) {
		const eager =
			'[company(selectColumns), supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), terminal(selectColumns), subsidiary(selectColumns), entityState(selectColumns)]';
		const query = this.query()
			.eager(eager)
			.whereIn('id', ids)
			.where('company_id', companyId);

		if (filters.saleWithoutMovement) {
			query.where('send_kardex_status', pending);
		}
		return query;
	}

	static edit(id, data, companyId) {
		return this.query()
			.patchAndFetchById(id, data)
			.where('company_id', companyId);
	}

	static editFlagConfigTaxes(id, { flagConfigTaxes, withholdingTaxId, trx }, companyId) {
		return this.query(trx)
			.patch({ flagConfigTaxes, withholdingTaxId })
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static supplierRelatedValidation(id, companyId) {
		return this.query()
			.where('supplier_id', id)
			.where('company_id', companyId)
			.first();
	}

	static getListAmortization(companyId, filter = {}, supplierId, typePaymentMethodId, stateId) {
		const eagerFilter =
			'[supplier(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns)]';
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerFilter)
			.where('company_id', companyId)
			.skipUndefined()
			.where('supplier_id', supplierId)
			.where(raw('due_amount < amount'))
			.where('payment_method_id', typePaymentMethodId)
			.where('state_id', '<>', stateId)
			.skipUndefined()
			.where('currency', filter.currency)
			.orderBy('created_at');

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static updateStateId(id, companyId) {
		return this.query()
			.patch({ stateId: IncomeStatus.entered, flagIncomeStatus: IncomeStatus.entered })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getDocumentAmortizationById(id, companyId) {
		return this.query()
			.select('company_id', 'id')
			.eager('[amortizationDetails(selectColumns).[amortization(selectColumns).[transaction(selectColumns).[typePayment(selectColumns), bankAccount(selectColumns)], transactionBank(selectColumns).[typeTransactionBank(selectColumns), bankAccount(selectColumns), typePayment(selectColumns)]]]]')
			.where('company_id', companyId)
			.findById(id);
	}

	static getStatusSri(id, companyId) {
		return this.query()
			.select('company_id', 'id', 'status_tax_sri')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getTotalAmount(companyId, filter, paymentMethodId) {
		const transactionTable = 'sal_transactions';
		const query = this.query()
			.select(raw('SUM(amount) AS totalPurchases'))
			.where('company_id', companyId)
			.skipUndefined()
			.where('payment_method_id', paymentMethodId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('com_employees_id', filter.employeeId)
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId)
			.skipUndefined()
			.where('state_id', filter.stateId)
			.skipUndefined()
			.where('pur_document_annex_id', filter.purDocumentAnnexId)
			.skipUndefined()
			.where('supplier_id', filter.supplierId)
			.skipUndefined()
			.where('send_kardex_status', filter.sendKardexStatus);
		if (filter.entityStateId) {
			query.where(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}
		if (filter.currencies) {
			const currencies = `${filter.currencies}`;
			query.whereIn(`${this.tableName}.currency`, currencies.split(','));
		}

		if (filter.warehouseIds && filter.warehouseIds.length > 0) {
			query.whereIn(`${this.tableName}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn('type_document_id', filter.typeDocumentIds);
		}

		if (filter.stateIds) {
			query.whereIn('state_id', filter.stateIds);
		}

		if (filter.paymentStateIds) {
			query.whereIn('payment_state_id', filter.paymentStateIds);
		}

		if (filter.typePaymentId) {
			query
				.join(`${transactionTable}`, `${transactionTable}.pur_documents_id`, `${this.tableName}.id`)
				.where(`${transactionTable}.type_payment_id`, filter.typePaymentId);
		}

		if (query.aclFilters && query.aclFilters.subsidiaries) {
			query.aclFilter(query.aclFilters.subsidiaries, this.tableName);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.date_document) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.date_document) <= ?`, filter.endDate);
		}
		if (filter.search) {
			const fields = [
				'currency',
				'commentary',
				'document_number',
				'number',
				'serie',
				'environment',
			];
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}
		return query;
	}

	static exportExcel({
		companyId,
		paymentMethodId,
		employeeId,
		supplierId,
		warehouseId,
		warehouses,
		subsidiaries,
		typeDocumentIds,
		stateIds,
		paymentStateIds,
		startDate,
		endDate,
		currencies,
	}) {
		const purchaseColumns = ['document_number', 'created_at', 'date_document', 'amount'].map(c => `${this.tableName}.${c}`);
		const subColumns = ['s.name as supplierName', 's.document_number as recordNumber'];
		const pColumns = ['p.name as paymentName'];
		const stColumns = ['ps.name as statusName'];
		const typeDocumentColumns = 'td.name as type_document_name';
		let paymentStateName = `CASE WHEN ${this.tableName}.payment_state_id = 1 THEN "En proceso"`;
		paymentStateName += ` WHEN ${this.tableName}.payment_state_id =  2 THEN "Parcial"`;
		paymentStateName += ` WHEN ${this.tableName}.payment_state_id =  3 THEN "Pagado"`;
		paymentStateName += ' ELSE "No Definido" END as paymentStateName';
		const rawColumns = [
			raw(`(${this.tableName}.amount - ${this.tableName}.due_amount) as debtAmount`),
			raw(`CASE WHEN ${this.tableName}.entity_state_id = 1 THEN "Si" ELSE "No" END as accounted`),
			raw(`DATE_FORMAT(DATE(${this.tableName}.date_document), '%Y-%m-%d') as dateDocument`),
			raw(`DATE_FORMAT(DATE(${this.tableName}.created_at), '%Y-%m-%d') as createdAt`),
			typeDocumentColumns,
			raw(paymentStateName),
		];
		const columns = purchaseColumns.concat(subColumns, pColumns, stColumns, rawColumns);

		const query = this.query()
			.select(columns)
			.innerJoin('pur_suppliers as s', 's.id', `${this.tableName}.supplier_id`)
			.innerJoin('pur_ms_states as ps', 'ps.id', `${this.tableName}.state_id`)
			.innerJoin('com_ms_type_documents as td', 'td.id', `${this.tableName}.type_document_id`)
			.leftJoin('sal_method_payments as p', 'p.id', `${this.tableName}.payment_method_id`)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.com_employees_id`, employeeId)
			.skipUndefined()
			.where(`${this.tableName}.supplier_id`, supplierId)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.currency`, currencies)
			.skipUndefined()
			.where(`${this.tableName}.payment_method_id`, paymentMethodId);

		if (stateIds && stateIds.length > 0) {
			query.whereIn(`${this.tableName}.state_id`, stateIds);
		}

		if (paymentStateIds && paymentStateIds.length > 0) {
			query.whereIn(`${this.tableName}.payment_state_id`, paymentStateIds);
		}

		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${this.tableName}.type_document_id`, typeDocumentIds);
		}

		if (subsidiaries && subsidiaries.length > 0) {
			query.whereIn(`${this.tableName}.subsidiary_id`, subsidiaries);
		}

		if (warehouses && warehouses.length > 0) {
			query.whereIn(`${this.tableName}.warehouse_id`, warehouses);
		}

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.date_document, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.date_document, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}

		return query;
	}

	static getDocumentAndSerieBySupplierRelated(id, serie, document, companyId) {
		return this.query()
			.where('supplier_id', id)
			.where('serie', serie)
			.where('number', document)
			.where('company_id', companyId)
			.first();
	}

	static async getHashOnline(companyId, hashOnline) {
		return this.query()
			.select('id')
			.where('hash_online', hashOnline)
			.where('company_id', companyId)
			.first();
	}

	static generateHashOnline({
		warehouseId,
		terminalId,
		companyId,
		supplierId,
		subsidiaryId,
		serie,
		number,
		dateOnline,
	}) {
		return `${companyId}-${subsidiaryId}-${warehouseId}-${terminalId}-${supplierId}-${serie}-${number}-${dateOnline}`;
	}
}

module.exports = Purchases;
