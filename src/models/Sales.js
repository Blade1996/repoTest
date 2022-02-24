/* eslint-disable no-shadow */

'use strict';

const { Model, transaction, raw } = require('objection');
const { card, voucher, cash } = require('./enums/type-payment-form-enum');
const simpleAxios = require('./../api/shared/simple-axios');
const baseModel = require('./base');
const helper = require('./helper');
const format = require('date-fns/format');
const Serie = require('./SalSeries');
const SaleStateMachine = require('./SaleStateMachine');
const numberToWords = require('../shared/numberToWords');
const Table = require('./Table');
const tableStatus = require('./TableStatus');
const Kardex = require('./Kardex');
const { credit } = require('./PaymentMethodCode');
// const notifications = require('../api/integration-api-external/notifications/notifications');
const SaleDocumentsDetail = require('./SaleDocumentsDetail');
const PaymentState = require('./PaymentState');
const MsTypeDocument = require('./MsTypeDocument');
const TypeNtcSunat = require('./TypeNtcSunat');
const CatalogSunatDetails = require('./CatalogSunatDetails');
const TypeMovement = require('./TypeMovement');
const TypeAmortization = require('./TypeAmortization');
const TypeTransactionCash = require('./TypeTransactionCash');
const TypeEntity = require('./TypeEntity');
const Transaction = require('./Transaction');
const TransactionBank = require('./TransactionBank');
const ModuleCode = require('./ModuleCode');
const TypeTransaction = require('./TypeTransaction');
const Cash = require('./Cash');
const ComBankAccounts = require('./ComBankAccounts');
const Order = require('./SalOrders');
const Subsidiary = require('./ComSubsidiaries');
const SubsidiaryCustomer = require('./SubsidiaryCustomer');
const DocumentAccountStatus = require('./DocumentAccountStatus');
const PaymentMethodCode = require('./PaymentMethodCode');
const CountryCode = require('./CountryCode');
const TypeBilling = require('./TypeBilling');
const Aws = require('./Aws');
const MsTransactionStates = require('./MsTransactionStates');
const {
	isDevOrProd,
	isNullOrUndefined,
	uniqueValues,
	configCompanySerie0,
	configCompanySerieP,
	configCompanySerieA,
} = require('../shared/helper');
const qrcode = require('qrcode-generator');
const { peru } = require('./CountryCode');
const TypeSummary = require('./enums/type-summary-enums');
const saleStates = require('./enums/sales-states-enum');
const transactionStates = require('./enums/transaction-states-enum');
const OriginPlatform = require('./enums/origin-platform-enum');
const StatusDispatch = require('./enums/status-dispatch-guides-enum');
const subTypes = require('./enums/sub-type-documents-enum');
const helperEcu = require('./../shared/helperParserXml');
const { pending } = require('./enums/status-dispatch-guides-enum');
const { inProcess, errorFromTaxesBiller, validated } = require('./StatusTax');
const saleEntityStates = require('./enums/sales-entity-states-enum');
const { hashOnlineSalesDuplicate } = require('./../api/shared/error-codes');
const TypePayment = require('./MsTypePayment');

class SaleDocuments extends baseModel {
	static get tableName() {
		return 'sal_documents';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'sal_documents.com_company_id',
					to: 'com_companies.id',
				},
			},
			payment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PaymentMethod.js`,
				join: {
					from: 'sal_documents.payment_method_id',
					to: 'sal_method_payments.id',
				},
			},
			state: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalesStates.js`,
				join: {
					from: 'sal_documents.sal_states_id',
					to: 'sal_sales_states.id',
				},
			},
			typeDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeDocument.js`,
				join: {
					from: 'sal_documents.sal_type_document_id',
					to: 'com_ms_type_documents.id',
				},
			},
			customer: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'sal_documents.customer_id',
					to: 'com_customers.id',
				},
			},
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SaleDocumentsDetail.js`,
				join: {
					from: 'sal_documents.id',
					to: 'sal_sale_documents_detail.sal_sale_documents_id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_documents.com_employee_id',
					to: 'com_employee.id',
				},
			},
			checkingAccounts: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CaDocuments.js`,
				join: {
					from: 'sal_documents.id',
					to: 'ca_documents.document_id',
				},
			},
			caDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CaDocuments.js`,
				filter: query => query.orderBy('expiration_date'),
				join: {
					from: 'sal_documents.id',
					to: 'ca_documents.document_id',
				},
			},
			transactions: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Transaction.js`,
				filter: query => query.where('sal_transactions.flag_transfer', 0),
				join: {
					from: 'sal_documents.id',
					to: 'sal_transactions.sal_sale_documents_id',
				},
			},
			transactionsBank: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/TransactionBank.js`,
				join: {
					from: 'sal_documents.id',
					to: 'com_transaction_bank.sal_documents_id',
				},
			},
			table: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Table.js`,
				join: {
					from: 'sal_documents.table_id',
					to: 'sal_tables.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'sal_documents.terminal_id',
					to: 'sal_terminals.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_documents.com_subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			typeCatalogSunat: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CatalogSunatDetails.js`,
				join: {
					from: 'sal_documents.type_catalog_sunat_id',
					to: 'ms_catalog_sunat_details.id',
				},
			},
			documents: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_documents.id',
					to: 'sal_documents.sal_documents_id',
				},
			},
			salSeries: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalSeries.js`,
				join: {
					from: 'sal_documents.serie_id',
					to: 'sal_series.id',
				},
			},
			documentRelated: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_documents.sal_documents_id',
					to: 'sal_documents.id',
				},
			},
			downPaymentDocuments: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				filter: query => query.where('sal_documents.flag_advance', 1),
				join: {
					from: 'sal_documents.id',
					to: 'sal_documents.down_payment_document_id',
				},
			},
			remissionGuides: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/RemissionGuide.js`,
				join: {
					from: 'sal_documents.id',
					to: 'sal_remission_guides.sal_sale_documents_id',
				},
			},
			order: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'sal_documents.order_id',
					to: 'sal_orders.id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'sal_documents.cash_id',
					to: 'com_cash.id',
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
					from: 'sal_documents.id',
					to: 'ca_amortizations_details.sal_document_id',
				},
			},
			user: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_documents.user_id',
					to: 'com_employee.id',
				},
			},
			withholdingTax: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/WithholdingTax.js`,
				join: {
					from: 'sal_documents.withholding_tax_id',
					to: 'com_withholding_tax.id',
				},
			},
			documentAccountStatus: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/DocumentAccountStatus.js`,
				join: {
					from: 'sal_documents.id',
					to: 'com_document_account_status.sale_document_id',
				},
			},
			discountCoupons: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComDiscountDocuments.js`,
				join: {
					from: 'sal_documents.id',
					to: 'com_discount_document.document_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [
				'userId',
				'salStatesId',
				'comEmployeeId',
				'currency',
				'amount',
				'subtotal',
				'taxes',
				'serie',
				'number',
				'comCompanyId',
				'comSubsidiaryId',
				'salTypeDocumentId',
				'serieId',
				'terminalId',
			],
			properties: {
				userId: {
					type: 'integer',
				},
				salDocumentsId: {
					type: ['integer', 'null'],
				},
				salTypePaymentId: {
					type: 'integer',
				},
				paymentMethodId: {
					type: ['integer', 'null'],
				},
				salStatesId: {
					type: 'integer',
				},
				comEmployeeId: {
					type: 'integer',
				},
				comEmployeeRegisteredId: {
					type: ['integer', 'null'],
				},
				comTurnsId: {
					type: 'integer',
				},
				salOrdersId: {
					type: 'integer',
				},
				currency: {
					type: 'string',
				},
				amount: {
					type: 'decimal',
				},
				subtotal: {
					type: 'decimal',
				},
				taxes: {
					type: 'decimal',
				},
				exchangeAmount: {
					type: 'decimal',
				},
				dataClient: {
					type: ['object', 'null'],
				},
				tableCode: {
					type: 'string',
				},
				serie: {
					type: 'string',
				},
				number: {
					type: 'string',
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				importDays: {
					type: 'integer',
				},
				deliveredAt: {
					type: 'timestamp',
				},
				expiratedAt: {
					type: ['string', 'null'],
				},
				dateDispatch: {
					type: 'timestamp',
				},
				closedAt: {
					type: 'timestamp',
				},
				customerId: {
					type: 'integer',
				},
				commentary: {
					type: ['string', 'null'],
				},
				exchangeRate: {
					type: 'decimal',
				},
				paymentAmount: {
					type: 'decimal',
				},
				commerceCode: {
					type: 'string',
				},
				operationCode: {
					type: 'string',
				},
				creationDateNumber: {
					type: ['integer', 'timestamp', 'string', 'null'],
				},
				idsdOthers: {
					type: 'integer',
				},
				comCompanyId: {
					type: 'integer',
				},
				comSubsidiaryId: {
					type: 'integer',
				},
				salTypeDocumentId: {
					type: 'integer',
				},
				dateIssue: {
					type: 'timestamp',
				},
				reason: {
					type: 'text',
				},
				discount: {
					type: 'decimal',
				},
				tip: {
					type: 'decimal',
				},
				salCashDeskClosingId: {
					type: ['integer', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				serieId: {
					type: 'integer',
				},
				terminalId: {
					type: 'integer',
				},
				amountCash: {
					type: ['number', 'null'],
				},
				amountCredit: {
					type: ['number', 'null'],
				},
				creditCardName: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: 'string',
				},
				tableId: {
					type: ['integer', 'null'],
				},
				statusOrder: {
					type: ['integer', 'null'],
				},
				flagDispatch: {
					type: ['boolean', 'integer'],
					default: false,
				},
				flagAdvance: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				downPaymentDocumentId: {
					type: ['integer', 'null'],
				},
				sunatError: {
					type: ['string', 'null'],
				},
				considerations: {
					type: 'array',
					default: [],
				},
				workToDo: {
					type: 'array',
					default: [],
				},
				paymentState: {
					type: ['integer', 'null'],
				},
				typeCatalogSunatId: {
					type: ['integer', 'null'],
				},
				qrUrl: {
					type: ['string', 'null'],
				},
				authorizationDate: {
					type: 'date',
				},
				urlPassword: {
					type: ['string', 'null'],
				},
				taxesAmount: {
					type: ['object', 'null'],
				},
				externalData: {
					type: ['object', 'null'],
				},
				cancelUserId: {
					type: ['integer', 'null'],
				},
				cancelUserName: {
					type: ['string', 'null'],
				},
				statusTaxSri: {
					type: ['integer', 'null'],
				},
				taxCancellationStatus: {
					type: ['boolean', 'integer'],
					default: false,
				},
				urlImages: {
					type: ['array', 'null'],
				},
				relatedDocuments: {
					type: ['array', 'null'],
				},
				warehouseName: {
					type: ['string', 'null'],
				},
				referenceExternal: {
					type: ['string', 'null'],
				},
				typePaymentCodes: {
					type: ['array', 'null'],
					default: [],
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
				totalTaxesAmount: {
					type: ['object', 'null'],
				},
				flagTransfer: {
					type: ['boolean', 'integer', 'null'],
				},
				flagTypeReturn: {
					type: ['integer', 'null'],
				},
				subsidiaryRuc: {
					type: ['string', 'null'],
				},
				subsidiaryName: {
					type: ['string', 'null'],
				},
				subsidiaryRzSocial: {
					type: ['string', 'null'],
				},
				subsidiaryAddress: {
					type: ['string', 'null'],
				},
				warehouseCodeTaxes: {
					type: ['string', 'null'],
				},
				dayImportTerm: {
					type: ['integer', 'null'],
				},
				orderId: {
					type: ['integer', 'null'],
				},
				entityStateId: {
					type: ['integer', 'null'],
				},
				ballotSummaryId: {
					type: ['integer', 'null'],
				},
				summaryUnsubscribeId: {
					type: ['integer', 'null'],
				},
				flagMobile: {
					type: ['boolean', 'integer'],
					default: false,
				},
				balance: {
					type: ['number', 'null'],
					default: 0,
				},
				dateOnline: {
					type: ['string', 'null'],
				},
				hashOnline: {
					type: ['string', 'null'],
				},
				flagOffline: {
					type: ['boolean', 'integer', 'null'],
				},
				flagBasePrice: {
					type: ['number', 'null'],
				},
				typeBilling: {
					type: ['integer', 'null'],
				},
				originPlatform: {
					type: ['integer', 'null'],
					default: OriginPlatform.web,
				},
				sendKardexStatus: {
					type: ['integer', 'null'],
					default: StatusDispatch.pending,
				},
				sendKardexMessage: {
					type: ['string', 'null'],
				},
				withholdingTaxId: {
					type: ['integer', 'null'],
				},
				subsidyAmount: {
					type: ['number', 'null'],
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				accountingSeat: {
					type: ['object', 'null'],
				},
				dataResponseTaxes: {
					type: ['object', 'null'],
				},
				flagOldSale: {
					type: ['boolean', 'integer'],
				},
				subTypeDocuments: {
					type: ['object', 'null'],
					default: {},
				},
				totalPoints: {
					type: ['integer', 'null'],
				},
				flagSyncFb: {
					type: ['number', 'null'],
					default: 0,
				},
				discountGlobal: {
					type: ['number', 'null'],
					default: 0,
				},
				...defaultsProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return [
			'amountInWords',
			'statusOrderName',
			'localDate',
			'statusTaxName',
			'paymentStateName',
			'currencySymbol',
			'formatNumbers',
			'paymentStateColor',
			'typePaymentNames',
			'statusTaxSriName',
			'debtAmount',
			'createdAtSri',
			'flagNtc',
			'flagCot',
			'remissionGuideNames',
			'documentNumberComplete',
			'totalQuantitySold',
			'typePaymentCodesString',
			'originPlatformName',
			'withoutSubsidyAmount',
			'taxSubsidyAmount',
			'amountDownPaymentDocuments',
			'withoutSubsidyAmountTax',
			'datesFormatted',
			'currencyName',
			'entityStateName',
			'vatTaxes',
			'convertStatus',
		];
	}

	get vatTaxes() {
		let total = 0;
		let ivas = null;
		let subTotals = 0;
		let subIvas = null;
		let subNotIvas = null;
		let discounts = null;
		let dateEmissions = null;
		let documentNumbers = null;
		if (this.totalTaxesAmount) {
			total = this.amount;
			ivas = this.totalTaxesAmount.iva || null;
			subTotals = this.totalTaxesAmount.subtotalWithoutTax;
			subIvas =
				Number(this.totalTaxesAmount.iva) > 0 ? this.totalTaxesAmount.subtotalWithoutTax : null;
			subNotIvas =
				Number(this.totalTaxesAmount.iva) === 0 ? this.totalTaxesAmount.subtotalWithoutTax : null;
			discounts = this.totalTaxesAmount.discount;
			dateEmissions = this.dateEmission;
			documentNumbers = this.documentNumber;
		}
		return {
			total,
			iva: ivas ? Number(ivas).toFixed(2) : null,
			subTotal: Number(subTotals).toFixed(2),
			subIva: subIvas ? Number(subIvas).toFixed(2) : null,
			subNotIva: subNotIvas ? Number(subNotIvas).toFixed(2) : null,
			discount: discounts > 0 ? discounts : null,
			dateEmission: dateEmissions,
			documentNumber: documentNumbers,
		};
	}

	get entityStateName() {
		let entityStateName = 'Confirmado';
		if (this.entityStateId === 1) {
			entityStateName = 'Confirmado';
		} else if (this.entityStateId === 2) {
			entityStateName = 'Cancelado';
		} else if (this.entityStateId === 3) {
			entityStateName = 'Pendiente';
		} else if (this.entityStateId === 4) {
			entityStateName = 'Contabilizado';
		}
		return entityStateName;
	}

	get withoutSubsidyAmount() {
		const details = this.details && this.details.length > 0 ? this.details : [];
		const acumTotalItem = details.reduce((acum, item) => {
			const subsidyAmount = item.subsidyAmount || 0;
			const totalItem = item.quantity * item.price;
			return subsidyAmount ? acum + totalItem : acum;
		}, 0);
		const withoutSubsidyAmount =
			this.subsidyAmount && acumTotalItem ? acumTotalItem + this.subsidyAmount : 0;
		return withoutSubsidyAmount;
	}

	get withoutSubsidyAmountTax() {
		let withoutSubsidyAmount = 0;
		if (!isNullOrUndefined(this.subsidyAmount) && this.subsidyAmount > 0) {
			const details = this.details && this.details.length > 0 ? this.details : [];
			const acumTotalItem = details.reduce((acum, item) => {
				const subsidyAmount = item.subsidyAmount || 0;
				let taxPorcent = item.tax / 100;
				taxPorcent += 1;
				const totalItem = taxPorcent * subsidyAmount;
				return subsidyAmount ? acum + totalItem : acum;
			}, 0);
			withoutSubsidyAmount = this.subsidyAmount && acumTotalItem ? acumTotalItem : 0;
		}
		return withoutSubsidyAmount > 0 ? withoutSubsidyAmount.toFixed(2) : '0.00';
	}

	get taxSubsidyAmount() {
		let withoutSubsidyAmount = 0;
		if (!isNullOrUndefined(this.subsidyAmount) && this.subsidyAmount > 0) {
			const details = this.details && this.details.length > 0 ? this.details : [];
			const acumTotalItem = details.reduce((acum, item) => {
				const subsidyAmount = item.subsidyAmount || 0;
				let taxPorcent = item.tax / 100;
				taxPorcent += 1;
				const totalItem = taxPorcent * item.subsidyAmount;
				return subsidyAmount ? acum + totalItem : acum;
			}, 0);
			withoutSubsidyAmount = this.subsidyAmount && acumTotalItem ? acumTotalItem + this.amount : 0;
		}
		return withoutSubsidyAmount > 0 ? withoutSubsidyAmount.toFixed(2) : '0.00';
	}

	get typePaymentCodesString() {
		const typePayment = this.typePaymentCodes;
		if (typePayment && Array.isArray(typePayment)) {
			return typePayment.join(', ');
		}
		return '';
	}

	get documentNumberComplete() {
		let newDigitCorrelativeSale = 8;
		if (this.company && this.company.settings) {
			const { digitCorrelativeSale } = this.company.settings;
			newDigitCorrelativeSale = digitCorrelativeSale;
		}
		let qpCode = '';
		let documentNumberComplete;
		let { serie } = this;
		const countryCode =
			this.company && this.company.country ? this.company.country.countryCode : CountryCode.peru;
		if (countryCode === CountryCode.peru) {
			if (this.typeDocument) {
				const { settings, qpCode: prefix, code } = this.typeDocument;
				qpCode = prefix;
				if (
					this.comCompanyId &&
					configCompanySerie0(this.comCompanyId) &&
					['FAC', 'BOL', 'NTC'].indexOf(code) > -1
				) {
					qpCode = `${qpCode.substring(0, 1)}0`;
				}
				if (
					this.comCompanyId &&
					configCompanySerieP(this.comCompanyId) &&
					['FAC', 'BOL', 'NTC'].indexOf(code) > -1
				) {
					qpCode = `${qpCode.substring(0, 1)}P`;
				}
				if (
					this.comCompanyId &&
					configCompanySerieA(this.comCompanyId) &&
					['FAC', 'BOL', 'NTC'].indexOf(code) > -1
				) {
					qpCode = `${qpCode.substring(0, 1)}A`;
				}
				if (settings && settings.subTypes && this.subTypeDocuments) {
					qpCode = this.subTypeDocuments[subTypes.exportBill]
						? settings.subTypes[subTypes.exportBill].value
						: qpCode;
					serie = serie.replace('E', '0');
				}

				if (this.typeDocument.code === 'NTC') {
					qpCode =
						this.documentRelated && this.documentRelated.typeDocument
							? this.documentRelated.typeDocument.qpCode
							: '';
					if (
						this.comCompanyId &&
						configCompanySerie0(this.comCompanyId) &&
						['FAC', 'BOL', 'NTC'].indexOf(code) > -1
					) {
						qpCode = `${qpCode.substring(0, 1)}0`;
					}
					if (
						this.comCompanyId &&
						configCompanySerieP(this.comCompanyId) &&
						['FAC', 'BOL', 'NTC'].indexOf(code) > -1
					) {
						qpCode = `${qpCode.substring(0, 1)}P`;
					}
					if (
						this.comCompanyId &&
						configCompanySerieA(this.comCompanyId) &&
						['FAC', 'BOL', 'NTC'].indexOf(code) > -1
					) {
						qpCode = `${qpCode.substring(0, 1)}A`;
					}
				}
			}
		}
		if (countryCode === CountryCode.ecuador) {
			serie = serie.length === 6 ? `${serie.substring(0, 3)}-${serie.substring(3, 6)}` : serie;
		}
		documentNumberComplete = this.number;
		while (documentNumberComplete && documentNumberComplete.length < newDigitCorrelativeSale) {
			documentNumberComplete = `0${documentNumberComplete}`;
		}
		return this.typeDocument
			? `${qpCode}${serie}-${documentNumberComplete}`
			: `${serie}-${documentNumberComplete}`;
	}

	get flagNtc() {
		if (this.typeDocument && this.typeDocument.code && this.typeDocument.code === 'NTC') {
			return true;
		}
		return false;
	}

	get flagCot() {
		if (this.typeDocument && this.typeDocument.code && this.typeDocument.code === 'COT') {
			return true;
		}
		return false;
	}

	get debtAmount() {
		return this.amount - this.dueAmount;
	}

	get createdAtSri() {
		return helper.localDate(this.createdAt, 'DD/MM/YYYY');
	}

	get statusTaxName() {
		const countryCode =
			this.company && this.company.country ? this.company.country.countryCode : CountryCode.peru;
		let data = {};
		if (countryCode === CountryCode.ecuador) {
			switch (this.statusTaxSri) {
			case 1:
				data = { name: 'sin enviar', color: 'black', showDetails: false };
				break;
			case 2:
				data = { name: 'firmado', color: 'purple', showDetails: true };
				break;
			case 3:
				data = { name: 'error de firmado', color: 'red', showDetails: true };
				break;
			case 4:
				data = { name: 'enviado', color: 'purple', showDetails: true };
				break;
			case 5:
				data = { name: 'error de enviado', color: 'red', showDetails: true };
				break;
			case 6:
				data = {
					name: 'en proceso de autorización',
					color: 'yellow darken-2',
					showDetails: true,
				};
				break;
			case 7:
				data = { name: 'autorizado', color: 'green', showDetails: true };
				break;
			case 8:
				data = { name: 'error de autorizado', color: 'red', showDetails: true };
				break;
			case 9:
				data = { name: 'en proceso de envío', color: 'yellow darken-2', showDetails: false };
				break;
			default:
				break;
			}
			return data;
		}
		switch (this.statusTax) {
		case 1:
			data = { name: 'sin enviar', color: 'black', showDetails: false };
			break;
		case 2:
			data = { name: 'en proceso', color: 'yellow darken-2', showDetails: false };
			break;
		case 3:
			data = { name: 'validado', color: 'green', showDetails: true };
			break;
		case 4:
			data = { name: 'error', color: 'red', showDetails: true };
			break;
		case 5:
			data = { name: 'firmado', color: 'purple', showDetails: true };
			break;
		case 6:
			data = { name: 'error al firmar', color: 'red', showDetails: true };
			break;
		case 7:
			data = { name: 'error de SUNAT', color: 'deep-orange', showDetails: false };
			break;
		default:
			break;
		}
		return data;
	}

	get convertStatus() {
		if (this.documents && this.documents.length > 0) {
			return {
				id: 3,
				name: 'Convertido',
			};
		}
		return {
			id: 1,
			name: 'Pendiente',
		};
	}

	get statusTaxSriName() {
		let data = {};
		switch (this.statusTaxSri) {
		case 1:
			data = { name: 'sin enviar', color: 'black', showDetails: false };
			break;
		case 2:
			data = { name: 'firmado', color: 'purple', showDetails: true };
			break;
		case 3:
			data = { name: 'error de firmado', color: 'red', showDetails: true };
			break;
		case 4:
			data = { name: 'enviado', color: 'purple', showDetails: true };
			break;
		case 5:
			data = { name: 'error de enviado', color: 'red', showDetails: true };
			break;
		case 6:
			data = { name: 'en proceso de autorización', color: 'yellow darken-2', showDetails: true };
			break;
		case 7:
			data = { name: 'autorizado', color: 'green', showDetails: true };
			break;
		case 8:
			data = { name: 'error de autorizado', color: 'red', showDetails: true };
			break;
		case 9:
			data = { name: 'en proceso de envío', color: 'yellow darken-2', showDetails: false };
			break;
		default:
			break;
		}
		return data;
	}

	get amountDownPaymentDocuments() {
		let taxes = 0;
		let amount = 0;
		let subtotal = 0;
		let amountInWords = '';
		let flagAmountInWords = false;
		const { downPaymentDocuments, downPaymentDocumentId } = this;
		if (
			downPaymentDocuments &&
			Array.isArray(downPaymentDocuments) &&
			downPaymentDocuments.length > 0 &&
			isNullOrUndefined(downPaymentDocumentId)
		) {
			downPaymentDocuments.forEach((item) => {
				subtotal += item && item.subtotal ? item.subtotal : 0;
				amount += item && item.amount ? item.amount : 0;
				taxes += item && item.taxes ? item.taxes : 0;
			});
			flagAmountInWords = true;
			const totalAmount = this.amount - amount;
			const currencyPlural = this.currency === 'PEN' ? 'SOLES' : 'DOLARES AMERICANOS';
			const currencySingular = this.currency === 'PEN' ? 'SOL' : 'DOLAR AMERICANO';
			amountInWords = numberToWords(totalAmount, currencyPlural, currencySingular);
		}
		return {
			flagAmountInWords,
			amountInWords,
			subtotal,
			amount,
			taxes,
		};
	}

	get formatNumbers() {
		const { taxesAmount, totalTaxesAmount, amountDownPaymentDocuments } = this;
		const details = this.details && this.details.length > 0 ? this.details : [];
		const acumTotalItem = details.reduce((acum, item) => {
			const subsidyAmount = item.subsidyAmount || 0;
			const totalItem = item.quantity * item.price;
			return subsidyAmount ? acum + totalItem : acum;
		}, 0);
		const withoutSubsidyAmount =
			this.subsidyAmount && acumTotalItem ? acumTotalItem + this.subsidyAmount : 0;
		const data = {
			amount: this.amount ? this.amount.toFixed(2) : '0.00',
			subtotal: this.subtotal ? this.subtotal.toFixed(2) : '0.00',
			taxes: this.taxes ? this.taxes.toFixed(2) : '0.00',
			exchangeAmount: this.exchangeAmount ? this.exchangeAmount.toFixed(2) : '0.00',
			exchangeRate: this.exchangeRate ? this.exchangeRate.toFixed(2) : '0.00',
			paymentAmount: this.paymentAmount ? this.paymentAmount.toFixed(2) : '0.00',
			discount: this.discount ? this.discount.toFixed(2) : '0.00',
			amountCash: this.amountCash ? this.amountCash.toFixed(2) : '0.00',
			amountCredit: this.amountCredit ? this.amountCredit.toFixed(2) : '0.00',
			advanceInvoice: '0.00',
			change: this.change ? this.change.toFixed(2) : '0.00',
			subsidyAmount: this.subsidyAmount ? this.subsidyAmount.toFixed(2) : '0.00',
			withoutSubsidyAmount: withoutSubsidyAmount.toFixed(2),
		};
		if (
			amountDownPaymentDocuments &&
			amountDownPaymentDocuments.amount &&
			amountDownPaymentDocuments.amount > 0
		) {
			data.advanceInvoice = amountDownPaymentDocuments.amount.toFixed(2);
			const amount = this.amount - amountDownPaymentDocuments.amount;
			data.advanceTotal = amount.toFixed(2);
			const subtotal = this.subtotal - amountDownPaymentDocuments.subtotal;
			data.advanceSubtotal = subtotal.toFixed(2);
			const taxes = this.taxes - amountDownPaymentDocuments.taxes;
			data.advanceTaxes = taxes.toFixed(2);
		}
		if (taxesAmount) {
			const {
				recorded, inactive, exonerated, icbper,
			} = taxesAmount;
			taxesAmount.recorded = recorded ? Number(recorded).toFixed(2) : '0.00';
			taxesAmount.inactive = inactive ? Number(inactive).toFixed(2) : '0.00';
			taxesAmount.exonerated = exonerated ? Number(exonerated).toFixed(2) : '0.00';
			taxesAmount.icbper = icbper ? Number(icbper).toFixed(2) : '0.00';
			data.taxesAmount = taxesAmount;
		}
		if (totalTaxesAmount) {
			const {
				ice,
				iva,
				tip,
				total,
				irbpnr,
				discount,
				subtotal,
				subtotalIva,
				subtotalExtIva,
				subtotalNoObjIva,
				subtotalWithoutTax,
			} = totalTaxesAmount;
			totalTaxesAmount.ice = ice ? Number(ice).toFixed(2) : '0.00';
			totalTaxesAmount.iva = iva ? Number(iva).toFixed(2) : '0.00';
			totalTaxesAmount.tip = tip ? Number(tip).toFixed(2) : '0.00';
			totalTaxesAmount.total = total ? Number(total).toFixed(2) : '0.00';
			totalTaxesAmount.irbpnr = irbpnr ? Number(irbpnr).toFixed(2) : '0.00';
			totalTaxesAmount.discount = discount ? Number(discount).toFixed(2) : '0.00';
			totalTaxesAmount.subtotal = subtotal ? Number(subtotal).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalIva = subtotalIva ? Number(subtotalIva).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalExtIva = subtotalExtIva ? Number(subtotalExtIva).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalNoObjIva = subtotalNoObjIva
				? Number(subtotalNoObjIva).toFixed(2)
				: '0.00';
			totalTaxesAmount.subtotalWithoutTax = subtotalWithoutTax
				? Number(subtotalWithoutTax).toFixed(2)
				: '0.00';

			data.totalTaxesAmount = totalTaxesAmount;
		}
		return data;
	}

	get localDate() {
		return {
			date: helper.localDate(this.createdAt),
			dateToWord: helper.localDateToWords(this.createdAt),
		};
	}

	get amountInWords() {
		const currencyPlural = this.currency === 'PEN' ? 'SOLES' : 'DOLARES AMERICANOS';
		const currencySingular = this.currency === 'PEN' ? 'SOL' : 'DOLAR AMERICANO';
		return numberToWords(this.amount, currencyPlural, currencySingular);
	}

	get statusOrderName() {
		let name;
		switch (this.statusOrder) {
		case 1:
			name = 'NO PAY YET';
			break;
		case 2:
			name = 'PENDING';
			break;
		case 3:
			name = 'PAID';
			break;
		default:
			break;
		}
		return name;
	}

	get paymentStateName() {
		let name;
		switch (this.paymentState) {
		case 1:
			name = 'Pendiente';
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

	get paymentStateColor() {
		let name;
		switch (this.paymentState) {
		case 1:
			name = 'error';
			break;
		case 2:
			name = 'warning';
			break;
		case 3:
			name = 'success';
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

	get typePaymentNames() {
		let typePaymentNames = '';
		let size = 0;
		if (this.transactions && this.transactions.length > 0) {
			size = this.transactions.length;
			this.transactions.forEach((item, i) => {
				if (item.typePayment) {
					if (i < size - 1) {
						typePaymentNames += `${item.typePayment.summaryCode}, `;
					} else {
						typePaymentNames += item.typePayment.summaryCode;
					}
				}
			});
		}
		if (this.transactionsBank && this.transactionsBank.length > 0) {
			size = this.transactionsBank.length;
			if (typePaymentNames) {
				typePaymentNames += ', ';
			}
			this.transactionsBank.forEach((item, i) => {
				if (item.typePayment) {
					if (i < size - 1) {
						typePaymentNames += `${item.typePayment.summaryCode}, `;
					} else {
						typePaymentNames += item.typePayment.summaryCode;
					}
				}
			});
		}
		return typePaymentNames;
	}

	get remissionGuideNames() {
		let names = [];
		if (this.remissionGuides && this.remissionGuides.length > 0) {
			names = this.remissionGuides.map(item => item.documentNumber || item.number);
		}
		return names;
	}

	get totalQuantitySold() {
		const total = this.details ? this.details.reduce((acum, item) => acum + item.quantity, 0) : 0;
		return total;
	}

	get originPlatformName() {
		let name = '';
		if (this.originPlatform === OriginPlatform.desktop) {
			name = 'Desktop';
		} else if (this.originPlatform === OriginPlatform.web) {
			name = 'Web';
		} else if (this.originPlatform === OriginPlatform.movil) {
			name = 'Movil';
		}
		return name;
	}

	get datesFormatted() {
		const dateFormat = 'DD/MM/YYYY';
		const dateFormatHour = 'DD-MM-YYYY HH:mm:ss';
		const cre = this.createdAt;
		const exp = this.expiratedAt;
		const del = this.deliveredAt;
		const dip = this.dateDispatch;
		const clos = this.closedAt;
		const dcan = this.dateCancel;
		return {
			createdAtDate: cre && helper.localDate(cre, dateFormat),
			createdAtDateHour: cre && helper.localDate(cre, dateFormatHour),
			expiratedAtDate: exp && helper.localDate(exp, dateFormat),
			expiratedAtDateHour: exp && helper.localDate(exp, dateFormatHour),
			deliveredAtDate: del && helper.localDate(del, dateFormat),
			deliveredAtDateHour: del && helper.localDate(del, dateFormatHour),
			dateDispatchDate: dip && helper.localDate(dip, dateFormat),
			dateDispatchDateHour: dip && helper.localDate(dip, dateFormatHour),
			closedAtDate: clos && helper.localDate(clos, dateFormat),
			closedAtDateHour: clos && helper.localDate(clos, dateFormatHour),
			dateCancelDate: dcan && helper.localDate(dcan, dateFormat),
			dateCancelDateHour: dcan && helper.localDate(dcan, dateFormatHour),
		};
	}

	get currencyName() {
		return this.currency === 'PEN' ? 'SOLES' : 'DOLARES AMERICANOS';
	}

	static get namedFilters() {
		return {
			basicColumns: builder => builder.select(this.basicColumns()),
			simpleColumns: builder => builder.select(this.simpleColumns()),
			selectColumns: builder => builder.select(this.defaultColumns()),
			detailReportColumns: builder =>
				builder.select(['id', 'serie', 'number', 'document_number', 'currency']),
		};
	}

	static basicColumns(otherColumns = []) {
		let columns = ['id', 'cash_id'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'sal_documents_id',
			'ballot_summary_id',
			'summary_unsubscribe_id',
			'order_id',
			'amount',
			'amount_cash',
			'amount_credit',
			'credit_card_name',
			'reference_external',
			'due_amount',
			'subtotal',
			'taxes',
			'currency',
			'commentary',
			'discount',
			'tip',
			'exchange_rate',
			'exchange_amount',
			'number',
			'serie',
			'com_employee_id',
			'com_employee_registered_id',
			'user_id',
			'customer_id',
			'created_at',
			'sal_states_id',
			'sal_type_document_id',
			'payment_method_id',
			'entity_state_id',
			'ticket_number',
			'expirated_at',
			'change',
			'table_id',
			'status_order',
			'flag_dispatch',
			'sunat_error',
			'terminal_id',
			'document_number',
			'work_to_do',
			'considerations',
			'status_tax',
			'cancel_user_id',
			'cancel_user_name',
			'payment_state',
			'type_catalog_sunat_id',
			'qr_url',
			'url_password',
			'taxes_amount',
			'external_data',
			'warehouse_id',
			'com_subsidiary_id',
			'cash_id',
			'flag_use',
			'flag_mobile',
			'down_payment_document_id',
			'flag_advance',
			'status_tax_sri',
			'related_documents',
			'url_images',
			'authorization_number',
			'authorization_date',
			'environment',
			'emission',
			'password',
			'total_taxes_amount',
			'warehouse_name',
			'type_payment_codes',
			'flag_transfer',
			'flag_type_return',
			'subsidiary_ruc',
			'subsidiary_name',
			'subsidiary_rz_social',
			'subsidiary_address',
			'warehouse_code_taxes',
			'com_company_id',
			'day_import_term',
			'balance',
			'type_billing',
			'date_online',
			'hash_online',
			'date_emission',
			'flag_offline',
			'flag_base_price',
			'origin_platform',
			'send_kardex_status',
			'send_kardex_message',
			'withholding_tax_id',
			'subsidy_amount',
			'accounting_account',
			'date_tax_send',
			'creation_generated_at',
			'flag_old_sale',
			'sub_type_documents',
			'updated_at',
			'total_points',
			'data_client',
			'flag_sync_fb',
			'accounting_seat',
			'discount_global',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static simpleColumns(otherColumns = []) {
		let columns = [
			'id',
			'order_id',
			'amount',
			'due_amount',
			'subtotal',
			'taxes',
			'currency',
			'commentary',
			'discount',
			'tip',
			'number',
			'serie',
			'customer_id',
			'sal_type_document_id',
			'payment_method_id',
			'flag_dispatch',
			'document_number',
			'taxes_amount',
			'warehouse_id',
			'com_subsidiary_id',
			'status_tax_sri',
			'total_taxes_amount',
			'warehouse_name',
			'subsidiary_name',
			'com_company_id',
			'balance',
			'subsidy_amount',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static defaultEager() {
		return 'typeCatalogSunat(selectColumns), customer(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), table(selectColumns), subsidiary(reportColumns), terminal(selectColumns), transactions(basicColumns).[typePayment(selectColumns), paymentMethod(selectColumns)], transactionsBank(basicColumns).typePayment(selectColumns), order(selectColumns).[details(selectColumns)], user(selectColumnsVendor)';
	}

	static calculateSingleItem({ quantity, price, discount }) {
		/* eslint-disable no-mixed-operators */
		return quantity * price - discount;
	}

	static sumItems(items) {
		return items.reduce((acum, prev) => acum + this.calculateSingleItem(prev), 0);
	}

	static roundTo(number) {
		return Math.round(number * 100) / 100;
	}

	static getById(id, companyId, filter = {}, columns = []) {
		const eagerFilter =
			'[withholdingTax(selectColumns).details(selectColumns), cash(selectColumns), remissionGuides(selectColumns), typeCatalogSunat(selectColumns), customer(selectColumns).msTypePerson(selectColumns), employee(selectColumns), details(selectColumns, filterDate), salSeries(selectColumns).details(selectColumns), caDocument(selectColumns).[details(selectColumns)], typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), company(selectColumns).country(selectColumns), terminal(selectColumns), subsidiary(selectColumns), documents(selectColumns).[details(selectColumns), typeDocument(documentTypeData), state(selectColumns)], transactions(selectColumns).[typePayment(selectColumns), paymentMethod(selectColumns), amortization(selectColumns)], transactionsBank(selectColumns).[typePayment(selectColumns), amortization(selectColumns)], downPaymentDocuments(selectColumns), documentRelated(selectColumns).[details(selectColumns), typeDocument(documentTypeData)], order(selectColumns).[details(selectColumns)]]';
		return this.query()
			.select(this.defaultColumns(columns))
			.eager(eagerFilter, {
				filterDate: (builder) => {
					builder
						.skipUndefined()
						.whereRaw('DATE(created_at) >= ?', filter.dateStart)
						.skipUndefined()
						.where('sal_remission_guide_id', filter.salRemissionGuideId)
						.skipUndefined()
						.whereRaw('DATE(created_at) <= ?', filter.dateEnd);
				},
			})
			.where('id', id)
			.skipUndefined()
			.where('com_company_id', companyId)
			.first();
	}

	static getBySerieNumberCustomerId(companyId, {
		serie, number, customerId, typeDocumentId,
	}) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_company_id', companyId)
			.where('serie', serie)
			.where('number', number)
			.where('customer_id', customerId)
			.where('sal_type_document_id', typeDocumentId)
			.first();
	}

	static getQuantityOfElectrinicDocuments(companyId, startDate, endDate) {
		const query = this.query()
			.where('com_company_id', companyId)
			.where('status_tax', 3);

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

	static getByIdTypeDocument(id, companyId) {
		return this.query()
			.eager('[details(selectColumns), typeDocument(documentTypeData), subsidiary(selectColumns)]')
			.select(this.defaultColumns())
			.where('id', id)
			.where('com_company_id', companyId)
			.first();
	}

	static getByIdSimple(id, companyId, columns = []) {
		const query = this.query()
			.select(this.basicColumns(columns))
			.where('id', id)
			.where('com_company_id', companyId)
			.first();
		if (columns && columns.length > 0) {
			query.eager('[documents(basicColumns), discountCoupons(selectColumns)]');
		}
		return query;
	}

	static getListAmortization(companyId, filter = {}, customerId, typePaymentMethodId, salesStates) {
		const eagerFilter =
			'[customer(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns)]';
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerFilter)
			.where('com_company_id', companyId)
			.where('customer_id', customerId)
			.where(raw('due_amount < amount'))
			.where('payment_method_id', typePaymentMethodId)
			.where('sal_states_id', '<>', salesStates)
			.skipUndefined()
			.where('currency', filter.currency)
			.orderBy('creation_date_number');

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getListAmortizationByCaDocument(
		companyId,
		filter = {},
		customerId,
		typePaymentMethodId,
		salesStates,
	) {
		const customerTable = 'com_customers';
		const eagerFilter =
			'[customer(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns), caDocument(selectColumns).[details(selectColumns)]]';
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerFilter)
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('customer_id', customerId)
			.where(raw('due_amount < amount'))
			.where('payment_method_id', typePaymentMethodId)
			.where('sal_states_id', '<>', salesStates)
			.skipUndefined()
			.where('currency', filter.currency)
			.skipUndefined()
			.where(`${this.tableName}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where('sal_type_document_id', filter.salTypeDocumentId)
			.orderBy('creation_date_number');

		if (filter.search) {
			query
				.innerJoin(`${customerTable}`, `${customerTable}.id`, `${this.tableName}.customer_id`)
				.whereRaw(
					`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
					[filter.search],
				)
				.orWhereRaw(
					`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
						this.tableName
					}.document_number)
						AGAINST(?)`,
					[filter.search],
				);
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

	static getListRemissionGuide(companyId, filter, typeDocumentId, statesId) {
		const saleDetailTable = 'sal_sale_documents_detail';
		const customerTable = 'com_customers';
		const eagerFilter =
			'[customer(selectColumns), employee(selectColumns), details(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns)]';
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerFilter)
			.where('com_company_id', companyId)
			.where(`${this.tableName}.flag_dispatch`, 1)
			.skipUndefined()
			.where('sal_type_document_id', typeDocumentId)
			.skipUndefined()
			.where('sal_states_id', statesId)
			.whereNot('sal_type_document_id', 4);

		if (filter.salDocumentsId) {
			query.where('sal_documents_id', filter.salDocumentsId);
		}

		if (filter.warehouseId) {
			query
				.join(
					`${saleDetailTable}`,
					`${saleDetailTable}.sal_sale_documents_id`,
					`${this.tableName}.id`,
				)
				.where(`${saleDetailTable}.war_warehouses_id`, filter.warehouseId);
		}

		if (filter.search) {
			query
				.innerJoin(`${customerTable}`, `${customerTable}.id`, `${this.tableName}.customer_id`)
				.whereRaw(
					`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
					[filter.search],
				)
				.orWhereRaw(
					`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
						this.tableName
					}.document_number)
					 AGAINST(?)`,
					[filter.search],
				);
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

	static validEagerAdd(filter, eagers, validName, eagerAdd) {
		if (filter.relationAdd.indexOf(validName)) {
			eagers.push(eagerAdd);
		}
		return eagers;
	}

	static validEagers(filter, eagerDefault = '') {
		let eagers = [];
		if (filter.relationAdd && filter.relationAdd.length > 0) {
			eagers = this.validEagerAdd(filter, eagers, 'company', 'company(selectColumns)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'typeCatalogSunat',
				'typeCatalogSunat(selectColumns)',
			);
			eagers = this.validEagerAdd(filter, eagers, 'employee', 'employee(selectColumnsVendor)');
			eagers = this.validEagerAdd(filter, eagers, 'customer', 'customer(selectColumnsVendor)');
			eagers = this.validEagerAdd(filter, eagers, 'details', 'details(selectColumns)');
			eagers = this.validEagerAdd(filter, eagers, 'typeDocument', 'typeDocument(documentTypeData)');
			eagers = this.validEagerAdd(filter, eagers, 'state', 'payment(selectColumns)');
			eagers = this.validEagerAdd(filter, eagers, 'table', 'table(selectColumns)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'transactions',
				'transactions(basicColumns).[typePayment(selectColumns), paymentMethod(selectColumns)]',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'transactionsBank',
				'transactionsBank(basicColumns).typePayment(selectColumns)',
			);
			eagers = this.validEagerAdd(filter, eagers, 'subsidiary', 'subsidiary(reportColumns)');
			eagers = this.validEagerAdd(filter, eagers, 'terminal', 'terminal(basicColumns)');
			eagers = this.validEagerAdd(filter, eagers, 'order', 'order(selectColumns)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'orderDetails',
				'order(selectColumns).[details(selectColumns)]',
			);
			eagers = this.validEagerAdd(filter, eagers, 'user', 'user(selectColumnsVendor)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'documentRelated',
				'documentRelated(selectColumns).typeDocument(documentTypeData)',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'caDocument',
				'caDocument(selectColumns).[details(selectColumns)]',
			);
		} else {
			if (eagerDefault !== '') {
				eagers.push(eagerDefault);
			}
			if (
				Array.isArray(filter.typeDocumentIds) &&
				filter.typeDocumentIds.length === 1 &&
				Number(filter.typeDocumentIds[0]) === 4
			) {
				eagers.push('documents(selectColumns)');
			} else if (filter.flagDetailPayments) {
				eagers.push('caDocument(selectColumns).[details(selectColumns)]');
			} else {
				eagers.push('company(selectColumns).country(selectColumns), documentRelated(selectColumns).typeDocument(documentTypeData)');
			}
		}
		return `[${eagers.toString()}]`;
	}

	// Any filter changes applied to "getList" method should be also affect
	// "getTotalAmount & SaleDocumentsDetail.getList" filters.
	static getList(companyId, filter = {}, typeDocumentId, typePaymentId, statesId, aclFilters = {}) {
		const newFilter = filter;
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const eagers = this.validEagers(filter, this.defaultEager());
		newFilter.sortField =
			filter.sortField === 'created_at' ? 'creation_date_number' : filter.sortField;
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagers)
			.where(`${this.tableName}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.sal_type_document_id`, typeDocumentId)
			.skipUndefined()
			.where(`${this.tableName}.sal_states_id`, statesId)
			.skipUndefined()
			.where(`${this.tableName}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${this.tableName}.user_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${this.tableName}.summary_unsubscribe_id`, filter.summaryUnsubscribeId)
			.skipUndefined()
			.where(`${this.tableName}.sal_states_id`, '!=', filter.flagNotCancel);

		if (filter.entityStateId) {
			query.where(`${this.tableName}.entity_state_id`, filter.entityStateId);
		}
		if (aclFilters && aclFilters.sales) {
			query.aclFilter(aclFilters.sales, this.tableName);
		}
		if (filter.orderCreatedAtNumber) {
			query.orderBy(raw(`${this.tableName}.creation_date_number desc, number`), 'desc');
		} else {
			query.orderBy(`${this.tableName}.creation_date_number`, 'desc');
		}
		if (filter.flagNotNotes) {
			query.whereNotIn(`${this.tableName}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${this.tableName}.sal_documents_id`, filter.salDocumentsId);
		}
		if (filter.flagSummaryBallot) {
			if (Number(filter.flagSummaryBallot) === 1) {
				query
					.whereNull(`${this.tableName}.ballot_summary_id`)
					.whereNull(`${this.tableName}.summary_unsubscribe_id`)
					.leftJoin(`${this.tableName} as bndc`, `${this.tableName}.sal_documents_id`, 'bndc.id')
					.leftJoin(raw(
						'com_ms_type_documents as tdndc on tdndc.id = bndc.sal_type_document_id and tdndc.code = ?',
						'BOL',
					));
			} else {
				query.whereNotNull(`${this.tableName}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${this.tableName}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${this.tableName}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
		}

		if (filter.warehouseIds) {
			query.whereIn(`${this.tableName}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.employeeIds && filter.employeeIds.length > 0) {
			query.whereIn(`${this.tableName}.com_employee_id`, filter.employeeIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${this.tableName}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${this.tableName}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${this.tableName}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${this.tableName}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${this.tableName}.id`,
				)
				.groupBy(`${this.tableName}.id`);

			if (typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${this.tableName}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(raw(
						`${customerTable} on ${customerTable}.id = ${
							this.tableName
						}.customer_id and ${customerTable}.com_companies_id = ?`,
						companyId,
					))
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni, ${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
									this.tableName
								}.document_number)
                             AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
						this.tableName
					}.document_number)
                         AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			if (filter.flagNotDocumentRelated) {
				query
					.leftJoin(`${this.tableName} as b`, `${this.tableName}.sal_documents_id`, 'b.id')
					.where((builder) => {
						builder
							.where((builder2) => {
								builder2
									.whereRaw(
										`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
										filter.startDate,
									)
									.whereRaw(
										`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
										filter.endDate,
									)
									.whereRaw(`${this.tableName}.sal_documents_id IS NULL`);
							})
							.orWhere((builder2) => {
								builder2
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) >= ?',
										filter.startDate,
									)
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) <= ?',
										filter.endDate,
									);
							});
					});
			} else {
				query.whereRaw(
					`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
					filter.startDate,
				);
				query.whereRaw(
					`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
					filter.endDate,
				);
			}
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${this.tableName}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
			}
		}
		if (filter.statusTaxSri) {
			if (!Array.isArray(filter.statusTaxSri)) {
				query.where(`${this.tableName}.status_tax_sri`, filter.statusTaxSri);
			} else if (Array.isArray(filter.statusTaxSri) && filter.statusTaxSri.length > 0) {
				query.whereIn(`${this.tableName}.status_tax_sri`, filter.statusTaxSri);
			}
		}
		if (filter.currencies && filter.currencies.length > 0) {
			query.whereIn(`${this.tableName}.currency`, filter.currencies);
		} else if (filter.currency) {
			query.where(`${this.tableName}.currency`, filter.currency);
		}
		if (filter.referenceExternal) {
			query.where(`${this.tableName}.reference_external`, filter.referenceExternal);
		}
		query = this.includePaginationAndSort(query, newFilter);
		return query;
	}

	static getTotalAmount(
		companyId,
		filter,
		typeDocumentId,
		typePaymentId,
		statesId,
		aclFilters = {},
	) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const transactionBankTable = 'com_transaction_bank';
		const query = this.query()
			.select(raw(`${this.tableName}.balance, ${this.tableName}.id, ${this.tableName}.amount`))
			.where(`${this.tableName}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.sal_type_document_id`, typeDocumentId)
			.skipUndefined()
			.whereNot(`${this.tableName}.sal_type_document_id`, filter.salTypeDocumentId)
			.skipUndefined()
			.where(`${this.tableName}.sal_states_id`, statesId)
			.skipUndefined()
			.whereNot(`${this.tableName}.sal_states_id`, filter.salStateId)
			.skipUndefined()
			.where(`${this.tableName}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${this.tableName}.user_id`, filter.employeeId)
			.skipUndefined()
			.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${this.tableName}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.sal_states_id`, '!=', filter.flagNotCancel)
			.as('main');

		if (aclFilters && aclFilters.sales) {
			query.aclFilter(aclFilters.sales, this.tableName);
		}
		if (filter.flagNotNotes) {
			query.whereNotIn(`${this.tableName}.sal_type_document_id`, filter.flagNotNotes);
		}

		if (filter.salDocumentsId) {
			query.where(`${this.tableName}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.customerId) {
			query.where(`${this.tableName}.customer_id`, filter.customerId);
		}

		if (filter.cashIds) {
			query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
		}

		if (filter.stateIds) {
			query.whereIn(`${this.tableName}.sal_states_id`, filter.stateIds);
		}

		if (filter.notSalStateIds) {
			query.whereNotIn(`${this.tableName}.sal_states_id`, filter.notSalStateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${this.tableName}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.employeeIds && filter.employeeIds.length > 0) {
			query.whereIn(`${this.tableName}.com_employee_id`, filter.employeeIds);
		}

		if (filter.typeDocumentNotIds) {
			query.whereNotIn(`${this.tableName}.sal_type_document_id`, filter.typeDocumentNotIds);
		}

		if (typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${this.tableName}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${this.tableName}.id`,
				)
				.groupBy(`${this.tableName}.id`);

			if (typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${this.tableName}.payment_state`, filter.paymentStates);
		}

		if (filter.warehouseIds) {
			query.whereIn(`${this.tableName}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${this.tableName}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
									this.tableName
								}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
						this.tableName
					}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			if (filter.flagNotDocumentRelated) {
				query
					.leftJoin(`${this.tableName} as b`, `${this.tableName}.sal_documents_id`, 'b.id')
					.where((builder) => {
						builder
							.where((builder2) => {
								builder2
									.whereRaw(
										`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
										filter.startDate,
									)
									.whereRaw(
										`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
										filter.endDate,
									)
									.whereRaw(`${this.tableName}.sal_documents_id IS NULL`);
							})
							.orWhere((builder2) => {
								builder2
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) >= ?',
										filter.startDate,
									)
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) <= ?',
										filter.endDate,
									);
							});
					});
			} else {
				query.whereRaw(
					`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
					filter.startDate,
				);
				query.whereRaw(
					`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
					filter.endDate,
				);
			}
		}

		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${this.tableName}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
			}
		}

		if (filter.currencies && filter.currencies.length > 0) {
			query.whereIn(`${this.tableName}.currency`, filter.currencies);
		} else if (filter.currency) {
			query.where(`${this.tableName}.currency`, filter.currency);
		}

		const subQuery = this.query()
			.select(raw(
				'SUM(main.balance) AS totalSales, SUM(main.balance * ?) AS totalCommission, SUM(main.amount) AS amount',
				[filter.commission ? filter.commission / 100 : 0],
			))
			.from(query)
			.as('main')
			.join(`${this.tableName}`, 'main.id', `${this.tableName}.id`);
		return subQuery;
	}

	static calculateIgv(totalDetails, taxIgv, code) {
		if (typeof taxIgv === 'undefined') {
			throw Error('IGV CONFIG NOT DEFINED');
		}
		const result = {
			subtotal: 0,
			amount: 0,
			taxes: 0,
		};

		if (taxIgv) {
			result.subtotal = totalDetails;
			result.amount = this.roundTo(result.subtotal * 1.18);
			result.taxes = this.roundTo(result.amount - result.subtotal);
		} else {
			result.subtotal = this.roundTo(totalDetails / 1.18);
			result.amount = this.roundTo(totalDetails);
			result.taxes = this.roundTo(result.amount - result.subtotal);
		}

		if (code === 'COT' || code === 'NTV') {
			result.taxes = 0;
		}

		return result;
	}

	static processSale(sale, token, typeDocumentCode, flagDispatch = false) {
		const saleData = {};
		saleData.comCompanyId = token.cms_companies_id;
		saleData.userId = token.id;
		saleData.comEmployeeId = token.id;
		saleData.comEmployeeRegisteredId = token.id;
		saleData.comSubsidiaryId = sale.comSubsidiaryId || token.com_subsidiaries_id;
		saleData.subsidiaryRuc = sale.subsidiaryRuc || token.employee.subsidiary.ruc;
		saleData.subsidiaryName = sale.subsidiaryName || token.employee.subsidiary.sucursalName;
		saleData.subsidiaryRzSocial = sale.subsidiaryRzSocial || token.employee.subsidiary.rzSocial;
		saleData.subsidiaryAddress = sale.subsidiaryAddress || token.employee.subsidiary.address;
		saleData.creationDateNumber = sale.createdAt ? Date.now(sale.createdAt) : Date.now();
		saleData.details = sale.details.map((detail, index) => {
			const newDetail = Object.assign({}, detail);
			newDetail.orderNumber = index + 1;
			if (newDetail) {
				newDetail.flagDispatch = detail.flagDispatch ? newDetail.flagDispatch : !flagDispatch;
			}
			delete newDetail.productType;
			delete newDetail.series;
			delete newDetail.flagControlSerie;
			return newDetail;
		});
		if (sale.exchangeRate) {
			saleData.exchangeAmount =
				sale.currency === 'USD' ? sale.amount * sale.exchangeRate : sale.amount / sale.exchangeRate;
		}
		return saleData;
	}

	static updateBalanceBank(data = [], id, amount) {
		const newData = data.map((i) => {
			const newItem = i;
			const newBalance = newItem.newBalance || 0;
			if (i.id === id) {
				newItem.balance += amount;
				newItem.newBalance = newBalance + amount;
			} else {
				newItem.newBalance = 0;
			}
			return newItem;
		});
		return newData;
	}

	static generateHashOnline({
		warehouseId,
		terminalId,
		userId,
		comCompanyId,
		customerId,
		salTypeDocumentId,
		comSubsidiaryId,
		subsidiaryRuc,
		serieId,
		dateOnline,
	}) {
		return `${comCompanyId}-${comSubsidiaryId}-${subsidiaryRuc}-${warehouseId}-${terminalId}-${userId}-${customerId}-${salTypeDocumentId}-${serieId}-${dateOnline}`;
	}

	static async create(
		data,
		token,
		typeDocumentCode,
		ComModule,
		dispatch,
		subsidiaryCompany,
		getValidLoyalti = false,
	) {
		try {
			const { employeeId, terminalId } = data;
			const newSale = Object.assign(
				data,
				this.processSale(data, token, typeDocumentCode, dispatch),
			);
			const { comCountryId } = token.employee.company;
			delete newSale.employeeId;
			const cashId = data.cashId || token.employee.cashId;
			let salStatesId;
			const saleAmountCustomer = {
				currency: newSale.currency,
				subsidiaryId: newSale.comSubsidiaryId,
				saleAmount: 0,
				saleQuantity: 0,
				debtsSales: 0,
			};
			const flagCreditDispatch = token.flagCreditDispatch || true;
			if (!flagCreditDispatch) {
				salStatesId = saleStates.toDeliver;
			} else {
				salStatesId =
					dispatch &&
					typeDocumentCode !== 'NTC' &&
					typeDocumentCode !== 'NTD' &&
					typeDocumentCode !== 'NDD'
						? saleStates.toDeliver
						: saleStates.finalized;
			}
			salStatesId = typeDocumentCode === 'COT' ? saleStates.initiated : salStatesId;

			newSale.salStatesId = salStatesId;
			newSale.dueAmount = newSale.amount;
			newSale.balance = typeDocumentCode === 'NTC' ? 0 : newSale.amount;
			if (newSale.paymentMethodId) {
				if (newSale.paymentMethodId === PaymentMethodCode.cash) {
					newSale.paymentState = PaymentState.payOut;
					if (typeDocumentCode !== 'COT') {
						saleAmountCustomer.saleAmount = newSale.amount;
						saleAmountCustomer.saleQuantity = 1;
					}
				} else {
					newSale.paymentState = PaymentState.pending;
					saleAmountCustomer.debtsSales = newSale.amount;
					saleAmountCustomer.subsidiaryId = newSale.comSubsidiaryId;
				}
			}

			let paymentExpirationDate;
			let checkingAccount;
			if (Array.isArray(newSale.detailsPayments)) {
				const totalPayments = newSale.detailsPayments.length;
				if (totalPayments > 0) {
					paymentExpirationDate = newSale.detailsPayments[totalPayments - 1].expirationDate;
					newSale.dueAmount = 0;
					checkingAccount = {
						companyId: token.cms_companies_id,
						employeeId: token.id,
						userId: token.id,
						amount: newSale.amount,
						type: 1,
						status: 1,
						description: '',
						details: [],
						expirationDate: paymentExpirationDate,
						moduleId: ModuleCode.accountsReceivable,
					};
					checkingAccount.details = newSale.detailsPayments.map((detail, idx) => {
						const detailPayment = Object.assign({}, detail);
						detailPayment.companyId = token.cms_companies_id;
						detailPayment.typePaymentId = 1;
						detailPayment.status = 1;
						detailPayment.amountPayment = 0;
						detailPayment.number = idx + 1;
						return detailPayment;
					});
					newSale.checkingAccounts = [checkingAccount];
				}
				delete newSale.detailsPayments;
			}

			delete newSale.transactionId;
			const saleResulTx = await transaction(
				SaleDocuments,
				Serie,
				Cash,
				ComBankAccounts,
				ComModule.customer,
				Order,
				Subsidiary,
				SubsidiaryCustomer,
				Transaction,
				async (
					SalesTx,
					SeriesTx,
					CashTx,
					ComBankAccountsTx,
					CustomerTx,
					OrderTx,
					SubsidiaryTx,
					SubsidiaryCustomerTx,
					TransactionTx,
				) => {
					let currentSerie = {};
					if (!newSale.serieId) {
						await SeriesTx.query()
							.patch({ number: raw('number+??', [1]) })
							.where('sal_terminals_id', newSale.terminalId)
							.where('com_subsidiaries_id', newSale.comSubsidiaryId)
							.where('sal_type_documents_id', newSale.salTypeDocumentId)
							.where('company_id', newSale.comCompanyId)
							.skipUndefined()
							.where('notes_type_document_id', newSale.fatherSerieId);

						currentSerie = await SeriesTx.query()
							.where('sal_terminals_id', newSale.terminalId)
							.where('com_subsidiaries_id', newSale.comSubsidiaryId)
							.where('sal_type_documents_id', newSale.salTypeDocumentId)
							.where('company_id', newSale.comCompanyId)
							.skipUndefined()
							.where('notes_type_document_id', newSale.fatherSerieId)
							.first();
					} else {
						if (newSale.number) {
							await SeriesTx.query()
								.patch({ number: newSale.number })
								.where('number', '<', Number(newSale.number))
								.where('id', newSale.serieId)
								.where('company_id', newSale.comCompanyId);
						} else {
							await SeriesTx.query()
								.patch({ number: raw('number+??', [1]) })
								.where('id', newSale.serieId)
								.where('company_id', newSale.comCompanyId);
						}
						currentSerie = await SeriesTx.query()
							.where('company_id', newSale.comCompanyId)
							.findById(newSale.serieId);
						if (newSale.number) {
							currentSerie.number = newSale.number;
						}
					}
					delete newSale.fatherSerieId;
					newSale.serieId = currentSerie.id;
					newSale.serie = currentSerie.serie;
					newSale.number = currentSerie.number;
					newSale.documentNumber = `${currentSerie.serie}-${currentSerie.number}`;
					newSale.typeBilling = currentSerie.typeBilling;
					if (newSale.dateOnline) {
						newSale.hashOnline = SalesTx.generateHashOnline(newSale);
						newSale.hashOnline = newSale.createdAt
							? `${newSale.hashOnline}_OFF${helper.localDate(newSale.createdAt, 'DD-MM-YYYY')}`
							: newSale.hashOnline;
						const hashEureka = await SalesTx.getHashOnline(
							newSale.comCompanyId,
							newSale.hashOnline,
						);
						if (hashEureka) {
							// se debe devolver el error antes de terminar el metodo.
							newSale.reason = hashOnlineSalesDuplicate;
							return Promise.reject(newSale.reason);
						}
					}
					if (Array.isArray(newSale.transactions)) {
						const newBalance = {};
						let bankAccountIds = newSale.transactions.map(item => item.bankAccountId);
						bankAccountIds = bankAccountIds.filter(item => item);
						let balanceB = [];
						if (bankAccountIds.length > 0) {
							balanceB = await ComBankAccountsTx.lastBalanceMultiple(
								token.cms_companies_id,
								bankAccountIds,
							);
						}
						let balance = await TransactionTx.lastBalance(
							token.cms_companies_id,
							cashId,
							newSale.currency,
						);
						const transactionsBank = [];
						const transactionsCash = [];
						const typePaymentCodes = [];
						let flagUpdateBalanceB = false;
						newSale.transactions.forEach((tx) => {
							const isTransactionBank = tx.flagTypeTransaction === TypeTransaction.bank;
							const { typeTransactionBankId } = tx;
							const newTx = Object.assign({}, tx);
							newTx.flagTrigger = !TypePayment.notMoveBalance(newTx.typePaymentCode);
							typePaymentCodes.push(newTx.typePaymentCode);
							delete newTx.typePaymentCode;
							delete newTx.typeTransactionBankId;
							delete newTx.flagTypeTransaction;
							newTx.subsidiaryId = newSale.comSubsidiaryId;
							newTx.employeeId = token.id;
							newTx.stateId = newTx.ntcDocumentId
								? transactionStates.canceled
								: transactionStates.finalized;
							if (newTx.stateId === transactionStates.finalized) {
								if (newBalance[newTx.currency]) {
									newBalance[newTx.currency] += newTx.amount;
								} else {
									newBalance[newTx.currency] = newTx.amount;
								}
							}
							newTx.companyId = token.cms_companies_id;
							if (!tx.typeMovement) {
								newTx.typeMovement = TypeMovement.income;
								if (typeDocumentCode === 'NTC') {
									newTx.typeMovement = TypeMovement.expenses;
								}
							}
							newTx.typeTransaction = TypeTransactionCash.normalTransaction;
							newTx.entityExternalId = newSale.customerId;
							newTx.typeEntityId = TypeEntity.customer;
							newTx.moduleOriginId = ComModule.id;
							newTx.typeAmortization = TypeAmortization.simple;
							newTx.documentNumber = newTx.documentNumber || newSale.documentNumber;
							const { company } = token.employee;
							let countryId;
							if (company.comCountryId) {
								countryId = company.comCountryId;
							}
							newTx.additionalInformation = {
								subsidiaryId: newSale.comSubsidiaryId,
								documentNumber: newSale.documentNumber,
								dueAmount: newSale.dueAmount,
								description: newSale.commentary,
								emissionDate: helper.localDate(newSale.createdAt),
								expiratedAt: newSale.expiratedAt,
								typeDocumentCode,
								countryId,
							};
							newTx.concept = `Transaccion de venta ${typeDocumentCode} ${
								newSale.documentNumber
							} por ${newTx.currency} ${newSale.amount}`;
							newTx.cashId = cashId;
							newTx.terminalId = terminalId;
							newTx.salCashDeskClosingId = token.salCashDeskClosingId;
							if (isTransactionBank) {
								delete newTx.flagTrigger;
								flagUpdateBalanceB = true;
								balanceB = this.updateBalanceBank(balanceB, newTx.bankAccountId, newTx.amount);
								const dataBalance = balanceB.find(i => i.bankAccountId === newTx.bankAccountId);
								const bankAccountBalance = dataBalance ? dataBalance.balance : newTx.amount;
								newTx.typeTransactionBankId = typeTransactionBankId;
								newTx.customerId = newSale.customerId;
								newTx.warehouseId = data.warehouseId || token.war_warehouses_id;
								newTx.documentReference = tx.documentReference;
								newTx.reference = tx.reference;
								newTx.urlImage = tx.urlImage;
								newTx.bankId = tx.bankId;
								newTx.flagReconcilement = 1;
								newTx.balance = bankAccountBalance;
								transactionsBank.push(newTx);
							} else {
								delete newTx.bankAccountId;
								newTx.hashOffline = newSale.hashOffline;
								newTx.warWarehousesId = data.warehouseId || token.war_warehouses_id;
								balance += newTx.amount;
								newTx.balance = balance;
								newTx.paymentMethodId = newSale.paymentMethodId;
								newTx.flagTrigger = !token.salCashDeskClosingId;
								transactionsCash.push(newTx);
							}
						});
						newSale.typePaymentCodes = typePaymentCodes;
						newSale.transactions = transactionsCash;
						newSale.transactionsBank = transactionsBank;
						// Si hay una actulizacion por documento porque el triger se deben eliminar
						if (token.salCashDeskClosingId) {
							await CashTx.updateBalance(token.cms_companies_id, cashId, newBalance);
						}
						if (flagUpdateBalanceB) {
							const promiseTransactionBank = balanceB.map(item =>
								ComBankAccountsTx.updateBalance(token.cms_companies_id, item.id, item.newBalance));
							await Promise.all(promiseTransactionBank);
						}
					}
					if (
						!isNullOrUndefined(checkingAccount) &&
						newSale.paymentState === PaymentState.pending &&
						(typeDocumentCode === 'FAC' || typeDocumentCode === 'BOL' || typeDocumentCode === 'NTV')
					) {
						checkingAccount.additionalInformation = {
							typeDocumentCode,
							comCountryId: comCountryId || token.comCountryId,
							customerId: newSale.customerId,
							subsidiaryId: newSale.comSubsidiaryId,
							warehouseId: newSale.warehouseId,
							documentNumber: newSale.documentNumber,
							currency: newSale.currency,
							emissionDate: helper.localDate(
								newSale.createdAt || new Date(),
								'YYYY-MM-DD HH:mm:ss',
							),
						};
						checkingAccount.description = `Venta a crédito ${typeDocumentCode} ${
							newSale.documentNumber
						} por ${newSale.currency} ${newSale.amount}`;
						newSale.checkingAccounts = [checkingAccount];
					}
					newSale.cashId = cashId;
					if (employeeId) {
						newSale.comEmployeeId = employeeId;
					}
					if (newSale.orderId) {
						await OrderTx.query()
							.patch({
								flagDocument: true,
								flagSale: true,
								documentNumberRelate: `${typeDocumentCode}${newSale.documentNumber}`,
							})
							.where('id', newSale.orderId)
							.where('company_id', newSale.comCompanyId);
					}
					const params = {
						dateDocument: helper.localDate(newSale.createdAt || new Date(), 'DDMMYYYY'),
						typeDocumentCode: token.codeTaxes,
						ruc: newSale.subsidiaryRuc,
						typeEnvironment: token.typeAmbientTax,
						serie: newSale.serie,
						documentNumber: helperEcu.newNumberEcu(newSale.number),
						codeNumber: undefined,
						typeEmission: '1',
					};
					if (params.typeDocumentCode && params.ruc && params.typeEnvironment) {
						newSale.password = helperEcu.generatePasswordEcu(params);
					}
					const saleResponse = await SalesTx.query().insertGraph(newSale);
					if (
						ComModule.customer &&
						typeDocumentCode !== 'COT' &&
						typeDocumentCode !== 'NTC' &&
						typeDocumentCode !== 'NDD'
					) {
						const {
							currency,
							subsidiaryId,
							saleAmount,
							saleQuantity,
							debtsSales,
						} = saleAmountCustomer;
						await SubsidiaryTx.query()
							.patch({
								debtsSales: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, JSON_SET(debts_sales, "$.${currency}", JSON_EXTRACT(debts_sales, "$.${currency}")+${debtsSales}), JSON_SET(debts_sales, "$.${currency}", ${debtsSales}))`),
							})
							.where('id', subsidiaryId)
							.where('company_id', saleResponse.comCompanyId);

						await SubsidiaryCustomerTx.createOrUpdate(
							{
								customerId: saleResponse.customerId,
								saleAmount,
								debtsSales,
								currency,
							},
							subsidiaryId,
							saleResponse.comCompanyId,
						);

						const totalBalance = debtsSales || 0;
						await CustomerTx.query()
							.patch({
								totalSales: raw(`if(JSON_EXTRACT(total_sales, "$.${currency}") > 0, JSON_SET(total_sales, "$.${currency}", JSON_EXTRACT(total_sales, "$.${currency}")+${saleAmount}), JSON_SET(total_sales, "$.${currency}", ${saleAmount}))`),
								salesQuantity: raw('sales_quantity+??', [saleQuantity]),
								debtsSales: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, JSON_SET(debts_sales, "$.${currency}", JSON_EXTRACT(debts_sales, "$.${currency}")+${debtsSales}), JSON_SET(debts_sales, "$.${currency}", ${debtsSales}))`),
								flagDebts: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, true, false)`),
								creditLimitationBalance: raw('credit_limitation_balance+??', [totalBalance]),
							})
							.where('id', saleResponse.customerId)
							.where('com_companies_id', saleResponse.comCompanyId);
					}
					if (
						newSale &&
						newSale.entityStateId === saleEntityStates.confirmed &&
						getValidLoyalti &&
						subsidiaryCompany
					) {
						const loyalti = subsidiaryCompany.settings.configLoyalti;
						const equivalent = saleResponse.amount / loyalti.equivalentPoint.suns;
						let point = Math.round(equivalent * loyalti.equivalentPoint.point);
						point -= newSale.totalPoints;
						await CustomerTx.query()
							.patch({ point: raw(`if(point >= 0, point, 0) + ${point}`) })
							.where('id', saleResponse.customerId)
							.where('com_companies_id', saleResponse.comCompanyId);
					}
					return saleResponse;
				},
			);
			return Promise.resolve(saleResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}
	/*
	async $afterInsert(queryContext) {
		try {
			const {
				amount, id, documentNumber, serie, number,
			} = this;

			await Transaction.editBySale(
				this.comCompanyId,
				id,
				{
					documentNumber,
					typeTransaction: TypeTransactionCash.normalTransaction,
					entityExternalId: this.customerId,
					salSaleDocumentsId: id,
				},
				queryContext.transaction,
			);

			await TransactionBank.editBySale(
				this.comCompanyId,
				id,
				{
					documentNumber,
					typeTransaction: TypeTransactionCash.normalTransaction,
					entityExternalId: this.customerId,
					customerId: this.customerId,
				},
				queryContext.transaction,
			);
			if (isDevOrProd()) {
				const symbol = this.currency === 'PEN' ? 'S/' : '$';

				// We can't afford firebase so I am disabling notifications
				// until we can pay the price.
				const disableNot = false;
				if (disableNot) {
					const message = {
						type: 'sales',
						message: `El Documento #${serie}-${number} ha sido creado por ${symbol} ${
							this.amount
						}.`,
					};
					notifications.create(this.comCompanyId, message, {
						amount,
						documentNumber,
						id,
						number,
						serie,
					});
				}
			}
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}
*/
	static async CreateNewDocument(dataTransform, data, token, typeDocumentCode, item) {
		const newSale = data;
		const newData = dataTransform;
		const dataDetails = newData.details;

		const newDetail = dataDetails.map((detail, index) => {
			const newItem = detail;
			newItem.orderNumber = index + 1;
			delete newItem.id;
			return newItem;
		});
		newData.details = newDetail;

		let dataInsert = {
			amount: newSale.amount,
			balance: newSale.amount,
			commentary: newData.commentary,
			currency: newSale.currency,
			customerId: newSale.customerId,
			discount: newData.discount,
			exchangeAmount: newData.exchangeAmount,
			dateEmission: newSale.dateEmission,
			paymentMethodId: newSale.paymentMethodId,
			subtotal: newSale.subtotal,
			taxes: newSale.taxes,
			details: newSale.details,
			amountCash: newSale.amountCash,
			amountCredit: newSale.amountCredit,
			creditCardName: newSale.creditCardName,
			serie: newSale.serie,
			number: newSale.number,
			serieId: newSale.serieId,
			terminalId: newSale.terminalId,
			salTypeDocumentId: newSale.salTypeDocumentId,
			comCompanyId: newData.comCompanyId,
			userId: newData.userId,
			comEmployeeId: newData.comEmployeeId,
			salStatesId: newData.salStatesId,
			comSubsidiaryId: newData.comSubsidiaryId,
			salDocumentsId: newData.id,
		};

		dataInsert = Object.assign(dataInsert, this.processSale(dataInsert, token, typeDocumentCode));
		const saleMachine = SaleStateMachine.createSale(dataInsert, item, typeDocumentCode);
		await saleMachine.create();
		dataInsert.salStatesId = saleMachine.stateId;
		const saleResulTx = await transaction(this, Serie, async (SalesTx, SeriesTx) => {
			await SeriesTx.query()
				.patch({ number: raw('number+??', [1]) })
				.where('sal_terminals_id', dataInsert.terminalId)
				.where('com_subsidiaries_id', dataInsert.comSubsidiaryId)
				.where('sal_type_documents_id', dataInsert.salTypeDocumentId)
				.where('company_id', dataInsert.comCompanyId);

			const currentSerie = await SeriesTx.query()
				.where('sal_terminals_id', dataInsert.terminalId)
				.where('com_subsidiaries_id', dataInsert.comSubsidiaryId)
				.where('sal_type_documents_id', dataInsert.salTypeDocumentId)
				.where('company_id', dataInsert.comCompanyId)
				.first();

			dataInsert.serieId = currentSerie.id;
			dataInsert.serie = currentSerie.serie;
			dataInsert.number = currentSerie.number;
			dataInsert.documentNumber = `${currentSerie.serie}-${currentSerie.number}`;

			dataInsert.hashOnline = this.generateHashOnline(dataInsert);
			const hashEureka = await SalesTx.getHashOnline(
				dataInsert.comCompanyId,
				dataInsert.hashOnline,
			);
			dataInsert.hashOnline = !hashEureka ? dataInsert.hashOnline : 'DUPLICATE_CHET';
			newSale.creationDateNumber = dataInsert.createdAt
				? Date.now(dataInsert.createdAt)
				: Date.now();

			const saleResponse = await SalesTx.query().insertGraph(dataInsert);
			return saleResponse;
		});
		return saleResulTx;
	}

	static getAmountTotalDay(idFin, filter, companyId) {
		return this.query()
			.sum('amount')
			.where('sal_states_id', idFin)
			.where('com_company_id', companyId)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= DATE(?)`,
				filter.day,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= DATE(?)`,
				filter.day,
			);
	}

	static async getProductsInformation(
		ids = [],
		hapiAxios,
		url = '/v2/products/by-ids',
		authorization,
	) {
		try {
			if (authorization) {
				// if (ids.find(i => i === 2237503)) {
				const response = await simpleAxios({
					url: `${process.env.PRODUCTS_NEW_URL}/v2/products/by-ids`,
					method: 'POST',
					headers: {
						authorization,
					},
					data: {
						products: ids,
					},
					validateStatus: () => true,
				});
				return response;
				// }
				// return hapiAxios.post(
				// 	`${url}`,
				// 	{
				// 		products: ids,
				// 	},
				// 	{
				// 		headers: {
				// 			authorization,
				// 		},
				// 	},
				// );
			}
			return hapiAxios.post(`${url}`, {
				products: ids,
			});
		} catch (error) {
			// console.log(
			// eslint-disable-next-line max-len
			// 	'getProductsInformationgetProductsInformationgetProductsInformationgetProductsInformation',
			// 	error,
			// );
			return error;
		}
	}

	static getProductsBySql(ids = [], companyId) {
		const knex = SaleDocuments.knex();
		const bdProducts = process.env.DB_NAME_PRODUCTS;
		return Promise.resolve(knex.schema.raw(
			`select war_products.id, war_products.slug, war_products.product_parent_id as productParentId, JSON_PRETTY(war_products.alternate_code) as alternateCode, war_products.auto_barcode as autoBarcode, war_products.name, war_products.code_retention as codeRetention,
				war_products.description, war_products.code, war_products.conversions, war_products.model, war_products.rating, war_products.number_visit as numberVisit, war_products.tags, war_products.flag_ecommerce as flagEcommerce,
				war_products.price_discount as priceDiscount, war_products.e_categories as eCategories, war_products.filters, war_products.sections, war_products.products_related as productsRelated, war_products.price, war_products.price_old as priceOld, war_products.weigth,
				war_products.category_id as categoryId, war_products.sub_category_id as subCategoryId, war_products.features, war_products.flag_type_unit as flagTypeInit, war_products.inline_features as inlineFeatures, war_products.inline_alternate_code as inlineAlternateCode, war_products.url_image as urlImage,
				war_products.banners, war_products.is_public as isPublic, war_products.type, war_products.group_type as groupType, war_products.unit_id as unitId, war_products.flag_control_serie as flagControlSerie, war_products.flag_sales as flagSales, war_products.flag_active as flagActive,
				war_products.external_code as externalCode, war_products.e_commerces as eCommerces, war_products.price_sale_min as priceSaleMin, war_products.code_product_cubso as codeProductCubso, war_products.company_id as companyId, war_products.origin_platform as originPlatform, war_products.additional_information as additionalInformation,
				war_products.created_at as createdAt, war_products.updated_at as updatedAt, war_products.flag_igv as flagIgv, war_products.stock_virtual as stockVirtual, war_products.warranty_frequency as warrantyFrequency, war_products.warranty_quantity as warrantyQuantity, war_products.accounting_account as accountingAccount,
				war_products.score, war_products.flag_loyalti as flagLoyalti, war_products.stock, wwp.stock as warBrandStock, wwp.id as warehouseProductId, wwp.price_cost as priceCost, wwp.price_list as priceList, wwp.location, wwp.warehouse_id as warehouseId,
				wwp.min_stock as minStock, b.name as brandName, b.id as brandId, tp.name as typeName, tp.id as typeId, tp.code as typeCode, u.name as unitName, u.code as unitCode, w.name as warehouseName
				from ${bdProducts}.war_products as war_products
				left join ${bdProducts}.war_warehouses_products as wwp on war_products.id = wwp.product_id
				left join ${bdProducts}.war_brands as b on b.id = wwp.brand_id
				left join ${bdProducts}.war_ms_units as u on u.id = war_products.unit_id
				left join ${bdProducts}.war_warehouses as w on w.id = wwp.warehouse_id
				inner join ${bdProducts}.war_ms_type_products as tp on war_products.type = tp.id
				where war_products.deleted_at is null and war_products.company_id = ? and war_products.id in (${ids})`,
			[companyId],
		));
	}

	static async setProductsToSales(
		sales,
		{ hapiAxios, authorization },
		isArray = true,
		url = '/v2/products/by-ids',
		flagSqlData = false,
	) {
		try {
			const productIds = sales.reduce((acum, sale) => {
				const ids = sale.details.map(d => d.warProductsId);
				return [...ids, ...acum];
			}, []);
			const productIdsUnique = uniqueValues(productIds);
			if (productIdsUnique.length > 0) {
				let products;
				if (flagSqlData) {
					products = await this.getProductsBySql(
						productIdsUnique,
						sales[0].comCompanyId || (sales[0].company && sales[0].company.id),
					);
					products = { data: (products && products[0]) || [] };
				} else {
					products = await this.getProductsInformation(
						productIdsUnique,
						hapiAxios,
						url,
						authorization,
					);
				}
				const salesWithProducts = sales.map((sale) => {
					const newSale = sale;
					newSale.details = newSale.details.map((detail) => {
						const newDetail = detail;
						const product = products.data.find(p => p.id === newDetail.warProductsId);
						if (product) {
							newDetail.product = product;
						}
						return newDetail;
					});
					return newSale;
				});
				return isArray ? salesWithProducts : salesWithProducts[0];
			}
			return [];
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async setProductsToSalesFarce(sales, isArray = true, flagWare = true) {
		try {
			const productIds = sales.reduce((acum, sale) => {
				const ids = sale.details.map(d => d.warProductsId);
				return [...ids, ...acum];
			}, []);
			const productIdsUnique = uniqueValues(productIds);
			if (productIdsUnique.length > 0) {
				const salesWithProducts = sales.map((sale) => {
					const newSale = sale;
					if (flagWare) {
						newSale.warehouse = {
							address: null,
							code: null,
							codeTaxes: newSale.warehouseCodeTaxes,
							companyId: newSale.comCompanyId,
							flagEcommerce: null,
							id: newSale.warehouseId,
							name: newSale.warehouseName,
						};
					}

					newSale.details = newSale.details.map((detail) => {
						const newDetail = detail;
						newDetail.product = {
							id: newDetail.warProductsId,
							alternateCode: newDetail.alternateCode,
							brandId: newDetail.brandId,
							brandName: newDetail.brandName,
							categoryId: newDetail.categoryId,
							code: newDetail.productCode,
							description: newDetail.description,
							inlineFeatures: newDetail.inlineFeatures,
							name: newDetail.description,
							price: newDetail.price,
							priceCost: newDetail.priceCost,
							stock: newDetail.stockQuantity,
							taxes: newDetail.taxes,
							unitCode: newDetail.unitCode,
							unitId: newDetail.unitId,
							unitName: newDetail.unitName,
							warehouseId: newDetail.warWarehousesId,
							warehouseName: newDetail.warehouseName,
						};
						return newDetail;
					});
					return newSale;
				});
				return isArray ? salesWithProducts : salesWithProducts[0];
			}
			return [];
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getAllTypeDocument(filter, companyId, states, typeDocument) {
		const query = this.query()
			.select(raw('com_ms_type_documents.code, sum(sal_documents.amount) as total, count(sal_documents.id) as quantity'))
			.innerJoin(
				'com_ms_type_documents',
				'sal_documents.sal_type_document_id',
				'com_ms_type_documents.id',
			)
			.skipUndefined()
			.where('sal_documents.com_employee_id', filter.comEmployeeId)
			.where('sal_documents.com_company_id', companyId)
			.where('sal_documents.sal_states_id', states)
			.whereNot('sal_documents.sal_type_document_id', typeDocument)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupBy('sal_type_document_id');

		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${this.tableName}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
			}
		}
		return query;
	}

	static getAllSubsidiaries(filter, companyId, states, typeDocument) {
		const query = this.query()
			.select(raw('sal_documents.com_subsidiary_id, sum(sal_documents.amount) as total, count(sal_documents.id) as quantity'))
			.innerJoin('com_subsidiaries', 'sal_documents.com_subsidiary_id', 'com_subsidiaries.id')
			.where('sal_documents.com_company_id', companyId)
			.where('sal_documents.sal_states_id', states)
			.whereNot('sal_documents.sal_type_document_id', typeDocument)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupBy('sal_documents.com_subsidiary_id');
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${this.tableName}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
			}
		}
		return query;
	}

	static getListCashClosing(
		typeDocumentId,
		companyId,
		status,
		employeeId,
		methodPayment,
		filter = {},
	) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[customer(selectColumns), employee(selectColumns), typeDocument(documentTypeData), details(selectColumns)]')
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('sal_states_id', status)
			.skipUndefined()
			.where('sal_type_document_id', '!=', typeDocumentId)
			.skipUndefined()
			.where('com_employee_id', employeeId)
			.where('sal_cash_desk_closing_id', null)
			.skipUndefined()
			.where('payment_method_id', methodPayment)
			.skipUndefined()
			.where('id', filter.id)
			.skipUndefined()
			.where('currency', filter.currency)
			.skipUndefined()
			.where('com_subsidiary_id', filter.subsidiaryId);

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${this.tableName}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
			}
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static updateSales({ data, id, token }, companyId) {
		const newSale = Object.assign(
			data,
			this.processSale(data, token, undefined, data.flagDispatch),
		);
		return this.query()
			.upsertGraph(newSale, {
				unrelate: false,
				relate: ['details'],
				noDelete: ['details'],
			})
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editMultiple(data, trx) {
		const options = {
			noDelete: true,
			unrelate: false,
		};
		return this.query(trx).upsertGraph(data, options);
	}

	static updateEntityStates({ entityStateId, ids }, companyId) {
		return this.query()
			.patch({ entityStateId })
			.whereIn('id', ids)
			.where(`${this.tableName}.com_company_id`, companyId);
	}

	static updateAccountingAccountInformation(data, id) {
		return this.query()
			.patch({
				accountingAccount: data.accountingAccount,
				accountingSeat: data.accountingSeat,
				entityStateId: data.entityStateId,
			})
			.where('id', id);
	}

	static updateCashDeskClosing(data, ids) {
		const query = this.query()
			.patch(data)
			.whereIn('id', ids);
		return query;
	}

	static editAmount(dataSale, dataDetails, companyId) {
		const totalDetails = this.sumItems(dataDetails);
		const dataEdit = this.calculateIgv(totalDetails, null, dataSale.typeDocumentCode);
		return this.query()
			.patch(dataEdit)
			.where('id', dataSale.idSale)
			.where('com_company_id', companyId);
	}

	static editDueAmount(id, data, companyId, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static async cancel(sale, credentials, saleCommentary) {
		try {
			const {
				flagEmployeeTransaction,
				flagNotGenericNtc,
				flagDeleteTrnBnk,
			} = credentials.employee.company.settings;
			const cashId = flagEmployeeTransaction ? credentials.employee.cashId : sale.cashId;
			const { typeBilling } = sale.salSeries;
			const { id, newDocument, comSubsidiaryId } = sale;
			let flagNtc = sale.typeDocument.settings ? sale.typeDocument.settings.generateNtc : false;
			flagNtc = typeBilling === TypeBilling.electronic;

			const dataTypeDocument = await MsTypeDocument.getById(undefined, 'NTC', {
				flagType: ModuleCode.sales,
				comCountryId: sale.company.comCountryId,
			});
			let newSaleDocument;
			const { detailsPayments, paymentMethodId, transactions } = newDocument || {};
			const { countryCode } = sale.company.country || {};
			if (countryCode === 'ECU' && flagNtc) {
				flagNtc = sale.statusTaxSri !== 1;
			}
			if (countryCode === 'PER' && flagNtc) {
				flagNtc = sale.statusTax !== 1;
			}

			if (flagNtc && !flagNotGenericNtc && sale.fatherSerieId) {
				const newSale = { ...sale };
				let typeCatalogSunatId;
				typeCatalogSunatId = !newSale.typeCatalogSunatId
					? await CatalogSunatDetails.getByCode(TypeNtcSunat.cancellationOperation)
					: undefined;
				typeCatalogSunatId = typeCatalogSunatId
					? typeCatalogSunatId.id
					: newSale.typeCatalogSunatId;

				delete newSale.id;
				delete newSale.customer;
				delete newSale.company;
				delete newSale.employee;
				delete newSale.subsidiary;
				delete newSale.terminal;
				delete newSale.payment;
				delete newSale.state;
				delete newSale.typeDocument;
				delete newSale.documents;
				delete newSale.flagKardex;
				delete newSale.salSeries;
				delete newSale.documentRelated;
				delete newSale.countryId;
				delete newSale.createdAt;
				delete newSale.remissionGuides;
				delete newSale.statusTax;
				delete newSale.cash;
				delete newSale.typeCatalogSunat;
				delete newSale.newDocument;
				delete newSale.detailsPayments;
				delete newSale.transactionsBank;
				delete newSale.transactions;
				const newDetails = newSale.details.map((item) => {
					const newItem = item;
					delete newItem.id;
					delete newItem.salSaleDocumentsId;
					delete newItem.createdAt;
					return newItem;
				});
				newSale.details = newDetails;
				newSale.salDocumentsId = id;

				newSale.typeCatalogSunatId = typeCatalogSunatId;
				newSale.salTypeDocumentId = dataTypeDocument.id;
				newSale.terminalId = sale.terminalId;
				newSale.comSubsidiaryId = sale.comSubsidiaryId;
				newSale.warehouseId = sale.warehouseId;
				newSale.paymentMethodId = paymentMethodId;
				newSale.cashId = cashId;

				// const balance = async trans =>
				// 	Cash.lastBalance(
				// 		credentials.cms_companies_id,
				// 		cashId,
				// 		trans.length > 0 ? trans[0].currency : undefined,
				// 	);

				if (paymentMethodId === PaymentMethodCode.credit) {
					if (Array.isArray(detailsPayments)) {
						newSale.detailsPayments = detailsPayments;
					}
				} else if (Array.isArray(transactions) && transactions.length > 0) {
					// let lastBalance = await balance(transactions);
					newSale.transactions = transactions.map((item) => {
						const newItem = item;
						delete newItem.typePaymentForm;
						// lastBalance += item.amount;
						// newItem.balance = lastBalance;
						newItem.subsidiaryId = comSubsidiaryId;
						return newItem;
					});
				} else {
					let newTransactions = [];
					if (sale.transactions && sale.transactions.length > 0) {
						// const lastBalance = await balance(transactions);
						newTransactions = sale.transactions.reduce((acum, item) => {
							const newAcum = [...acum];
							newAcum.push({
								companyId: credentials.cms_companies_id,
								subsidiaryId: comSubsidiaryId,
								amount: item.amount * -1,
								currency: item.currency,
								paymentAmount: item.paymentAmount * -1,
								paymentDate: new Date(),
								typePaymentId: item.typePaymentId,
								typeMovement: TypeMovement.expenses,
								cashId,
								moduleOriginId: ModuleCode.sales,
								concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
									sale.documentNumber
								} ${item.currency} ${item.amount}`,
								entityExternalId: sale.customerId,
								typeTransaction: TypeTransactionCash.normalTransaction,
								documentNumber: sale.documentNumber,
								employeeId: sale.employee.id,
								warWarehousesId: sale.warehouseId,
								flagTypeTransaction: item.typePayment.flagTypeTransaction,
								// balance: lastBalance,
							});
							return newAcum;
						}, newTransactions);
					}
					if (sale.transactionsBank && sale.transactionsBank.length > 0) {
						// const lastBalance = await balance(transactions);
						newTransactions = sale.transactionsBank.reduce((acum, item) => {
							const newAcum = [...acum];
							newAcum.push({
								bankAccountId: item.bankAccountId,
								companyId: credentials.cms_companies_id,
								subsidiaryId: comSubsidiaryId,
								amount: item.amount * -1,
								currency: item.currency,
								paymentAmount: item.paymentAmount * -1,
								paymentDate: new Date(),
								typePaymentId: item.typePaymentId,
								typeMovement: TypeMovement.expenses,
								moduleOriginId: ModuleCode.sales,
								concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
									sale.documentNumber
								} ${item.currency} ${item.amount}`,
								entityExternalId: sale.customerId,
								typeTransaction: TypeTransactionCash.normalTransaction,
								documentNumber: sale.documentNumber,
								employeeId: sale.employee.id,
								warehouseId: sale.warehouseId,
								flagTypeTransaction: item.typePayment.flagTypeTransaction,
								// balance: lastBalance,
								salDocumentsId: item.salDocumentsId,
							});
							return newAcum;
						}, newTransactions);
					}
					newSale.transactions = newTransactions;
				}

				const newCredentials = { ...credentials };
				delete newCredentials.customer;
				newCredentials.employee.cashId = cashId;
				newSale.dateOnline = `${new Date().getTime()}`;
				delete newSale.order;
				newSaleDocument = await this.create(
					newSale,
					newCredentials,
					dataTypeDocument.code,
					{ id: ModuleCode.sales, customer: credentials.customer },
					false,
				);
			} else {
				const transactionsPromise = this.returnTransactions(
					sale,
					transactions,
					credentials,
					comSubsidiaryId,
					cashId,
					undefined,
					flagDeleteTrnBnk,
				);
				if (transactionsPromise && transactionsPromise.length > 0) {
					await Promise.all(transactionsPromise);
				}
			}

			const cancelUserName = `${credentials.employee.name} ${credentials.employee.lastname}`;
			const relatedDocuments = newSaleDocument ? [`NTC${newSaleDocument.documentNumber}`] : [];
			const result = await this.query()
				.patch({
					salStatesId: saleStates.canceled,
					commentary: saleCommentary,
					dateCancel: new Date(),
					cancelUserId: credentials.employee.id,
					cancelUserName,
					relatedDocuments,
					balance: raw('balance-??', [sale.amount]),
				})
				.where('id', id);

			await DocumentAccountStatus.query()
				.softDelete()
				.where('sale_document_id', sale.id)
				.where('company_id', credentials.cms_companies_id);

			return newSaleDocument || result;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static returnTransactions(
		sale,
		transactions,
		credentials,
		comSubsidiaryId,
		cashId,
		CustomerTx,
		flagDeleteTrnBnk = false,
	) {
		let transactionsPromise = [];
		const customerSales = {};
		const subsidiary = {
			id: sale.comSubsidiaryId,
			debtsSales: {},
		};

		if (sale.paymentMethodId === credit && CustomerTx) {
			customerSales[sale.customerId] = customerSales[sale.customerId] || {
				saleAmount: {},
				creditLimitationBalance: 0,
				saleQuantity: 0,
				debtsSales: {},
			};
			customerSales[sale.customerId].saleQuantity += 1;
			customerSales[sale.customerId].subsidiaryCustomerId =
				customerSales[sale.customerId].subsidiaryCustomerId ||
				(sale.customer.subsidiaryCustomer && sale.customer.subsidiaryCustomer.id);
			customerSales[sale.customerId].saleAmount[sale.currency] =
				sale.amount + (customerSales[sale.customerId].saleAmount[sale.currency] || 0);
			customerSales[sale.customerId].debtsSales[sale.currency] =
				sale.amount -
				sale.dueAmount +
				(customerSales[sale.customerId].debtsSales[sale.currency] || 0);

			subsidiary.debtsSales[sale.currency] =
				sale.amount - sale.dueAmount + (subsidiary.debtsSales[sale.currency] || 0);

			customerSales[sale.customerId].creditLimitationBalance =
				sale.currency !== sale.company.currency ? sale.amount * sale.exchangeRate : sale.amount;
			transactionsPromise.push(CustomerTx.updateDiscountBalanceMultiple(
				customerSales,
				subsidiary,
				credentials.cms_companies_id,
			));
		}

		const newBalance = {};
		const flagFormValid = sale.paymentMethodId !== credit;
		if (transactions && Array.isArray(transactions) && transactions.length > 0) {
			transactions.forEach((item) => {
				if (item.flagTypeTransaction === TypeTransaction.cash) {
					if (flagFormValid) {
						if (newBalance[item.currency]) {
							newBalance[item.currency] += item.amount < 0 ? item.amount : -item.amount;
						} else {
							newBalance[item.currency] = item.amount < 0 ? item.amount : -item.amount;
						}
					}
					transactionsPromise.push(Transaction.create({
						companyId: credentials.cms_companies_id,
						stateId: flagFormValid ? MsTransactionStates.finalized : MsTransactionStates.pending,
						subsidiaryId: comSubsidiaryId,
						salSaleDocumentsId: sale.id,
						additionalInformation: item.additionalInformation,
						amount: item.amount < 0 ? item.amount : -item.amount,
						currency: item.currency,
						paymentAmount: item.amount < 0 ? item.amount : -item.amount,
						paymentDate: new Date(),
						typePaymentId: item.typePaymentId,
						typeMovement: TypeMovement.expenses,
						cashId,
						terminalId: sale.terminalId,
						warWarehousesId: sale.warehouseId,
						salCashDeskClosingId: credentials.salCashDeskClosingId,
						flagTrigger: !credentials.salCashDeskClosingId,
						moduleOriginId: ModuleCode.sales,
						concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
							sale.documentNumber
						} ${item.currency} ${item.amount}`,
						entityExternalId: sale.customerId,
						typeTransaction: TypeTransactionCash.normalTransaction,
						documentNumber: item.documentNumber,
						employeeId: sale.employee.id,
						bankAccountId: item.bankAccountId,
						bankId: item.bankId,
						documentReference: item.documentReference,
						reference: item.reference,
						urlImage: item.urlImage,
					}));
				} else if (item.flagTypeTransaction === TypeTransaction.bank && !flagDeleteTrnBnk) {
					transactionsPromise.push(TransactionBank.create({
						companyId: credentials.cms_companies_id,
						subsidiaryId: comSubsidiaryId,
						stateId:
								sale.paymentMethodId !== credit
									? MsTransactionStates.finalized
									: MsTransactionStates.pending,
						typeTransactionBankId: item.typeTransactionBankId,
						salDocumentsId: sale.id,
						additionalInformation: item.additionalInformation,
						amount: item.amount < 0 ? item.amount : -item.amount,
						currency: item.currency,
						paymentAmount: item.amount < 0 ? item.amount : -item.amount,
						paymentDate: new Date(),
						typePaymentId: item.typePaymentId,
						typeMovement: TypeMovement.expenses,
						cashId: flagFormValid ? cashId : undefined,
						terminalId: sale.terminalId,
						warehouseId: sale.warehouseId,
						salCashDeskClosingId: credentials.salCashDeskClosingId,
						moduleOriginId: ModuleCode.sales,
						concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
							sale.documentNumber
						} ${item.currency} ${item.amount}`,
						entityExternalId: sale.customerId,
						typeTransaction: TypeTransactionCash.normalTransaction,
						documentNumber: item.documentNumber,
						employeeId: sale.employee.id,
						bankAccountId: item.bankAccountId,
						bankId: item.bankId,
						documentReference: item.documentReference,
						reference: item.reference,
						urlImage: item.urlImage,
					}));
				}
			});
			const keysId = Object.keys(newBalance);
			if (keysId && keysId.length > 0 && credentials.salCashDeskClosingId) {
				// eslint-disable-next-line max-len
				transactionsPromise.push(Cash.updateBalance(credentials.cms_companies_id, cashId, newBalance));
			}
		} else {
			if (sale.transactions && sale.transactions.length > 0) {
				transactionsPromise = sale.transactions.reduce((acum, item) => {
					const newAcum = [...acum];
					if ([card, cash, voucher].indexOf(item.typePayment.flagForm) > -1) {
						if (flagFormValid) {
							if (newBalance[item.currency]) {
								newBalance[item.currency] -= item.amount;
							} else {
								newBalance[item.currency] = -item.amount;
							}
						}
						newAcum.push(Transaction.create({
							companyId: credentials.cms_companies_id,
							subsidiaryId: comSubsidiaryId,
							salSaleDocumentsId: sale.id,
							stateId: item.stateId,
							amount: -item.amount,
							currency: item.currency,
							paymentAmount: -item.amount,
							paymentDate: new Date(),
							typePaymentId: item.typePaymentId,
							typeMovement: TypeMovement.expenses,
							cashId,
							terminalId: sale.terminalId,
							warWarehousesId: sale.warehouseId,
							salCashDeskClosingId: credentials.salCashDeskClosingId,
							flagTrigger: !credentials.salCashDeskClosingId,
							moduleOriginId: ModuleCode.sales,
							concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
								sale.documentNumber
							} ${item.currency} ${item.amount}`,
							entityExternalId: sale.customerId,
							typeTransaction: TypeTransactionCash.normalTransaction,
							documentNumber: sale.documentNumber,
							employeeId: sale.employee.id,
							bankAccountId: item.bankAccountId,
							bankId: item.bankId,
						}));
					}
					return newAcum;
				}, transactionsPromise);
			}
			if (sale.transactionsBank && sale.transactionsBank.length > 0 && !flagDeleteTrnBnk) {
				transactionsPromise = sale.transactionsBank.reduce((acum, item) => {
					const newAcum = [...acum];
					newAcum.push(TransactionBank.create({
						companyId: credentials.cms_companies_id,
						subsidiaryId: comSubsidiaryId,
						salDocumentsId: sale.id,
						stateId:
								sale.paymentMethodId !== credit
									? MsTransactionStates.finalized
									: MsTransactionStates.pending,
						typeTransactionBankId: item.typeTransactionBankId,
						amount: -item.amount,
						currency: item.currency,
						paymentAmount: -item.amount,
						paymentDate: new Date(),
						typePaymentId: item.typePaymentId,
						typeMovement: TypeMovement.expenses,
						cashId: flagFormValid ? cashId : undefined,
						terminalId: sale.terminalId,
						warehouseId: sale.warehouseId,
						salCashDeskClosingId: credentials.salCashDeskClosingId,
						moduleOriginId: ModuleCode.sales,
						concept: `Transaccion de anulacion de venta ${sale.typeDocument.code}${
							sale.documentNumber
						} ${item.currency} ${item.amount}`,
						entityExternalId: sale.customerId,
						typeTransaction: TypeTransactionCash.normalTransaction,
						documentNumber: sale.documentNumber,
						employeeId: sale.employee.id,
						bankAccountId: item.bankAccountId,
					}));
					return newAcum;
				}, transactionsPromise);
			}
			const keysId = Object.keys(newBalance);
			if (keysId && keysId.length > 0 && credentials.salCashDeskClosingId) {
				// eslint-disable-next-line max-len
				transactionsPromise.push(Cash.updateBalance(credentials.cms_companies_id, cashId, newBalance));
			}
		}
		if (flagDeleteTrnBnk) {
			transactionsPromise.push(TransactionBank.removeAll(sale.id, credentials.cms_companies_id));
		}
		return transactionsPromise;
	}

	static async canceltypeDocumentNdc(documentNdc, credentials, saleCommentary, sale) {
		try {
			const { amortizationDetails, companyId, id } = documentNdc || {};
			const trsPromise = [];
			amortizationDetails.forEach((item) => {
				const { transaction: transactionCash, transactionBank } = item.amortization;
				if (
					transactionCash &&
					transactionCash.typePayment.flagTypeTransaction === TypeTransaction.cash
				) {
					trsPromise.push(Transaction.create({
						companyId,
						salSaleDocumentsId: sale.id,
						amount: transactionCash.amount,
						currency: transactionCash.currency,
						paymentAmount: transactionCash.amount,
						paymentDate: new Date(),
						typePaymentId: transactionCash.typePaymentId,
						typeMovement: TypeMovement.expenses,
						cashId: transactionCash.cashId,
						salCashDeskClosingId: credentials.salCashDeskClosingId,
						moduleOriginId: ModuleCode.sales,
						concept: `Transaccion de cancelar de documento ${documentNdc.typeDocument.code}${
							documentNdc.documentNumber
						} ${transactionCash.currency} ${transactionCash.amount}`,
						entityExternalId: sale.customerId,
						typeTransaction: TypeTransactionCash.normalTransaction,
						documentNumber: documentNdc.documentNumber,
						employeeId: documentNdc.employee.id,
						warWarehousesId: sale.warehouseId,
						bankAccountId: transactionCash.bankAccountId,
						bankId: transactionCash.bankId,
					}));
				}
				if (
					transactionBank &&
					transactionBank.typePayment.flagTypeTransaction === TypeTransaction.bank
				) {
					trsPromise.push(TransactionBank.create({
						companyId,
						salDocumentsId: sale.id,
						amount: transactionBank.amount,
						currency: transactionBank.currency,
						paymentAmount: transactionBank.amount,
						paymentDate: new Date(),
						typePaymentId: transactionBank.typePaymentId,
						typeMovement: TypeMovement.expenses,
						cashId: transactionBank.cashId,
						salCashDeskClosingId: credentials.salCashDeskClosingId,
						moduleOriginId: ModuleCode.sales,
						concept: `Transaccion de cancelar de documento ${documentNdc.typeDocument.code}${
							documentNdc.documentNumber
						} ${transactionBank.currency} ${transactionBank.amount}`,
						entityExternalId: sale.customerId,
						typeTransaction: TypeTransactionCash.normalTransaction,
						documentNumber: documentNdc.documentNumber,
						employeeId: documentNdc.employee.id,
						warehouseId: sale.warehouseId,
						bankAccountId: transactionBank.bankAccountId,
					}));
				}
			});
			trsPromise.push(this.query()
				.patch({
					salStatesId: saleStates.finalized,
					commentary: 'Revertir Anulacion de venta',
					dateCancel: new Date(),
					balance: raw('balance+??', [documentNdc.amount]),
				})
				.where('id', sale.id));
			await Promise.all(trsPromise);

			const cancelUserName = `${credentials.employee.name} ${credentials.employee.lastname}`;
			const result = await this.query()
				.patch({
					salStatesId: saleStates.canceled,
					commentary: saleCommentary,
					dateCancel: new Date(),
					cancelUserId: credentials.employee.id,
					cancelUserName,
					balance: raw('balance+??', [sale.amount]),
				})
				.where('id', id);

			return result;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async getSalesByCustomer(companyId, customerId) {
		return this.query()
			.select('id')
			.where('customer_id', customerId)
			.first();
	}

	static editCotization(companyId, id, data) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editCotizationAll(companyId, id, data) {
		const knex = SaleDocuments.knex();
		const newData = data;
		if (data.exchangeRate) {
			newData.exchangeAmount =
				data.currency === 'USD' ? data.amount * data.exchangeRate : data.amount / data.exchangeRate;
		}
		const arrayIds = [];
		const detailsInsert = [];
		const detailsUpdate = [];
		data.details.forEach((element) => {
			const newElement = element;
			const idDetail = newElement.id;
			delete newElement.id;
			delete newElement.productType;
			if (!idDetail) {
				newElement.salSaleDocumentsId = id;
				detailsInsert.push(newElement);
			} else {
				detailsUpdate.push(SaleDocumentsDetail.edit(idDetail, id, newElement));
				arrayIds.push(idDetail);
			}
		});

		delete newData.details;
		newData.dueAmount = newData.amount;
		newData.balance = newData.amount;
		const { totalTaxesAmount } = newData;
		if (totalTaxesAmount) {
			const {
				ice,
				iva,
				tip,
				total,
				irbpnr,
				discount,
				subtotal,
				subtotalIva,
				subtotalExtIva,
				subtotalNoObjIva,
				subtotalWithoutTax,
			} = totalTaxesAmount;
			totalTaxesAmount.subtotal = subtotal ? Number(subtotal).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalIva = subtotalIva ? Number(subtotalIva).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalNoObjIva = subtotalNoObjIva
				? Number(subtotalNoObjIva).toFixed(2)
				: '0.00';
			totalTaxesAmount.subtotalExtIva = subtotalExtIva ? Number(subtotalExtIva).toFixed(2) : '0.00';
			totalTaxesAmount.subtotalWithoutTax = subtotalWithoutTax
				? Number(subtotalWithoutTax).toFixed(2)
				: '0.00';
			totalTaxesAmount.discount = discount ? Number(discount).toFixed(2) : '0.00';
			totalTaxesAmount.ice = ice ? Number(ice).toFixed(2) : '0.00';
			totalTaxesAmount.iva = iva ? Number(iva).toFixed(2) : '0.00';
			totalTaxesAmount.irbpnr = irbpnr ? Number(irbpnr).toFixed(2) : '0.00';
			totalTaxesAmount.tip = tip ? Number(tip).toFixed(2) : '0.00';
			totalTaxesAmount.total = total ? Number(total).toFixed(2) : '0.00';
		}
		const newTransaction = transaction(knex, () =>
			this.query()
				.patch(newData)
				.where('id', id)
				.where('com_company_id', companyId)
				.then(() => {
					if (arrayIds.length > 0) {
						return SaleDocumentsDetail.deleteDetail(arrayIds, id);
					}
					return null;
				})
				.then(() => SaleDocumentsDetail.createMultiple(detailsInsert))
				.then(() => {
					if (detailsUpdate.length > 0) {
						return Promise.all(detailsUpdate);
					}
					return null;
				})
				.then(() => SaleDocumentsDetail.updateOrderDetails(id))
				.then(() => this.getById(id, companyId)));
		return newTransaction;
	}

	static editStatusOrder(companyId, id, newStatus) {
		return this.query()
			.patch({ statusOrder: newStatus })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static getSalesTable(companyId, tableId, status) {
		return this.query()
			.select(this.defaultColumns())
			.where('table_id', tableId)
			.where('sal_states_id', status)
			.orderBy('creation_date_number', 'desc')
			.first();
	}

	static transferTable(companyId, id, oldTableId, newTableId) {
		const knex = SaleDocuments.knex();
		return transaction(knex, () =>
			this.query()
				.patch({ tableId: newTableId })
				.where('id', id)
				.where('com_company_id', companyId)
				.then(() => Table.edit(oldTableId, { status: tableStatus.free }, companyId))
				.then(() => Table.edit(newTableId, { status: tableStatus.occupied }, companyId)));
	}

	static editStatesId(companyId, id, newStates, trx) {
		return this.query(trx)
			.patch({ salStatesId: newStates })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static remove(id, companyId, tableId) {
		const knex = SaleDocuments.knex();

		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('id', id)
				.where('com_company_id', companyId)
				.then(() => SaleDocumentsDetail.removeAll(id))
				.then(() => {
					if (tableId) {
						return Table.edit(tableId, { status: tableStatus.free }, companyId);
					}
					return 1;
				}));
	}

	static editSales(companyId, id, data, detailsOld) {
		const knex = SaleDocuments.knex();
		const newData = data;
		const arrayIds = [];
		const detailsInsert = [];
		const detailsUpdate = [];
		data.details.forEach((element) => {
			const newElement = element;
			let idDetail = newElement.id;
			if (!idDetail) {
				const itemFound = detailsOld.find(p =>
					p.warProductsId === newElement.warProductsId && !!p.flagFree === !!newElement.flagFree);
				idDetail = itemFound && itemFound.id;
			}
			delete newElement.id;
			delete newElement.productType;
			delete newElement.flagControlSerie;
			if (!idDetail) {
				newElement.salSaleDocumentsId = id;
				detailsInsert.push(newElement);
			} else {
				detailsUpdate.push(SaleDocumentsDetail.edit(idDetail, id, newElement));
				arrayIds.push(idDetail);
			}
		});

		delete newData.details;
		const newTransaction = transaction(knex, () =>
			this.query()
				.patch(newData)
				.where('id', id)
				.where('com_company_id', companyId)
				.then(() => {
					if (arrayIds.length > 0) {
						return SaleDocumentsDetail.deleteDetail(arrayIds, id);
					}
					return null;
				})
				.then(() => SaleDocumentsDetail.createMultiple(detailsInsert))
				.then(() => {
					if (detailsUpdate.length > 0) {
						return Promise.all(detailsUpdate);
					}
					return null;
				})
				.then(() => SaleDocumentsDetail.updateOrderDetails(id))
				.then(() => this.getById(id, companyId)));
		return newTransaction;
	}

	static getSaleRelated(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_documents_id', id)
			.where('com_company_id', companyId)
			.first();
	}

	static validByWarehouse({ warehouseId, subsidiaryId }, companyId) {
		return this.query()
			.select('id')
			.where('warehouse_id', warehouseId)
			.where('com_subsidiary_id', subsidiaryId)
			.where('com_company_id', companyId)
			.first();
	}

	static getEmployeeWareHouse(companyId, statusId, salTypeDocumentId, methodPayment, filter = {}) {
		const saleDetailTable = 'sal_sale_documents_detail';
		let query = this.query()
			.distinct(`${saleDetailTable}.war_warehouses_id`, `${this.tableName}.com_employee_id`)
			.select(raw(`sum(${saleDetailTable}.price * ${saleDetailTable}.quantity) as amountTotal, sum( ${saleDetailTable}.quantity) as quantity`))
			.innerJoin(
				saleDetailTable,
				`${this.tableName}.id`,
				`${saleDetailTable}.sal_sale_documents_id`,
			)
			.where(`${this.tableName}.com_company_id`, companyId)
			.where(`${this.tableName}.sal_states_id`, statusId)
			.where(`${this.tableName}.sal_type_document_id`, '!=', salTypeDocumentId)
			.where(`${this.tableName}.sal_cash_desk_closing_id`, null)
			.where(`${this.tableName}.payment_method_id`, methodPayment)
			.groupBy(raw('sal_documents.com_employee_id, sal_sale_documents_detail.war_warehouses_id'));

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

	static getListReport(typeDocumentId, companyId, status, customerId, filter = {}) {
		const eagerAux = filter.store
			? '[typeDocument(documentTypeData), state(selectColumns), details(selectColumns), employee(selectColumnsVendor), customer(selectColumnsVendor)]'
			: '[typeDocument(documentTypeData), state(selectColumns), details(selectColumns)]';
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerAux)
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('sal_states_id', status)
			.skipUndefined()
			.where('sal_type_document_id', '!=', typeDocumentId)
			.skipUndefined()
			.where('customer_id', customerId)
			.skipUndefined()
			.where('id', filter.id)
			.skipUndefined()
			.where('currency', filter.currency)
			.skipUndefined()
			.where('com_subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId)
			.skipUndefined()
			.where('com_employee_id', filter.employeeId);

		if (filter.warehouseIds) {
			query.whereIn('warehouse_id', filter.warehouseIds);
		}

		if (filter.stateNotIds && filter.stateNotIds.length) {
			query.whereNotIn('sal_states_id', filter.stateNotIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${this.tableName}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getListFacturacion(typeDocumentIds, companyId, status, filter = {}) {
		const feeDocument = filter.addCaDocument
			? ', caDocument(selectColumns).[details(selectColumns)]'
			: '';
		let eagerAux = `[documentRelated(selectColumns).typeDocument(documentTypeData), downPaymentDocuments(selectColumns), company(selectColumns).country(selectColumns), terminal(selectColumns), typeDocument(documentTypeData), typeCatalogSunat(selectColumns), state(selectColumns), details(selectColumns), customer(selectColumns).msTypePerson(selectColumns), subsidiary(selectColumns), documents(selectColumns).[typeDocument(documentTypeData), typeCatalogSunat(selectColumns)] ${feeDocument}]`;
		eagerAux = filter.kardex
			? '[company(selectColumns).country(selectColumns), terminal(selectColumns), typeDocument(documentTypeData), state(selectColumns), details(selectColumns), customer(selectColumns).msTypePerson(selectColumns), subsidiary(selectColumns), employee(selectColumns)]'
			: eagerAux;
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagerAux)
			.skipUndefined()
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('sal_states_id', status);

		if (typeDocumentIds && typeDocumentIds.length) {
			query.whereNotIn('sal_type_document_id', typeDocumentIds);
		}

		if (filter.ids) {
			query.whereIn('id', filter.ids);
		}

		if (filter.saleWithoutMovement) {
			query
				.where('sal_states_id', saleStates.finalized)
				.where('send_kardex_status', pending)
				.where('flag_dispatch', 0);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getStatusPayment(id, companyId, status, typeDocumentId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('com_company_id', companyId)
			.where('sal_states_id', status)
			.where('sal_type_document_id', '!=', typeDocumentId)
			.where(raw('due_amount >= amount'))
			.first();
	}

	static getSalesByHash(hashOffline, companyId, trx) {
		return this.query(trx)
			.select('id', 'hash')
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.hash_offline`, hashOffline);
	}

	static closeCashOffline(cashClosingId, { hashOffline, companyId }, trx) {
		const query = this.query(trx)
			.patch({ salCashDeskClosingId: cashClosingId })
			.where(`${this.tableName}.hash_offline`, hashOffline)
			.where(`${this.tableName}.com_company_id`, companyId);
		return query;
	}

	static updateStatusTax(id, companyId, {
		status, messageError, authorizationDate, cronCounter,
	}) {
		const newData = {
			statusTax: status,
			sunatError: messageError,
			authorizationDate,
		};
		if (cronCounter) {
			newData.cronBillingCounter = raw('cron_billing_counter+??', [1]);
		}
		if (status === inProcess) {
			newData.dateTaxSend = format(new Date(), 'YYYY-MM-DD HH:mm:ss');
		}
		return this.query()
			.patch(newData)
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editQrUrl(id, companyId, qrUrl) {
		return this.query()
			.patch({ qrUrl })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editCustomer(id, companyId, customerId) {
		return this.query()
			.patch({ customerId })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editSendKardexStatus(ids, message) {
		return this.query()
			.patch({ sendKardexStatus: StatusDispatch.delivered, sendKardexMessage: message })
			.whereIn('id', ids);
	}

	static getDocumentAmortizationById(id, companyId) {
		return this.query()
			.select('com_company_id', 'id')
			.eager('[amortizationDetails(selectColumns).[amortization(selectColumns).[transaction(selectColumns).[typePayment(selectColumns), bankAccount(selectColumns)], transactionBank(selectColumns).[typeTransactionBank(selectColumns), bankAccount(selectColumns), typePayment(selectColumns)]]]]')
			.where('com_company_id', companyId)
			.findById(id);
	}

	static async reportSaleStock(
		subsidiaryId,
		companyId,
		typeDocument,
		states,
		filter = {},
		hapiAxios,
	) {
		try {
			const { data } = await hapiAxios.get(`/warehouses?subsidiaryId=${subsidiaryId}`);
			let dataReport = [];
			let formatReport = {};
			if (data.length > 0) {
				const newFilter = filter;
				newFilter.subsidiaryId = subsidiaryId;
				const dataSales = await this.getListReport(
					typeDocument,
					companyId,
					states,
					undefined,
					filter,
				);
				if (isDevOrProd() && dataSales.length > 0) {
					const sales = await this.setProductsToSales(dataSales, { hapiAxios });
					const saleProducts = [];
					const products = [];
					sales.forEach((item) => {
						item.details.forEach((item2) => {
							if (item2.product) {
								const category = filter.categoryIds
									? filter.categoryIds.find(i => i === item2.product.categoryId)
									: true;
								if (category) {
									const auxProduct = products.find(element => element.id === item2.product.id);
									if (!auxProduct) {
										products.push({
											id: item2.product.id,
											name: item2.product.name,
											code: item2.product.code,
											caracteristicas: item2.product.inlineFeatures,
											unitId: item2.product.unitId,
											unidad: item2.product.unitName,
										});
									}
									let amount = item2.price - item2.discount;
									amount *= item2.quantity;
									const newItem = {
										id: item2.product.id,
										quantity: item2.quantity,
										saleAmount: amount,
										warehouseId: item2.warWarehousesId,
									};
									saleProducts.push(newItem);
								}
							}
						});
					});
					dataReport = products.map((item) => {
						const newItem = item;
						const salesFilter = saleProducts.filter(element => element.id === item.id);
						const totalSalesProduct = salesFilter.reduce(
							(acum, element) => acum + element.saleAmount,
							0,
						);
						const totalStockProduct = salesFilter.reduce(
							(acum, element) => acum + element.quantity,
							0,
						);
						newItem.totalSalesProduct = totalSalesProduct;
						newItem.totalStockProduct = totalStockProduct;

						const stores = data.map((item2) => {
							const salProdStore = salesFilter.filter(element => element.warehouseId === item2.id);
							const totalSalesStore = salProdStore.reduce(
								(acum, element) => acum + element.saleAmount,
								0,
							);
							const totalStockStore = salProdStore.reduce(
								(acum, element) => acum + element.quantity,
								0,
							);
							return {
								id: item2.id,
								name: item2.name,
								code: item2.code,
								totalSalesStore,
								totalStockStore,
							};
						});
						newItem.stores = stores;
						return newItem;
					});

					const reportColumns = [
						{
							name: 'Codigo',
							value: 'code',
						},
						{
							name: 'Productos',
							value: 'name',
						},
						{
							name: 'Monto total  de ventas',
							value: 'totalSalesProduct',
						},
						{
							name: 'Cantidad total de ventas',
							value: 'totalStockProduct',
						},
					];

					let cont = 1;
					data.forEach((item) => {
						reportColumns.push({
							name: `Vta-${item.code}`,
							value: `store${cont}Sales`,
						});
						reportColumns.push({
							name: `Stk-${item.code}`,
							value: `store${cont}Stock`,
						});
						cont += 1;
					});

					const reportRows = [];
					dataReport.forEach((item) => {
						const row = {
							code: item.code,
							name: item.name,
							totalSalesProduct: item.totalSalesProduct,
							totalStockProduct: item.totalStockProduct,
						};
						let cont2 = 1;
						item.stores.forEach((item2) => {
							row[`store${cont2}Sales`] = item2.totalSalesStore;
							row[`store${cont2}Stock`] = item2.totalStockStore;

							cont2 += 1;
						});
						reportRows.push(row);
					});
					formatReport = {
						code: 'xlsx',
						columns: reportColumns,
						rows: reportRows,
						startDate: filter.startDate,
						endDate: filter.endDate,
					};
				}
			}
			return formatReport;
		} catch (error) {
			return error;
		}
	}

	static recursion(data = [], fatherId) {
		const newData = [];
		data.forEach((item) => {
			const newItem = item;
			if (item.typePaymentId === fatherId) {
				newItem.detail = this.recursion(data, item.id);
				newItem.amount = newItem.detail.reduce((a, b) => a + b.amount, 0);
				newData.push(newItem);
			}
		});
		return newData;
	}

	static async reportSaleZ(
		{
			query, salStateId, stateId, currency, cashIds, moduleId = ModuleCode.sales,
		},
		companyId,
		hapiAxios,
	) {
		try {
			const data = await this.getList(
				companyId,
				{ ...query, cashIds: cashIds || undefined },
				undefined,
				undefined,
				salStateId,
			);
			let totalAmount = 0;
			let amount = 0;
			let taxes = 0;
			let newData = data.reduce((acum, item) => {
				if (MsTypeDocument.moveKardex(item.typeDocument.code)) {
					totalAmount += item.amount;
					amount += item.subtotal;
					taxes += item.taxes;
					return acum.concat([item]);
				}
				return acum;
			}, []);
			totalAmount = this.roundTo(totalAmount);
			amount = this.roundTo(amount);
			taxes = this.roundTo(taxes);
			const report = {
				totalAmount,
				currency: currency.code,
				symbol: currency.symbol,
				amounts: {
					name: 'VENTAS',
					amount,
					returns: 0,
					net: amount,
				},
				taxes: {
					name: 'IGV',
					amount: taxes,
					returns: 0,
					net: taxes,
				},
				typePayment: [],
				type: [],
				category: [],
			};
			const dataTypePayment = await Transaction.getAmountByTypePayment(
				cashIds,
				{
					currency: currency.code,
					stateId,
					moduleId,
					startDate: query.startDate,
					endDate: query.endDate,
					report: true,
					employeeId: query.employeeId,
					typeMovement: TypeMovement.income,
					warehouseId: query.warehouseId,
				},
				companyId,
			);
			let details = [];
			if (dataTypePayment && dataTypePayment.length > 0) {
				dataTypePayment.forEach((item) => {
					const newItem = item;
					if (!item.typePaymentId && item.id) {
						newItem.detail = this.recursion(dataTypePayment, item.id);
						details.push(newItem);
					}
				});
			}
			details = details.filter(item => item.amount);
			report.typePayment = details;

			const dataTypeDocument = newData.reduce((acum, item) => {
				const newAcum = acum;
				const { typeDocument } = item;
				const typeDocIndex = acum.findIndex(r => r.id === typeDocument.id);
				if (typeDocIndex === -1) {
					return acum.concat([
						{
							id: typeDocument.id,
							code: typeDocument.code,
							name: typeDocument.name,
							totalAmount: item.amount,
							amount: item.subtotal,
							taxes: item.taxes,
							percentage: this.percentageTo(totalAmount, item.amount),
						},
					]);
				}
				amount = acum[typeDocIndex].totalAmount + item.amount;
				newAcum[typeDocIndex].totalAmount = this.roundTo(amount);
				newAcum[typeDocIndex].amount = this.roundTo(acum[typeDocIndex].amount + item.subtotal);
				newAcum[typeDocIndex].taxes = this.roundTo(acum[typeDocIndex].taxes + item.taxes);
				newAcum[typeDocIndex].percentage = this.percentageTo(
					totalAmount,
					newAcum[typeDocIndex].totalAmount,
				);
				return newAcum;
			}, []);
			report.type = dataTypeDocument;

			if (isDevOrProd()) {
				newData = await this.setProductsToSales(newData, { hapiAxios });
			}

			const dataCategoryProduct = [];
			newData.forEach((element) => {
				element.details.forEach((item) => {
					if (item.product) {
						const { product } = item;
						let newAmount = item.price * item.quantity;
						newAmount -= item.discount;
						const typeCatIndex = dataCategoryProduct.findIndex(r => r.id === product.categoryId);
						if (typeCatIndex === -1) {
							dataCategoryProduct.push({
								id: product.categoryId,
								name: product.category ? product.category.name : '',
								totalAmount: this.roundTo(newAmount),
								percentage: this.percentageTo(totalAmount, newAmount),
							});
						} else {
							amount = dataCategoryProduct[typeCatIndex].totalAmount + newAmount;
							dataCategoryProduct[typeCatIndex].totalAmount = this.roundTo(amount);
							dataCategoryProduct[typeCatIndex].percentage = this.percentageTo(
								totalAmount,
								dataCategoryProduct[typeCatIndex].totalAmount,
							);
						}
					}
				});
			});
			details = dataCategoryProduct.filter(item => item.totalAmount);
			report.category = details;
			return Promise.resolve(report);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static percentageTo(total = 0, number = 0) {
		if (total > 0) {
			let percentage = number / total;
			percentage *= 100;
			return this.roundTo(percentage);
		}
		return 0;
	}

	static getAllByStatusTax(statusTax) {
		return this.query()
			.eager('[subsidiary(selectColumns), typeDocument(documentTypeData), company(selectColumns)]')
			.select(this.defaultColumns(['com_company_id']))
			.where('status_tax', statusTax);
	}

	static editFlagUse(companyId, {
		id, flagUse, amount = 0, oldAmount, documentNumber = '',
	}) {
		const knex = SaleDocuments.knex();
		const status = oldAmount >= amount ? PaymentState.payOut : PaymentState.partial;
		return transaction(knex, () =>
			this.query()
				.patch({
					flagUse,
					balance: raw('balance-??', [amount]),
					dueAmount: raw('due_amount+??', [amount]),
					paymentState: status,
					reason: `Documento anulado por Nota de Crédito ${documentNumber}.`,
				})
				.where('id', id)
				.where('com_company_id', companyId)
				.then(() =>
					DocumentAccountStatus.editByDocument(
						{
							saleDocumentId: id,
							data: {
								description: `Documento anulado por Nota de Crédito ${documentNumber}.`,
								status,
								dueAmount: raw('due_amount+??', [amount]),
							},
						},
						companyId,
					)));
	}

	static editFlagUseAndDetails(companyId, { newRecord, saleOrigin, dataValidOrigin }) {
		const { amount, documentNumber } = newRecord;
		const {
			dueAmount, id, typeDocument, reason: reasonText,
		} = saleOrigin;
		let documentNumbers = '';
		if (isNullOrUndefined(reasonText)) {
			documentNumbers = documentNumber;
		} else {
			const numberData = reasonText.substring(
				reasonText.lastIndexOf('(') + 1,
				reasonText.lastIndexOf(')'),
			);
			documentNumbers = numberData.length > 0 ? `${numberData}, ${documentNumber}` : documentNumber;
		}

		const { flagUse, details } = dataValidOrigin;
		const typeDocumentText =
			typeDocument.code === 'NDD' ? 'Devolucion de Nota de Venta' : 'Nota de Crédito';
		const status = amount >= dueAmount ? PaymentState.payOut : PaymentState.partial;
		return transaction(
			this,
			DocumentAccountStatus,
			SaleDocumentsDetail,
			async (SalesTx, DocumentAccountStatusTx, SaleDocumentsDetailTx) => {
				const saleResponse = await SalesTx.query()
					.patch({
						flagUse,
						balance: raw('balance-??', [amount]),
						dueAmount: raw('due_amount+??', [amount]),
						paymentState: status,
						reason: `Documento afectado por ${typeDocumentText} (${documentNumbers}).`,
					})
					.where('id', id)
					.where('com_company_id', companyId);

				await DocumentAccountStatusTx.editByDocument(
					{
						saleDocumentId: id,
						data: {
							description: `Documento afectado por ${typeDocumentText} (${documentNumbers}).`,
							status,
							dueAmount: raw('due_amount+??', [amount]),
						},
					},
					companyId,
				);
				if (details && details.length > 0) {
					const detailsEdit = details.map(i => ({
						id: i.id,
						flagUse: i.flagUse,
						quantityRefund: raw('quantity_refund+??', [i.quantityRefund]),
						totalRefund: raw('total_refund+??', [i.totalRefund]),
					}));
					await SaleDocumentsDetailTx.updateMultiple(detailsEdit);
				}
				return saleResponse;
			},
		);
	}

	static editFlagUseMultiple(companyId, ids, flagUse) {
		return this.query()
			.patch({ flagUse })
			.whereIn('id', ids)
			.where('com_company_id', companyId);
	}

	static editStateTaxes(
		companyId,
		id,
		{
			statusTaxSri,
			sunatError,
			qrUrl,
			authorizationNumber,
			authorizationDate,
			environment,
			emission,
			password,
			urlPassword,
		},
	) {
		return this.query()
			.patch({
				statusTaxSri,
				sunatError,
				qrUrl,
				authorizationNumber,
				authorizationDate,
				environment,
				emission,
				password,
				urlPassword,
			})
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editStateTaxesSunat(companyId, id, { statusTax, sunatError, qrUrl }) {
		return this.query()
			.patch({ statusTax, sunatError, qrUrl })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static saleByWarehouse(companyId, filter = {}) {
		const query = this.query()
			.select(raw('warehouse_id, sum(amount) as amount'))
			.where(`${this.tableName}.com_company_id`, companyId)
			.whereRaw(`${this.tableName}.warehouse_id IS NOT NULL`)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, filter.warehouseId)
			.groupBy(`${this.tableName}.warehouse_id`);

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

	static generateRawCasePaymentStatus() {
		let caseSql = 'CASE WHEN sal_documents.payment_state = 1 THEN "Pendiente"';
		caseSql += ' WHEN sal_documents.payment_state = 2 THEN "Parcial"';
		caseSql += 'ELSE "Pagado" END as statusPaymentName';
		return caseSql;
	}

	static generateRawCaseTaxStatus() {
		let caseSql = 'CASE WHEN sal_documents.status_tax = 1 THEN "Sin Enviar"';
		caseSql += ' WHEN sal_documents.status_tax = 2 THEN "En Proceso"';
		caseSql += ' WHEN sal_documents.status_tax = 3 THEN "Validado"';
		caseSql += ' WHEN sal_documents.status_tax = 4 THEN "Error"';
		caseSql += ' WHEN sal_documents.status_tax = 5 THEN "Firmado"';
		caseSql += ' ELSE "Error Al Firmar" END as statusTaxName';
		return caseSql;
	}

	static generateRawCaseCustomer(countryCode = peru) {
		const rucTypePerson = countryCode === peru ? 2 : 7;
		let caseSql = `CASE WHEN c.flag_type_person != ${rucTypePerson} THEN CONCAT(c.name, " ", c.lastname)`;
		caseSql += ` WHEN c.flag_type_person = ${rucTypePerson} THEN c.rz_social`;
		caseSql += ' ELSE "-" END as customer_name,';
		caseSql += ` CASE WHEN c.flag_type_person != ${rucTypePerson} THEN c.dni`;
		caseSql += ` WHEN c.flag_type_person = ${rucTypePerson} THEN c.ruc`;
		caseSql += ' ELSE "-" END as customer_document_number';
		return caseSql;
	}

	static exportExcel({
		companyId,
		warehouseIds,
		salStatesId,
		salTypeDocumentId,
		paymentState,
		employeeId,
		startDate,
		statusTax,
		statusTaxSri,
		endDate,
		typeDocumentIds,
		accountReceivable,
		countryCode = peru,
		customerId,
		documentTypesNot,
		currency,
		currencies,
		referenceExternal,
	}) {
		const saleTable = SaleDocuments.tableName;
		const salesColumns = [
			'commentary',
			'currency',
			'warehouse_name',
			'user_id',
			'type_payment_codes',
			'reference_external',
			'discount',
			'discount_global',
			'tip',
		].map(c => `${saleTable}.${c}`);
		const subColumns = ['s.rz_social as sucursal_name'];
		const terminalColumns = ['t.name as terminal_name'];
		const tdColumns = ['td.name as type_document_name'];
		const stColumns = ['st.name as dispatch_status_name'];
		const ptColumns = ['p.name as payment_name'];
		const customerColumns = [
			'msp.email AS customerEmail',
			'c.address AS customerAddress',
			'msp.fullname as customerName',
		];

		const rawRelatedDocumentsNumber =
			countryCode === peru
				? raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BB", document_sale.document_number) ELSE CONCAT("FF", document_sale.document_number) END) ELSE "" END as relatedDocumentsNumber')
				: raw('CASE WHEN td.code_taxes = "04" THEN document_sale.document_number ELSE "" END AS relatedDocumentsNumber');

		const rawColumns = [
			raw(SaleDocuments.generateRawCasePaymentStatus()),
			raw(SaleDocuments.generateRawCaseTaxStatus()),
			raw(`DATE_FORMAT(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00"),'%Y-%m-%d') as date`),
			raw(`TIME(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) as time`),
			raw(`CASE WHEN st.name = "ANULADO" THEN 0 ELSE ${saleTable}.due_amount END as debtAmount`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${saleTable}.amount WHEN td.name = "NOTA DE CREDITO" THEN (${saleTable}.amount * -1) ELSE ${saleTable}.amount END as amount`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${saleTable}.taxes WHEN td.name = "NOTA DE CREDITO" THEN (${saleTable}.taxes * -1) ELSE ${saleTable}.taxes END as taxes`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${saleTable}.subtotal WHEN td.name = "NOTA DE CREDITO" THEN (${saleTable}.subtotal * -1) ELSE ${saleTable}.subtotal END as subtotal`),
			raw('CONCAT(emp.name, " ", emp.lastname) AS employeeName'),
			// ,
			rawRelatedDocumentsNumber,
			raw(SaleDocuments.generateRawCaseCustomer(countryCode)),
		];
		let columns = salesColumns.concat(
			subColumns,
			terminalColumns,
			tdColumns,
			stColumns,
			ptColumns,
			rawColumns,
			customerColumns,
		);

		let documentNumber = [
			raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BB", ${saleTable}.document_number) ELSE CONCAT("FF", ${saleTable}.document_number) END) ELSE CONCAT(td.qp_code, ${saleTable}.document_number)  END as documentNumber`),
		];
		if (configCompanySerie0(companyId)) {
			documentNumber = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("B0", ${saleTable}.document_number) ELSE CONCAT("F0", ${saleTable}.document_number) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('0', ${saleTable}.document_number))  END as documentNumber`),
			];
		} else if (configCompanySerieP(companyId)) {
			documentNumber = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BP", ${saleTable}.document_number) ELSE CONCAT("FP", ${saleTable}.document_number) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('P', ${saleTable}.document_number))  END as documentNumber`),
			];
		} else if (configCompanySerieA(companyId)) {
			documentNumber = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BA", ${saleTable}.document_number) ELSE CONCAT("FA", ${saleTable}.document_number) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('A', ${saleTable}.document_number))  END as documentNumber`),
			];
		}
		columns = columns.concat(documentNumber);
		const query = this.query()
			.select(columns)
			.leftJoin(
				'sal_documents as document_sale',
				'document_sale.id',
				`${saleTable}.sal_documents_id`,
			)
			.innerJoin('com_subsidiaries as s', 's.id', `${saleTable}.com_subsidiary_id`)
			.innerJoin('sal_terminals as t', 't.id', `${saleTable}.terminal_id`)
			.innerJoin('com_ms_type_documents as td', 'td.id', `${saleTable}.sal_type_document_id`)
			.innerJoin('sal_sales_states as st', 'st.id', `${saleTable}.sal_states_id`)
			.innerJoin('com_customers as c', 'c.id', `${saleTable}.customer_id`)
			.innerJoin('ms_person as msp', 'msp.id', 'c.person_id')
			.leftJoin('com_employee as emp', 'emp.id', `${saleTable}.com_employee_id`)
			.leftJoin('sal_method_payments as p', 'p.id', `${saleTable}.payment_method_id`)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, salStatesId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, salTypeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, paymentState)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, employeeId)
			.skipUndefined()
			.where(`${saleTable}.status_tax`, statusTax)
			.skipUndefined()
			.where(`${saleTable}.status_tax_sri`, statusTaxSri)
			.skipUndefined()
			.where(`${saleTable}.customer_id`, customerId)
			.skipUndefined()
			.where(`${saleTable}.currency`, currency);

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (referenceExternal) {
			query.where(`${this.tableName}.reference_external`, referenceExternal);
		}
		if (documentTypesNot) {
			query.where('td.code', '!=', documentTypesNot);
		}
		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${saleTable}.sal_type_document_id`, typeDocumentIds);
		}
		if (accountReceivable) {
			query.where(raw(`${saleTable}.due_amount < ${saleTable}.amount`));
		}
		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`, endDate);
		}
		if (currencies) {
			const currenciesKeys = Object.keys(currencies);
			query.whereIn(`${this.tableName}.currency`, `${currenciesKeys}`.split(','));
		}
		return query;
	}

	static async exportSalesDetails({ params }) {
		const query = SaleDocuments.exportExcel(params);
		const stColumns = 'st.name as dispatch_status_name';
		const ptColumns = 'p.name as payment_name';
		const sddColumns = [
			'sal_documents.id',
			'sdd.war_products_id',
			'sdd.quantity',
			'sdd.price_cost',
			'sdd.unit_code',
			raw(`if(${
				SaleDocuments.tableName
			}.sal_type_document_id = 5, sdd.quantity * - sdd.price, sdd.quantity * sdd.price) as detail_total`),
			raw(`if(${
				SaleDocuments.tableName
			}.sal_type_document_id = 5, - sdd.quantity, sdd.quantity) as quantity`),
			raw(`if(${
				SaleDocuments.tableName
			}.sal_type_document_id = 5, - sdd.subtotal_without_tax, sdd.subtotal_without_tax) as unitPrice`),
			raw(`if(${
				SaleDocuments.tableName
			}.sal_type_document_id = 5, - sdd.tax_amount, sdd.tax_amount) as taxAmount`),
			raw('sdd.product_code AS productCode'),
			raw('sdd.brand_name AS productBrand'),
			raw('sdd.category_name AS productCategory'),
			raw('sdd.description AS productDescription'),
			raw('sdd.description AS productName'),
			raw(`${SaleDocuments.tableName}.discount_global`),
			stColumns,
			ptColumns,
			raw(SaleDocuments.generateRawCasePaymentStatus()),
		];
		query
			.select(sddColumns)
			.innerJoin(
				'sal_sale_documents_detail as sdd',
				'sdd.sal_sale_documents_id',
				`${SaleDocuments.tableName}.id`,
			);
		return query;
	}

	static editUrlImages(id, companyId, urlImages) {
		return this.query()
			.patch({ urlImages })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static editInformation(id, companyId, commentary, considerations, workToDo) {
		return this.query()
			.patch({ commentary, considerations, workToDo })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static getSalesValid({ ids, typeDocumentId }, companyId) {
		return this.query()
			.whereIn('id', ids)
			.where('com_company_id', companyId)
			.where('sal_type_document_id', typeDocumentId)
			.whereRaw('flag_use IS NULL')
			.where('payment_method_id', PaymentMethodCode.credit);
	}

	static generateQr(qrData) {
		const qr = qrcode(9, 'Q');
		qr.addData(qrData);
		qr.make();
		const code = qr.createDataURL();
		return code;
	}

	static async createCodeQr(qrData, fileName, id, companyId, documentUrl) {
		try {
			let codeQr = this.generateQr(qrData);
			codeQr = codeQr.split(',', 2);
			const codeQrBase64 = codeQr[1];
			const urlImage = await Aws(
				codeQrBase64,
				fileName,
				process.env.AWS_S3_BUCKET_SUNAT,
				'image/png',
			);
			const qrInfo = {
				qrUrl: urlImage.Location,
				dataResponseTaxes: { qrUrl: urlImage.Location, documentUrl },
			};
			const data = await this.query()
				.patch(qrInfo)
				.where('id', id)
				.where('com_company_id', companyId);
			return data;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static typesDocumentsValidForAdvance(code) {
		return ['FAC', 'BOL'].indexOf(code) > -1;
	}

	static getSalesValidByCustomerId(ids, typeDocumentId, companyId, customerId) {
		return this.query()
			.whereIn('id', ids)
			.where('com_company_id', companyId)
			.where('sal_type_document_id', typeDocumentId)
			.whereNull('down_payment_document_id')
			.where('flag_advance', 1)
			.skipUndefined()
			.where('customer_id', customerId);
	}

	static editDocumentsRelatedToAdvances(ids, companyId, data) {
		return this.query()
			.patch(data)
			.whereIn('id', ids)
			.where('flag_advance', 1)
			.whereNull('down_payment_document_id')
			.where('com_company_id', companyId);
	}

	static editSynStatus({ id, companyId, flagSyncFb = 1 }) {
		return this.query()
			.patch({ flagSyncFb })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static exportExcelPleSunat({
		companyId,
		warehouseIds,
		salStatesId,
		salTypeDocumentId,
		paymentState,
		employeeId,
		startDate,
		statusTax,
		endDate,
	}) {
		const saleTable = SaleDocuments.tableName;
		const salesColumns = [`${saleTable}.number as C8`, `${saleTable}.currency as C26`];
		const tdColumns = ['td.code_taxes as C6'];
		const pColumns = ['p.document_number as C11', 'p.fullname as C12'];
		const rawColumns = [
			raw(`DATE_FORMAT(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00"),'%Y%m00') as C1`),
			raw(`CONCAT("03", LPAD(${saleTable}.id, 8, "0")) as C2`),
			raw(`CONCAT("M03", LPAD(${saleTable}.id, 7, "0")) as C3`),
			raw(`DATE_FORMAT(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00"),'%d/%m/%Y') as C4`),
			raw(`DATE_FORMAT(CONVERT_TZ(${saleTable}.expirated_at, "+05:00", "+00:00"),'%d-%m-%Y') as C5`),
			raw('CASE WHEN td.code_taxes = "07" THEN DATE_FORMAT(CONVERT_TZ(document_sale.created_at, "+05:00", "+00:00"),\'%d/%m/%Y\') ELSE "" END as C28'),
			raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN "03" ELSE "01" END) ELSE "" END as C29'),
			raw('CASE WHEN td.code_taxes = "07" THEN document_sale.number ELSE "" END as C31'),
			raw(`CASE WHEN td.code_taxes = "07" THEN (ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.export'), 2) * -1) ELSE ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.export'), 2) END as C13`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.recorded'), 2) * -1) ELSE ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.recorded'), 2) END as C14`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (${saleTable}.discount * -1) ELSE ${saleTable}.discount END as C15`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (${saleTable}.taxes * -1) ELSE ${saleTable}.taxes END as C16`),
			raw('"" as C9'),
			raw('"0" as C17'),
			raw(`CASE WHEN td.code_taxes = "07" THEN (JSON_EXTRACT(${saleTable}.taxes_amount, '$.exonerated') * -1) ELSE JSON_EXTRACT(${saleTable}.taxes_amount, '$.exonerated') END as C18`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (JSON_EXTRACT(${saleTable}.taxes_amount, '$.inactive') * -1) ELSE JSON_EXTRACT(${saleTable}.taxes_amount, '$.inactive') END as C19`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (JSON_EXTRACT(${saleTable}.taxes_amount, '$.isc') * -1) ELSE JSON_EXTRACT(${saleTable}.taxes_amount, '$.isc') END as C20`),
			raw('"0" as C21'),
			raw('"0" as C22'),
			raw(`CASE WHEN td.code_taxes = "07" THEN (ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.icbper'), 2) * -1) ELSE ROUND(JSON_EXTRACT(${saleTable}.taxes_amount, '$.icbper'), 2) END as C23`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (ROUND(${saleTable}.tip, 2) * -1) ELSE ROUND(${saleTable}.tip, 2) END as C24`),
			raw(`CASE WHEN td.code_taxes = "07" THEN (${saleTable}.amount * -1) ELSE ${saleTable}.amount END as C25`),
			raw('"" as C32'),
			raw('"1" as C33'),
			raw('"1" as C34'),
			raw(`ROUND(${saleTable}.exchange_rate, 3) as C27`),
			raw(`CASE WHEN ${saleTable}.summary_unsubscribe_id is null and ${saleTable}.status_tax = 3 THEN 1 ELSE 2 END as C35`),
			raw('CASE WHEN tp.code_taxes IN ("0","1","4","6","7") THEN tp.code_taxes ELSE "" END as C10'),
			// eslint-disable-next-line max-len
			// raw(`CASE WHEN DATE(CONVERT_TZ(${saleTable}.date_emission, "+05:00", "+00:00")) >= ${startDate} and DATE(CONVERT_TZ(${saleTable}.date_emission, "+05:00", "+00:00")) <= ${endDate} and ${saleTable}.sal_states_id = 3 THEN 1 ELSE 2 END as C35`),
		];
		let columnsC7New = [
			raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BB", ${saleTable}.serie) ELSE CONCAT("FF", ${saleTable}.serie) END) ELSE CONCAT(td.qp_code, ${saleTable}.serie) END as C7`),
			raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BB", document_sale.serie) ELSE CONCAT("FF", document_sale.serie) END) ELSE "" END as C30'),
		];
		if (configCompanySerie0(companyId)) {
			columnsC7New = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("B0", ${saleTable}.serie) ELSE CONCAT("F0", ${saleTable}.serie) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('0', ${saleTable}.serie))  END as C7`),
				raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("B0", document_sale.serie) ELSE CONCAT("F0", document_sale.serie) END) ELSE "" END as C30'),
			];
		} else if (configCompanySerieP(companyId)) {
			columnsC7New = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BP", ${saleTable}.serie) ELSE CONCAT("FP", ${saleTable}.serie) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('P', ${saleTable}.serie))  END as C7`),
				raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BP", document_sale.serie) ELSE CONCAT("FP", document_sale.serie) END) ELSE "" END as C30'),
			];
		} else if (configCompanySerieA(companyId)) {
			columnsC7New = [
				raw(`CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BA", ${saleTable}.serie) ELSE CONCAT("FA", ${saleTable}.serie) END) ELSE CONCAT(SUBSTRING(td.qp_code, 1, 1), CONCAT('A', ${saleTable}.serie))  END as C7`),
				raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BA", document_sale.serie) ELSE CONCAT("FA", document_sale.serie) END) ELSE "" END as C30'),
			];
		}
		const columns = salesColumns.concat(tdColumns, pColumns, rawColumns, columnsC7New);
		const query = this.query()
			.select(columns)
			.leftJoin(
				'sal_documents as document_sale',
				'document_sale.id',
				`${saleTable}.sal_documents_id`,
			)
			.innerJoin('com_ms_type_documents as td', 'td.id', `${saleTable}.sal_type_document_id`)
			.leftJoin('com_customers as c', 'c.id', `${saleTable}.customer_id`)
			.innerJoin('ms_type_person as tp', 'tp.id', 'c.flag_type_person')
			.leftJoin('ms_person as p', 'p.id', 'c.person_id')
			.where(`${saleTable}.com_company_id`, companyId)
			.whereIn(`${saleTable}.sal_type_document_id`, [1, 2, 5])
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, salStatesId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, salTypeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, paymentState)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, employeeId)
			.skipUndefined()
			.where(`${saleTable}.status_tax`, statusTax);

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`, endDate);
		}

		return query;
	}

	static getAllRepair(companyId, filter = {}) {
		let query = this.query()
			.eager('[transactions(selectColumns).typePayment(selectColumns), documentRelated(selectColumns).transactions(selectColumns).typePayment(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('warehouse_id', filter.warehouseId)
			.where('sal_type_document_id', 5)
			.where('com_subsidiary_id', filter.comSubsidiaryid)
			.where('com_company_id', companyId);

		if (filter.search) {
			query = this.match(query, filter.search);
		}

		return query;
	}

	static async getSalesByCashId(companyId, cashId) {
		return this.query()
			.select('id')
			.where('cash_id', cashId)
			.where('com_company_id', companyId)
			.first();
	}

	static async getValidSale(companyId, id) {
		return this.query()
			.select('id')
			.where('id', id)
			.where('com_company_id', companyId)
			.first();
	}

	static getByIdMultipleFull(ids, companyId, flagReturnProduct) {
		const eagerFilter =
			'[typeDocument(documentTypeData), downPaymentDocuments(selectColumns), company(selectColumns), details(selectColumns), employee(selectColumns), customer(selectColumns).[msTypePerson(selectColumns), subsidiaryCustomer(selectColumns)], payment(selectColumns), amortizationDetails(selectColumns, filterAmortizationDetails).[amortization(selectColumns).[transaction(selectColumns, filterTypeMovement).[typePayment(selectColumns), paymentMethod(selectColumns)], transactionBank(selectColumns, filterTypeMovement).typePayment(selectColumns)]]]';
		return this.query()
			.eager(eagerFilter, {
				filterTypeMovement: (builder) => {
					builder.skipUndefined().whereRaw('type_movement = ?', TypeMovement.income);
				},
				filterAmortizationDetails: (builder) => {
					builder.skipUndefined().where('amount', '>', 0);
				},
			})
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.skipUndefined()
			.where('flag_type_return', flagReturnProduct)
			.where('com_company_id', companyId);
	}

	static getByIdMultiple(ids, companyId) {
		return this.query()
			.eager('[typeDocument(documentTypeData), documentRelated(selectColumns).typeDocument(documentTypeData), customer(selectColumns), salSeries(selectColumns)]')
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.where('com_company_id', companyId);
	}

	static async updateSummaryDocuments(
		{
			id, documentsRelated, flagCancelDocuments, companyId, typeSummary, authorizationDate,
		},
		statusTax,
		// CustomerTx,
	) {
		try {
			const dataUpdate =
				typeSummary === TypeSummary.unsubscribeSunat || flagCancelDocuments
					? { summaryUnsubscribeId: id }
					: { ballotSummaryId: id };
			if (statusTax) {
				dataUpdate.statusTax = statusTax;
				dataUpdate.authorizationDate = authorizationDate;
			}
			if (typeSummary === TypeSummary.unsubscribeSunat || flagCancelDocuments) {
				dataUpdate.summaryUnsubscribeId = id;
				delete dataUpdate.ballotSummaryId;
			}
			const knex = SaleDocuments.knex();
			const saleResulTx = transaction(knex, () =>
				this.query()
					.patch(dataUpdate)
					.whereIn('id', documentsRelated)
					.where('com_company_id', companyId)
					.then(() => {
						if (flagCancelDocuments && statusTax === validated) {
							return SaleDocuments.getByIdMultipleFull(documentsRelated, companyId);
						}
						return null;
					})
					.then((saleDocuments) => {
						if (!isNullOrUndefined(saleDocuments) && flagCancelDocuments) {
							const trsPromise = [];

							saleDocuments.forEach((sale) => {
								trsPromise.push(this.query()
									.patch({
										salStatesId: saleStates.canceled,
										commentary: 'Anulacion de venta por resumen',
										dateCancel: new Date(),
										balance: raw('balance-??', [sale.amount]),
									})
									.where('id', sale.id));
							});
							return Promise.all(trsPromise);
						}
						return null;
					}));
			return Promise.resolve(saleResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async getHashOnline(companyId, hashOnline) {
		return this.query()
			.select('id')
			.where('hash_online', hashOnline)
			.where('com_company_id', companyId)
			.first();
	}

	static getByCustomerReport(companyId, filter) {
		const detailTable = 'sal_sale_documents_detail';
		const customerTable = 'com_customers';
		const typeDocumentTable = 'com_ms_type_documents';
		return this.query()
			.select(raw(`${typeDocumentTable}.name AS typeDocumentName,
				CONCAT_WS('-', ${this.tableName}.serie, ${this.tableName}.number) AS documentNumber,
				SUM(${detailTable}.price * ${detailTable}.quantity) AS salesDocument,
				SUM(${detailTable}.price_cost * ${detailTable}.quantity) AS costDocument,
				${this.tableName}.customer_id AS idCustomer`))
			.eager('[details(benefitReport), customer(onlyVirtualAttributes)]')
			.innerJoin(customerTable, `${customerTable}.id`, `${this.tableName}.customer_id`)
			.innerJoin(detailTable, `${detailTable}.sal_sale_documents_id`, `${this.tableName}.id`)
			.innerJoin(
				typeDocumentTable,
				`${typeDocumentTable}.id`,
				`${this.tableName}.sal_type_document_id`,
			)
			.where(`${this.tableName}.com_company_id`, companyId)
			.whereNotNull(`${this.tableName}.customer_id`)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.where(`${this.tableName}.sal_states_id`, filter.status)
			.where(`${this.tableName}.sal_type_document_id`, '!=', filter.typeDocumentId)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, filter.customerId)
			.groupByRaw(`${this.tableName}.id`)
			.orderBy(`${this.tableName}.customer_id`);
	}

	static getDocumentByDocumentSummaryId(companyId, { ballotSummaryId, summaryUnsubscribeId }) {
		return this.query()
			.eager('[typeDocument(documentTypeData), documentRelated(selectColumns).typeDocument(documentTypeData), customer(selectColumns).[person(selectColumns), msTypePerson(selectColumns)]]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('ballot_summary_id', ballotSummaryId)
			.skipUndefined()
			.where('summary_unsubscribe_id', summaryUnsubscribeId)
			.where('com_company_id', companyId);
	}

	static getNumberCorrelative(
		comSubsidiaryId,
		salTypeDocumentId,
		serie,
		number,
		companyId,
		dateOnline,
	) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_subsidiary_id', comSubsidiaryId)
			.where('sal_type_document_id', salTypeDocumentId)
			.where('serie', serie)
			.where('number', number)
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('date_online', dateOnline)
			.first();
	}

	static getReport(
		companyId,
		filter,
		typeDocumentId,
		typePaymentId,
		statesId,
		aclFilters = {},
		countryCode = peru,
	) {
		try {
			const customerTable = 'com_customers';
			const transactionTable = 'sal_transactions';
			const typeDocumentTable = 'com_ms_type_documents';
			const transactionBankTable = 'com_transaction_bank';
			const tdColumns = ['td.name as type_document_name'];
			const salesColumns = ['document_number', 'amount', 'warehouse_name'].map(c => `${this.tableName}.${c}`);
			const colummsSales = [
				'c.name',
				raw(`DATE_FORMAT(CONVERT_TZ(${
					this.tableName
				}.created_at, "+05:00", "+00:00"), '%Y-%m-%d') as createdAt`),
				raw(SaleDocuments.generateRawCaseCustomer(countryCode)),
			];
			const employeeRaw = [raw('CONCAT(emp.name, " ", emp.lastname) AS employeeName')];
			const commission = filter.commission
				? [raw(`${this.tableName}.amount * ? AS commission`, [filter.commission / 100])]
				: [];
			const columns = salesColumns.concat(colummsSales, tdColumns, employeeRaw, commission);
			let query = this.query()
				.select(columns)
				.innerJoin('com_ms_type_documents as td', 'td.id', `${this.tableName}.sal_type_document_id`)
				.innerJoin('com_customers as c', 'c.id', `${this.tableName}.customer_id`)
				.leftJoin('com_employee as emp', 'emp.id', `${this.tableName}.user_id`)
				.where(`${this.tableName}.com_company_id`, companyId)
				.skipUndefined()
				.where(`${this.tableName}.sal_type_document_id`, typeDocumentId)
				.skipUndefined()
				.where(`${this.tableName}.sal_states_id`, statesId)
				.skipUndefined()
				.where(`${this.tableName}.table_id`, filter.tableId)
				.skipUndefined()
				.where(`${this.tableName}.user_id`, filter.employeeId)
				.skipUndefined()
				.where(`${this.tableName}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
				.skipUndefined()
				.where(`${this.tableName}.payment_state`, filter.paymentState)
				.skipUndefined()
				.where(`${this.tableName}.currency`, filter.currency)
				.skipUndefined()
				.where(`${this.tableName}.warehouse_id`, filter.warehouseId)
				.skipUndefined()
				.where(`${this.tableName}.com_subsidiary_id`, filter.comSubsidiaryId)
				.skipUndefined()
				.where(`${this.tableName}.ballot_summary_id`, filter.ballotSummaryId)
				.skipUndefined()
				.where(`${this.tableName}.sal_states_id`, '!=', filter.flagNotCancel);
			if (aclFilters && aclFilters.sales) {
				query.aclFilter(aclFilters.sales);
			}
			if (filter.orderCreatedAtNumber) {
				query.orderBy(raw(`${this.tableName}.creation_date_number desc, number`), 'desc');
			} else {
				query.orderBy(`${this.tableName}.creation_date_number`, 'desc');
			}
			if (filter.flagNotNotes) {
				query.whereNotIn(`${this.tableName}.sal_type_document_id`, filter.flagNotNotes);
			}
			if (filter.salDocumentsId) {
				query.where(`${this.tableName}.sal_documents_id`, filter.salDocumentsId);
			}

			if (filter.flagSummaryBallot) {
				if (Number(filter.flagSummaryBallot) === 1) {
					query
						.whereNull(`${this.tableName}.ballot_summary_id`)
						.leftJoin(`${this.tableName} as bndc`, `${this.tableName}.sal_documents_id`, 'bndc.id')
						.leftJoin(raw(
							'com_ms_type_documents as tdndc on tdndc.id = bndc.sal_type_document_id and tdndc.code = ?',
							'BOL',
						));
				} else {
					query.whereNotNull(`${this.tableName}.ballot_summary_id`);
				}
			}

			if (filter.customerId) {
				query.where(`${this.tableName}.customer_id`, filter.customerId);
			}

			if (filter.flagAdvance) {
				query
					.where(`${this.tableName}.flag_advance`, filter.flagAdvance)
					.whereNull('down_payment_document_id');
			}

			if (filter.cashIds) {
				query.whereIn(`${this.tableName}.cash_id`, filter.cashIds);
			}

			if (filter.warehouseIds) {
				query.whereIn(`${this.tableName}.warehouse_id`, filter.warehouseIds);
			}

			if (filter.report) {
				query.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
			}

			if (filter.stateIds) {
				query.whereIn(`${this.tableName}.sal_states_id`, filter.stateIds);
			}

			if (filter.typeDocumentIds && filter.typeDocumentIds.length > 0) {
				query.whereIn(`${this.tableName}.sal_type_document_id`, filter.typeDocumentIds);
			}

			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query
					.leftJoin(
						`${transactionTable}`,
						`${transactionTable}.sal_sale_documents_id`,
						`${this.tableName}.id`,
					)
					.leftJoin(
						`${transactionBankTable}`,
						`${transactionBankTable}.sal_documents_id`,
						`${this.tableName}.id`,
					)
					.groupBy(`${this.tableName}.id`);

				if (typePaymentId) {
					query.where((builder) => {
						builder
							.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
							.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
					});
				}
				if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
					query.where((builder) => {
						builder
							.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
							.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
					});
				}
			}

			if (filter.paymentStates && filter.paymentStates.length > 0) {
				query.whereIn(`${this.tableName}.payment_state`, filter.paymentStates);
			}

			if (filter.search) {
				if (!filter.customerId) {
					query.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
									this.tableName
								}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
				} else {
					query.whereRaw(
						`MATCH(${this.tableName}.serie, ${this.tableName}.number, ${
							this.tableName
						}.document_number)
						 AGAINST(?)`,
						[filter.search],
					);
				}
			}

			if (filter.startDate && filter.endDate) {
				if (filter.flagNotDocumentRelated) {
					query
						.leftJoin(`${this.tableName} as b`, `${this.tableName}.sal_documents_id`, 'b.id')
						.where((builder) => {
							builder
								.where((builder2) => {
									builder2
										.whereRaw(
											`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
											filter.startDate,
										)
										.whereRaw(
											`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
											filter.endDate,
										)
										.whereRaw(`${this.tableName}.sal_documents_id IS NULL`);
								})
								.orWhere((builder2) => {
									builder2
										.whereRaw(
											'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) >= ?',
											filter.startDate,
										)
										.whereRaw(
											'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) <= ?',
											filter.endDate,
										);
								});
						});
				} else {
					query.whereRaw(
						`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
						filter.startDate,
					);
					query.whereRaw(
						`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
						filter.endDate,
					);
				}
			}
			if (filter.statusTax) {
				if (!Array.isArray(filter.statusTax)) {
					query.where(`${this.tableName}.status_tax`, filter.statusTax);
				} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
					query.whereIn(`${this.tableName}.status_tax`, filter.statusTax);
				}
			}
			query = this.includePaginationAndSort(query, filter);
			return Promise.resolve(query);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static updateSummaryRelated(companyId, { data = {}, ids }) {
		return this.query()
			.patch(data)
			.whereIn('id', ids)
			.where(`${this.tableName}.com_company_id`, companyId);
	}

	static getCompanyProcess({ lotRecords }) {
		return this.query()
			.select(raw(`DISTINCT ${Kardex.tableName}.company_id, com_companies.com_country_id`))
			.innerJoin('com_companies', 'com_companies.id', `${SaleDocuments.tableName}.com_company_id`)
			.where(`${SaleDocuments.tableName}.sal_states_id`, saleStates.finalized)
			.where(`${SaleDocuments.tableName}.send_kardex_status`, pending)
			.limit(lotRecords);
	}

	static processRegister(companyId, { lotRecords }) {
		return this.query()
			.select('id')
			.where(`${SaleDocuments.tableName}.sal_states_id`, saleStates.finalized)
			.where(`${SaleDocuments.tableName}.send_kardex_status`, pending)
			.where(`${SaleDocuments.tableName}.com_company_id`, companyId)
			.limit(lotRecords);
	}

	static async reportSaleDashboard(subsidiaryId, companyId, typeDocument, states, filter = {}) {
		try {
			const newFilter = filter;
			newFilter.subsidiaryId = subsidiaryId;
			newFilter.store = true;
			const dataSales = await this.getListReport(
				typeDocument,
				companyId,
				states,
				undefined,
				filter,
			);
			let saleProducts = {};
			const categories = [];
			const salCategories = {};
			const customers = [];
			const salCustomers = {};
			const employees = [];
			const salEmployees = {};
			const stores = [];
			const salStores = {};
			let paymentState = {
				quantity: 0,
				finalized: 0,
				canceled: 0,
				toDeliver: 0,
				initiated: 0,
				total: 0,
			};
			if (isDevOrProd() && dataSales.length > 0) {
				paymentState = dataSales.reduce(
					(acum, item) => {
						const newAcum = { ...acum };
						if ([saleStates.canceled, saleStates.canceledSunat].indexOf(item.salStatesId) > -1) {
							newAcum.canceled += item.amount || 0;
							return newAcum;
						}
						const hourDocument = helper.localDate(item.createdAt, 'HH:00:00');
						item.details.forEach((item2) => {
							let amount = item2.price - item2.discount;
							amount *= item2.quantity;
							saleProducts = this.processGroupData(saleProducts, item2, item2.warProductsId);
							const auxCategories = categories.find(element => element === item2.categoryId);
							if (!auxCategories) {
								categories.push(item2.categoryId);
								salCategories[item2.categoryId] = {
									name: item2.categoryName,
									quantity: 1,
									sales: {},
									salesAmount: amount,
								};
							} else {
								salCategories[item2.categoryId].quantity += 1;
								salCategories[item2.categoryId].salesAmount += amount;
							}
							if (!salCategories[item2.categoryId].sales[`${hourDocument}`]) {
								salCategories[item2.categoryId].sales[`${hourDocument}`] = 0;
							}
							salCategories[item2.categoryId].sales[`${hourDocument}`] += amount;
						});
						newAcum.toDeliver += item.salStatesId === saleStates.toDeliver ? item.amount : 0;
						newAcum.finalized += item.salStatesId === saleStates.finalized ? item.amount : 0;
						newAcum.initiated += item.salStatesId === saleStates.initiated ? item.amount : 0;
						newAcum.quantity += 1;
						newAcum.total += item.amount;
						const auxStores = stores.find(element => element === item.warehouseId);
						if (!auxStores) {
							stores.push(item.warehouseId);
							salStores[item.warehouseId] = {
								name: item.warehouseName,
								quantity: 1,
								salesAmount: item.amount,
							};
						} else {
							salStores[item.warehouseId].quantity += 1;
							salStores[item.warehouseId].salesAmount += item.amount;
						}
						const auxCustomer = customers.find(element => element === item.customerId);
						if (!auxCustomer) {
							customers.push(item.customerId);
							salCustomers[item.customerId] = {
								name: item.customer.typePerson.fullName,
								documentName: item.customer.typePerson.documentName,
								documentNumber: item.customer.typePerson.documentNumber,
								phone: item.customer.phone,
								quantity: 1,
								salesAmount: item.amount,
							};
						} else {
							salCustomers[item.customerId].quantity += 1;
							salCustomers[item.customerId].salesAmount += item.amount;
						}
						const auxEmployee = employees.find(element => element === item.comEmployeeId);
						if (!auxEmployee) {
							employees.push(item.comEmployeeId);
							salEmployees[item.comEmployeeId] = {
								name: item.employee.fullname,
								code: item.employee.code,
								documentNumber: item.employee.documentNumber,
								phone: item.employee.phone,
								quantity: 1,
								salesAmount: item.amount,
							};
						} else {
							salEmployees[item.comEmployeeId].quantity += 1;
							salEmployees[item.comEmployeeId].salesAmount += item.amount;
						}
						return newAcum;
					},
					{
						quantity: 0,
						finalized: 0,
						canceled: 0,
						toDeliver: 0,
						initiated: 0,
						total: 0,
					},
				);
			}
			paymentState.salAverageTicket =
				dataSales.length || 0 / (filter.typeDocumentIds && filter.typeDocumentIds.length) || 1;
			return {
				salCategories,
				paymentState,
				saleProducts,
				salCustomers,
				salEmployees,
				salStores,
			};
		} catch (error) {
			return error;
		}
	}

	static async reportSaleDashboardBenefits(
		subsidiaryId,
		companyId,
		typeDocument,
		states,
		filter = {},
	) {
		try {
			const newFilter = filter;
			newFilter.subsidiaryId = subsidiaryId;
			newFilter.store = true;
			const dataSales = await this.getListReport(
				typeDocument,
				companyId,
				states,
				undefined,
				filter,
			);
			const paymentState = {
				quantity: 0,
				finalized: 0,
				canceled: 0,
				toDeliver: 0,
				initiated: 0,
				total: 0,
			};
			const products = [];
			let saleProducts = {};
			let saleProductsPoint = {};
			const categories = [];
			const salCategories = {};
			const terminals = [];
			const salTerminals = {};
			const customers = [];
			const salCustomers = {};
			if (isDevOrProd() && dataSales.length > 0) {
				dataSales.forEach((item) => {
					item.details.forEach((item2) => {
						let amount = item2.unitPrice - item2.discount;
						amount *= item2.quantity;

						products.push(item2.warProductsId);
						if (item2.productPoint && item2.productPoint > 0) {
							saleProductsPoint = this.processGroupData(
								saleProductsPoint,
								item2,
								item2.warProductsId,
								item2.unitPrice || '0.00',
								'unitPrice',
							);
						} else {
							saleProducts = this.processGroupData(
								saleProducts,
								item2,
								item2.warProductsId,
								item2.unitPrice || '0.00',
								'unitPrice',
							);
						}

						const auxCategories = categories.find(element => element === item2.categoryId);
						if (!auxCategories) {
							categories.push(item2.categoryId);
							salCategories[item2.categoryId] = {
								name: item2.categoryName,
								quantity: 1,
								totalBenefits: 0,
								salesAmount: amount,
							};
						} else {
							salCategories[item2.categoryId].quantity += 1;
							salCategories[item2.categoryId].salesAmount += amount;
						}

						const auxTerminals = terminals.find(element => element === item.terminalId);
						if (!auxTerminals) {
							terminals.push(item.terminalId);
							let saleProductsTerm = {};
							let productPointTerm = {};
							if (item2.productPoint && item2.productPoint > 0) {
								productPointTerm = this.processGroupData(
									productPointTerm,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							} else {
								saleProductsTerm = this.processGroupData(
									saleProductsTerm,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							}
							salTerminals[item.terminalId] = {
								name: null,
								quantity: 1,
								totalBenefits: 0,
								categories: {},
								saleProducts: saleProductsTerm,
								saleProductsPoint: productPointTerm,
								salesAmount: amount,
							};
						} else {
							salTerminals[item.terminalId].salesAmount += amount;
							if (item2.productPoint && item2.productPoint > 0) {
								salTerminals[item.terminalId].saleProductsPoint = this.processGroupData(
									salTerminals[item.terminalId].saleProductsPoint,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							} else {
								salTerminals[item.terminalId].saleProducts = this.processGroupData(
									salTerminals[item.terminalId].saleProducts,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							}
						}

						const auxCustomer = customers.find(element => element === item.customerId);
						if (!auxCustomer) {
							customers.push(item.customerId);
							let saleProductsTerm = {};
							let productPointTerm = {};
							if (item2.productPoint && item2.productPoint > 0) {
								productPointTerm = this.processGroupData(
									productPointTerm,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							} else {
								saleProductsTerm = this.processGroupData(
									saleProductsTerm,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							}
							salCustomers[item.customerId] = {
								name: item.customer.typePerson.fullName,
								documentName: item.customer.typePerson.documentName,
								documentNumber: item.customer.typePerson.documentNumber,
								saleProducts: saleProductsTerm,
								saleProductsPoint: productPointTerm,
								phone: item.customer.phone,
								quantity: 0,
								salesAmount: amount,
								benefitsAmount: 0,
							};
						} else {
							salCustomers[item.customerId].salesAmount += amount;
							if (item2.productPoint && item2.productPoint > 0) {
								salCustomers[item.customerId].saleProductsPoint = this.processGroupData(
									salCustomers[item.customerId].saleProductsPoint,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							} else {
								salCustomers[item.customerId].saleProducts = this.processGroupData(
									salCustomers[item.customerId].saleProducts,
									item2,
									item2.warProductsId,
									item2.unitPrice || '0.00',
									'unitPrice',
								);
							}
						}
					});
					paymentState.canceled += item.salStatesId === saleStates.canceled ? item.subtotal : 0;
					paymentState.toDeliver += item.salStatesId === saleStates.toDeliver ? item.subtotal : 0;
					paymentState.finalized += item.salStatesId === saleStates.finalized ? item.subtotal : 0;
					paymentState.initiated += item.salStatesId === saleStates.initiated ? item.subtotal : 0;
					paymentState.quantity += 1;
					paymentState.total += item.subtotal;
					salCustomers[item.customerId].quantity += 1;
					salTerminals[item.terminalId].quantity += 1;
				});
			}
			const salAverage =
				dataSales.length || 0 / (filter.typeDocumentIds && filter.typeDocumentIds.length) || 1;
			paymentState.salAverageTicket = salAverage;
			return {
				saleProductsPoint,
				salCategories,
				paymentState,
				saleProducts,
				salCustomers,
				salTerminals,
				products,
			};
		} catch (error) {
			return error;
		}
	}

	static processGroupData(data, item, productId, price, field = 'price') {
		const newData = { ...data };
		let amount = item[`${field}`] - item.discount;
		amount *= item.quantity;

		let details;
		if (price) {
			details = data[productId] && data[productId][price];
		} else {
			details = data[productId];
		}
		if (!details) {
			details = {};
			details.name = item.description;
			details.code = item.productCode;
			details.quantity = item.quantity;
			details.unitQuantity = item.unitQuantity;
			details.categoryId = item.categoryId;
			details.salesAmount = amount;
			details.unit = {};
			details.unit[item.unitId] = {
				id: item.unitId,
				name: item.unitName,
				quantity: item.quantity,
				salesAmount: amount,
			};
		} else {
			details.quantity += item.quantity;
			details.name = item.description;
			details.unitQuantity += item.unitQuantity;
			details.salesAmount += amount;
			if (!details.unit) {
				details.unit = {};
			}
			const unit = details.unit[item.unitId];
			details.unit[item.unitId] = {
				id: item.unitId,
				name: item.unitName,
				quantity: unit ? unit.quantity + item.quantity : item.quantity,
				salesAmount: unit ? unit.salesAmount + amount : amount,
			};
		}
		if (price) {
			if (!newData[productId]) {
				newData[productId] = {};
			}
			newData[productId][price] = details;
		} else {
			newData[productId] = details;
		}
		return newData;
	}

	// Peru only, by now
	static processBillingControl({ lotRecords }) {
		try {
			const saleId = `${SaleDocuments.tableName}.id`;
			const companyId = `${SaleDocuments.tableName}.com_company_id AS companyId`;
			const countryId = 'com_companies.com_country_id';
			return this.query()
				.select(raw(`${saleId}, ${companyId}, ${countryId}`))
				.innerJoin('com_companies', 'com_companies.id', `${SaleDocuments.tableName}.com_company_id`)
				.where((builder) => {
					builder
						.where((builder2) => {
							builder2
								.whereIn(`${SaleDocuments.tableName}.status_tax`, [inProcess, errorFromTaxesBiller])
								.where(`${SaleDocuments.tableName}.cron_billing_counter`, '<', 1)
								.whereRaw(`TIMEDIFF(NOW(), ${SaleDocuments.tableName}.date_tax_send) > '00:10:00'`);
						})
						.orWhere((builder3) => {
							builder3
								.whereIn(`${SaleDocuments.tableName}.status_tax`, [errorFromTaxesBiller])
								.where(`${SaleDocuments.tableName}.cron_billing_counter`, '<', 5)
								.whereRaw("TIME(NOW()) BETWEEN '05:00:00' AND '08:00:00'");
						});
				})
				.whereRaw(
					`DATE(CONVERT_TZ(${SaleDocuments.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
					process.env.START_DATE_BILLING_CONTROL,
				)
				.whereNotNull(`${SaleDocuments.tableName}.date_tax_send`)
				.where((builder) => {
					builder
						.whereIn(`${SaleDocuments.tableName}.sal_type_document_id`, [2]) // Factura
						.orWhere((builder1) => {
							builder1
								.whereIn(`${SaleDocuments.tableName}.sal_type_document_id`, [1]) // Boleta
								.whereNull(`${SaleDocuments.tableName}.ballot_summary_id`);
						});
				})
				.limit(lotRecords);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_QUERY_BILLING', error);
			return error;
		}
	}

	static async structureSalesToBilling(dataSales) {
		const query = {};
		query.ids = dataSales.map(it => it.id);
		query.addCaDocument = true;
		const data = await this.getListFacturacion(undefined, undefined, undefined, query);
		const newData = data.map((item) => {
			const newItem = item;
			newItem.warehouse = {
				warehouseId: newItem.warehouseId,
				warehouseName: newItem.warehouseName,
				warehouseCodeTaxes: newItem.warehouseCodeTaxes,
			};
			return newItem;
		});
		let newSales = JSON.parse(JSON.stringify(newData));
		newSales = newSales.map(sale => ({
			...sale,
			details: sale.details.map(it => ({
				...it,
				product: {
					name: it.description,
					code: it.productCode,
					codeProductCubso: it.productCubsoCode,
				},
			})),
		}));
		return newSales;
	}

	static updateCronCounter(id, companyId) {
		return this.query()
			.patch({ cronBillingCounter: raw('cron_billing_counter + ??', [1]) })
			.where('id', id)
			.where('com_company_id', companyId);
	}

	static getBySerie(idSerie) {
		return this.query()
			.select(this.defaultColumns())
			.where('serie_id', idSerie)
			.first();
	}

	static async createSimpleSale(typeDocumentCode, saleBuilt, authorization, validStatus = true) {
		const { data: saleResponse } = await simpleAxios({
			url: `${process.env.SELF_DOMAIN}/sale-documents/${typeDocumentCode}/type-document`,
			method: 'POST',
			headers: {
				authorization,
			},
			data: saleBuilt,
			validateStatus: () => validStatus,
		});
		return saleResponse;
	}

	static getSalesCustomerPdf(filter = {}, companyId, warehouseIds) {
		const typeDocumentTable = 'com_ms_type_documents';
		const query = this.query()
			.select([
				raw('com_customers.name AS nameCustomer'),
				raw(`ANY_VALUE(replace((JSON_EXTRACT(sal_documents.type_payment_codes, "$[0]")), '${'"'}', '')) as codeTypeTransactionBank`),
				raw('(CASE WHEN sal_documents.amount_credit > 0 THEN sal_documents.amount_credit ELSE null END)  as amountCredit'),
				raw('(CASE WHEN sal_documents.amount_cash > 0 THEN sal_documents.amount_cash ELSE null END)  as counted'),
				raw('sal_documents.amount as total'),
				raw('sal_documents.taxes as iva'),
				raw('sal_documents.amount as netSale'),
				raw('(CASE WHEN sal_documents.discount > 0 THEN sal_documents.discount ELSE null END)  as discount'),
				raw('sal_documents.subtotal as grossSale'),
				raw(`DATE_FORMAT(sal_documents.date_emission,  '${'%d-%m-%Y'}') AS dateEmission`),
				raw(`CONCAT(SUBSTRING_INDEX(${typeDocumentTable}.code, 1, -2), "-", ${
					this.tableName
				}.document_number) AS documentNumber`),
			])
			.join('com_customers', 'com_customers.id', `${this.tableName}.customer_id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal_documents.id')
			.join(
				`${typeDocumentTable}`,
				`${typeDocumentTable}.id`,
				`${this.tableName}.sal_type_document_id`,
			)
			.skipUndefined()
			.where('sal_documents.com_subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('cmtp.country_id', filter.countryId)
			.where('sal_documents.com_company_id', companyId)
			.groupBy('sal_documents.id');
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal_documents.warehouse_id', warehouseIds);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static async getSalesCustomerPdfTotal(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select(
				raw('ANY_VALUE((CASE WHEN sal_documents.amount_credit > 0 THEN sum(sal_documents.amount_credit) ELSE null END))  as totalAmountCredit'),
				raw('ANY_VALUE((CASE WHEN sal_documents.amount_cash > 0 THEN sum(sal_documents.amount_cash) ELSE null END))  as totalAmountCash'),
				raw('ANY_VALUE((CASE WHEN sal_documents.amount > 0 THEN sum(sal_documents.amount) ELSE null END))  as totalAmount'),
				raw('sum(sal_documents.taxes) as totaIvas'),
				raw('ANY_VALUE(sum((sal_documents.amount)) - (sum(sal_documents.taxes))) as totalNethWorth'),
			)
			.join('com_customers', 'com_customers.id', `${this.tableName}.customer_id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal_documents.id')
			.skipUndefined()
			.where('sal_documents.com_subsidiary_id', filter.comSubsidiaryId)
			.where('sal_documents.com_company_id', companyId);
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal_documents.warehouse_id', warehouseIds);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static async getSalesCustomerWayToPayPdfTotal(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw(`ANY_VALUE(replace((JSON_EXTRACT(sal_documents.type_payment_codes, "$[0]")), '${'"'}', '')) as codeTypeTransactionBank`),
				raw('sum(sal_documents.amount) as totalSales'),
				raw('sum(sal_documents.taxes) as totalSales'),
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) as subTotalSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal_documents.total_taxes_amount, "$.iva")) > 0 THEN sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subIvaSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal_documents.total_taxes_amount, "$.iva")) = 0 THEN sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subExIvaSales'),
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.discount")) as totalDiscount'),
			])
			.join('com_customers as cu', 'cu.id', `${this.tableName}.customer_id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal_documents.id')
			.skipUndefined()
			.where('sal_documents.com_subsidiary_id', filter.comSubsidiaryId)
			.where('sal_documents.com_company_id', companyId)
			.groupBy(raw('(JSON_EXTRACT(sal_documents.type_payment_codes, "$[0]"))'));
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal_documents.warehouse_id', warehouseIds);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static getByOrderSimple(orderId, companyId, flagAll = false) {
		const query = this.query()
			.select('id', 'order_id')
			.where('order_id', orderId)
			.where('com_company_id', companyId)
			.first();
		if (flagAll) {
			query.eager('[details(selectColumns)]');
		}
		return query;
	}

	static getByOrderCancel({
		orderId,
		companyId,
		salStatesId = 3,
		sendKardexStatus = 3,
		flagDispatch = 0,
	}) {
		return this.query()
			.select('id')
			.where('order_id', orderId)
			.where('com_company_id', companyId)
			.where('sal_states_id', salStatesId)
			.where('send_kardex_status', sendKardexStatus)
			.where('flag_dispatch', flagDispatch)
			.first();
	}

	static removeSalesHistorical(id, companyId, getSale) {
		const knex = SaleDocuments.knex();
		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('id', id)
				.where('com_company_id', companyId)
				.where('flag_old_sale', true)
				.then(() => SaleDocumentsDetail.removeAll(id))
				.then(() => {
					if (getSale && getSale.transactionsBank.length > 0) {
						TransactionBank.removeAll(id);
					}
					return 1;
				})
				.then(() => {
					if (getSale && getSale.cashId) {
						const dat = Cash.updateAmount(
							getSale.cashId,
							getSale.amount,
							companyId,
							getSale.currency,
						);
						return dat;
					}
					return 1;
				}));
	}

	static getSaleHistorical(id, companyId) {
		return this.query()
			.select(this.basicColumns())
			.where('id', id)
			.where('com_company_id', companyId)
			.where('flag_old_sale', true)
			.first();
	}

	static getTypeSearchTrue(
		{
			serie, number, customerId, salTypeDocumentId, comSubsidiaryId, productId,
		},
		companyId,
	) {
		const query = this.query()
			.select(
				'sal_documents.id',
				'sal_documents.serie',
				'sal_documents.number',
				'cd.code as documentCode',
				'sal_documents.document_number',
				'sal_documents.sal_type_document_id',
				'sd.sale_price',
				'sd.quantity',
				'sd.brand_id',
				'sd.war_warehouses_id',
				'sd.brand_name',
				'sd.category_id',
				'sd.category_name',
			)
			.join('com_ms_type_documents as cd', 'cd.id', `${this.tableName}.sal_type_document_id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', `${this.tableName}.id`)
			.where('com_company_id', companyId)
			.where('sd.war_products_id', productId)
			.where('number', 'like', number)
			.where('serie', 'like', serie)
			.where('com_subsidiary_id', comSubsidiaryId)
			.where('sal_type_document_id', salTypeDocumentId)
			.where('customer_id', customerId)
			.first();
		return query;
	}

	static getTypeSearchFalse(customerId, comSubsidiaryId, productId, companyId, salTypeDocumentId) {
		const query = this.query()
			.select(
				'sal_documents.id',
				'sal_documents.serie',
				'sal_documents.number',
				'cd.code as documentCode',
				raw('CONCAT(cd.code, "-", sal_documents.document_number) as documentNumber'),
				'sd.sale_price',
				'sd.brand_id',
				'sd.quantity',
				'sd.war_warehouses_id',
				'sd.brand_name',
				'sd.category_id',
				'sd.category_name',
			)
			.join('com_ms_type_documents as cd', 'cd.id', `${this.tableName}.sal_type_document_id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', `${this.tableName}.id`)
			.where('com_company_id', companyId)
			.where('sd.war_products_id', productId)
			.where('com_subsidiary_id', comSubsidiaryId)
			.where('customer_id', customerId)
			.orderBy('id', 'desc')
			.limit(10);
		if (salTypeDocumentId) {
			query.where('sal_type_document_id', salTypeDocumentId);
		} else {
			query.whereIn('cd.code', ['FAC', 'BOL', 'NTV']);
		}
		return query;
	}

	static async updateMultiple(data, series) {
		const options = {
			noDelete: true,
			noInsert: true,
		};
		if (series) {
			await Serie.updateMultiple(series);
		}
		return this.query().upsertGraph(data, options);
	}

	static async getByUltimateDocumentErrorSunat(terminalId, companyId, statusValid, typeDocumentId) {
		try {
			const query = this.query()
				.select(this.defaultColumns())
				.where('sal_documents.sal_type_document_id', typeDocumentId)
				.whereNotIn('sal_documents.status_tax', statusValid)
				.whereRaw('DATE_FORMAT(DATE_ADD(sal_documents.created_at, INTERVAL -5 HOUR),"%Y-%m-%d") = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -15 HOUR), "%Y-%m-%d")')
				// .where(raw(`(SELECT max(k.id) FROM sal_documents as k
				// inner join sal_terminals on sal_terminals.id = k.terminal_id
				// WHERE k.deleted_at IS NULL and k.com_company_id = sal_terminals.company_id
				// order BY k.id)`))
				.where('sal_documents.terminal_id', terminalId)
				.where('sal_documents.com_company_id', companyId)
				.orderBy('sal_documents.id', 'DESC')
				.limit(1)
				.first();

			return query;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_QUERY_BILLING', error);
			return error;
		}
	}

	static async getConversionSaleNote(
		terminalId,
		companyId,
		documentIdError,
		quantity,
		statusValid,
		typeDocumentId,
	) {
		try {
			const query = this.query()
				.select(this.defaultColumns(), raw('sal_documents.sal_type_document_id as dataprueba'))
				.where('sal_documents.sal_type_document_id', typeDocumentId)
				.whereIn('sal_documents.status_tax', statusValid)
				.whereRaw('DATE_FORMAT(DATE_ADD(sal_documents.created_at, INTERVAL -5 HOUR),"%Y-%m-%d") = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -15 HOUR), "%Y-%m-%d")')
				.where(raw(`(SELECT max(k.id) FROM sal_documents as k 
				inner join sal_terminals on sal_terminals.id = k.terminal_id
				WHERE k.deleted_at IS NULL and k.com_company_id = sal_terminals.company_id
				order BY k.id)`))
				.where('sal_documents.terminal_id', terminalId)
				.where('sal_documents.com_company_id', companyId)
				.skipUndefined()
				.where('sal_documents.id', '>', documentIdError)
				.orderBy('sal_documents.id', 'DESC');
			if (quantity > 0) {
				query.limit(quantity);
			}
			return query;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_QUERY_BILLING', error);
			return error;
		}
	}

	static async getByCountDocuments(
		terminalId,
		companyId,
		documentIdError,
		statusValid,
		typeDocumentId,
	) {
		try {
			const query = this.query()
				.select(raw('COUNT(*)'))
				.where('sal_documents.sal_type_document_id', typeDocumentId)
				.whereIn('sal_documents.status_tax', statusValid)
				.whereRaw('DATE_FORMAT(DATE_ADD(sal_documents.created_at, INTERVAL -5 HOUR),"%Y-%m-%d") = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL -15 HOUR), "%Y-%m-%d")')
				// .where(raw(`(SELECT max(k.id) FROM sal_documents as k
				// inner join sal_terminals on sal_terminals.id = k.terminal_id
				// WHERE k.deleted_at IS NULL and k.com_company_id = sal_terminals.company_id
				// order BY k.id)`))
				.where('sal_documents.terminal_id', terminalId)
				.where('sal_documents.com_company_id', companyId)
				.skipUndefined()
				.where('sal_documents.id', '>', documentIdError)
				.orderBy('sal_documents.id', 'DESC')
				.first();
			return query;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_QUERY_BILLING', error);
			return error;
		}
	}

	static getByIds(documentIds, filter = {}, companyId) {
		let colummsSales = [];
		const salesColumns = [
			'sal_documents.id',
			'sal_documents.number',
			'sal_documents.commentary',
			'sal_documents.discount',
			'sal_documents.qr_url',
			'com.company_rz_social',
			'comsub.rz_social as subsidiaryRzSocial',
			'comsub.ruc as subsidiaryRuc',
			'comsub.address as subsidiaryAddress',
			'cmtd.name as typeDocumentName',
			'ce.name as employeeName',
			'ce.lastname as employeeLastName',
			'cu.ruc as customerRuc',
			'cu.dni as customerDni',
			'cu.address as customerAddress',
			'cu.name as customerName',
			'cu.lastname as customerLastName',
			'sal_documents.document_number as documentNumberRelated',
			'salseri.description as serieDescription',
		];
		const subColumns = [
			raw('CASE WHEN cmtd.settings AND JSON_EXTRACT(cmtd.settings, "$.subTypes") and sal_documents.sub_type_documents THEN REPLACE(sal_documents.serie, "E", "0") ELSE sal_documents.serie END as serie'),
		];
		if (filter.countryCode === peru) {
			if (configCompanySerie0(companyId)) {
				colummsSales = [raw('CONCAT(SUBSTRING(cmtd.qp_code, 1, 1), "0")) as qpCode')];
			} else if (configCompanySerieP(companyId)) {
				colummsSales = [raw('CONCAT(SUBSTRING(cmtd.qp_code, 1, 1), "P")) as qpCode')];
			} else if (configCompanySerieA(companyId)) {
				colummsSales = [raw('CONCAT(SUBSTRING(cmtd.qp_code, 1, 1), "A")) as qpCode')];
			} else {
				colummsSales = [raw('cmtd.qp_code')];
			}
			colummsSales = colummsSales.concat([raw('sal_documents.serie')]);
		}

		if (filter.countryCode === CountryCode.ecuador) {
			colummsSales = colummsSales.concat([
				raw('CASE WHEN LENGTH(sal_documents.serie) === 6 THEN CONCAT(SUBSTRING(sal_documents.serie, 0, 3), " " , SUBSTRING(sal_documents.serie, 3, 6)) ELSE sal_documents.serie END as series)'),
			]);
		}

		const columns = salesColumns.concat(colummsSales, subColumns);
		const query = this.query()
			.select(columns)
			.eager('[details(basiColumns)]')
			.join('com_companies as com', 'com.id', 'sal_documents.com_company_id')
			.join('sal_series as salseri', 'salseri.id', 'sal_documents.serie_id')
			.join('com_subsidiaries as comsub', 'comsub.id', 'sal_documents.com_subsidiary_id')
			.join('com_ms_type_documents as cmtd', 'cmtd.id', 'sal_documents.sal_type_document_id')
			.join('com_employee as ce', 'ce.id', 'sal_documents.com_employee_id')
			.join('com_customers as cu', 'cu.id', 'sal_documents.customer_id')
			.whereIn('sal_documents.id', documentIds)
			.where('sal_documents.com_company_id', companyId);
		return query;
	}

	static getReportExcelSale({
		companyId,
		warehouseIds,
		salTypeDocumentId,
		paymentState,
		employeeId,
		startDate,
		statusTax,
		statusTaxSri,
		endDate,
		typeDocumentIds,
		accountReceivable,
		customerId,
		currency,
		currencies,
		referenceExternal,
		employeeIds,
	}) {
		const saleTable = SaleDocuments.tableName;
		const query = this.query()
			.select([
				raw('unit_code AS unitCode'),
				raw('product_code'),
				raw('description'),
				raw('SUM(quantity) AS totalQuantity'),
				raw('SUM(quantity*sale_price) AS totalPrice'),
				raw('com_employee_id as employeeId'),
				raw('em.name as name'),
			])
			.join(raw('sal_sale_documents_detail  ON  sal_documents.id = sal_sale_documents_detail.sal_sale_documents_id'))
			.join(raw('com_employee em on em.id = sal_documents.com_employee_id '))
			.whereIn(`${saleTable}.sal_type_document_id`, [1, 2, 3])
			.where(`${saleTable}.com_company_id`, companyId)
			.whereNot(`${saleTable}.sal_states_id`, 3)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, salTypeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, paymentState)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, employeeId)
			.skipUndefined()
			.where(`${saleTable}.status_tax`, statusTax)
			.skipUndefined()
			.where(`${saleTable}.status_tax_sri`, statusTaxSri)
			.skipUndefined()
			.where(`${saleTable}.customer_id`, customerId)
			.skipUndefined()
			.where(`${saleTable}.currency`, currency)
			.groupBy('sal_sale_documents_detail.war_products_id')
			.groupBy('sal_sale_documents_detail.unit_code');

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (employeeIds && employeeIds.length > 0) {
			query.whereIn(`${saleTable}.com_employee_id`, employeeIds);
		}

		if (referenceExternal) {
			query.where(`${this.tableName}.reference_external`, referenceExternal);
		}
		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${saleTable}.sal_type_document_id`, typeDocumentIds);
		}
		if (accountReceivable) {
			query.where(raw(`${saleTable}.due_amount < ${saleTable}.amount`));
		}
		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`, endDate);
		}
		if (currencies) {
			const currenciesKeys = Object.keys(currencies);
			query.whereIn(`${this.tableName}.currency`, `${currenciesKeys}`.split(','));
		}
		return query;
	}
}

module.exports = SaleDocuments;
