'use strict';

const { Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const typeTransactionDefault = require('./enums/type-transaction-default-enum');
const country = require('./enums/country-enum');
const PaymentState = require('./PaymentState');
const {
	registered, canceled, pending, accounted,
} = require('./EntityStateCode');

class DocumentAccountStatus extends baseModel {
	static get tableName() {
		return 'com_document_account_status';
	}

	static get relationMappings() {
		const relation = {
			saleDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'com_document_account_status.sale_document_id',
					to: 'sal_documents.id',
				},
			},
			purDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Purchases.js`,
				join: {
					from: 'com_document_account_status.pur_document_id',
					to: 'pur_documents.id',
				},
			},
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'com_document_account_status.module_id',
					to: 'com_module.id',
				},
			},
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'com_document_account_status.customer_id',
					to: 'com_customers.id',
				},
			},
			supplier: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Supplier.js`,
				join: {
					from: 'com_document_account_status.supplier_id',
					to: 'pur_suppliers.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_document_account_status.employee_id',
					to: 'com_employee.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_document_account_status.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			typeTransaction: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeTransaction.js`,
				join: {
					from: 'com_document_account_status.type_transaction_id',
					to: 'ms_type_transactions.id',
				},
			},
			amortizations: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Amortization.js`,
				join: {
					from: 'com_document_account_status.id',
					to: 'ca_amortizations.document_account_status_id',
				},
			},
			amortizationDocuments: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/AmortizationDetails.js`,
				join: {
					from: 'com_document_account_status.id',
					to: 'ca_amortizations_details.document_account_status_id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'employeeId', 'amount', 'typeTransactionId'],
			properties: {
				companyId: {
					type: 'integer',
				},
				customerId: {
					type: ['integer', 'null'],
				},
				typeTransactionId: {
					type: 'integer',
				},
				saleDocumentId: {
					type: ['integer', 'null'],
				},
				purDocumentId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: 'integer',
				},
				amount: {
					type: 'number',
				},
				dueAmount: {
					type: ['number', 'null'],
					default: 0,
				},
				status: {
					type: ['integer', 'null'],
					default: 1,
				},
				description: {
					type: ['string', 'null'],
				},
				moduleId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				purDocumentAnnexId: {
					type: ['integer', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				concept: {
					type: ['string', 'null'],
				},
				reference: {
					type: ['string', 'null'],
				},
				currency: {
					type: ['string', 'null'],
				},
				accessKey: {
					type: ['string', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
					default: {},
				},
				details: {
					type: ['array', 'null'],
					default: [],
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'module_id',
			'customer_id',
			'supplier_id',
			'employee_id',
			'subsidiary_id',
			'warehouse_id',
			'document_number',
			'currency',
			'amount',
			'due_amount',
			'description',
			'type_transaction_id',
			'emission_date',
			'payment_date',
			'reception_date',
			'expiration_date',
			'reference',
			'concept',
			'sale_document_id',
			'pur_document_id',
			'status',
			'pur_document_annex_id',
			'access_key',
			'details',
			'additional_information',
			'flag_active',
			'entity_state_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static defaultColumnsReportPdf(otherColumns = []) {
		const columns = [
			'id',
			'currency',
			'customer_id',
			'amount',
			'due_amount',
			'description',
			'type_transaction_id',
			'emission_date',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			defaultColumnsReportPdf: builder => builder.select(this.defaultColumnsReportPdf()),
		};
	}

	static get virtualAttributes() {
		return ['debtAmount', 'documentNumberComplete', 'entityStateName'];
	}

	get debtAmount() {
		return this.amount - this.dueAmount;
	}

	get documentNumberComplete() {
		const number = this.reference ? this.reference.split('-') : ['', ''];
		let numberComplete = number[1];
		const digitCorrelative = number[0].length === 6 ? 9 : 8;
		while (numberComplete && number[0] && numberComplete.length < digitCorrelative) {
			numberComplete = `0${numberComplete}`;
		}
		return numberComplete ? `${number[0]}-${numberComplete}` : this.reference;
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

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[amortizations(selectColumns).[typePayment(selectColumns), bankAccount(selectColumns), employee(selectColumns), transaction(selectColumns), transactionBank(selectColumns), customer(selectColumns), module(selectColumns), supplier(selectColumns)], amortizationDocuments(selectColumns).[typePayment(selectColumns), amortization(selectColumns)], module(selectColumns), subsidiary(selectColumns), customer(selectColumns), employee(selectColumns), typeTransaction(selectColumns)]')
			.modifyEager('amortizationDocuments', (builder) => {
				builder
					.innerJoin(
						'ca_amortizations',
						'ca_amortizations.id',
						'ca_amortizations_details.amortization_id',
					)
					.whereNull('ca_amortizations.document_account_status_id')
					.whereRaw('ca_amortizations_details.amount > 0');
			})
			.where('company_id', companyId)
			.skipUndefined()
			.whereIn('status', filter.status)
			.skipUndefined()
			.where('module_id', filter.moduleId)
			.skipUndefined()
			.where('customer_id', filter.customerId)
			.skipUndefined()
			.where('supplier_id', filter.supplierId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('type_transaction_id', filter.typeTransactionId)
			.skipUndefined()
			.where('pur_document_annex_id', filter.purDocumentAnnexId)
			.skipUndefined()
			.where('currency', filter.currency);

		if (filter.entityStateId) {
			query.where('entity_state_id', filter.entityStateId);
		}

		if (filter.modulesId) {
			query.whereIn('module_id', filter.modulesId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.emission_date) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.emission_date) <= ?`, filter.endDate);
		}

		if (filter.search) {
			const fields = ['document_number', 'currency', 'description', 'concept', 'reference'].map(i => `${this.tableName}.${i}`);
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

	static processTypeTransactionId({ comCountryId, typeDocumentCode }) {
		let typeTransactionId = typeTransactionDefault.perBol;
		if (comCountryId === country.peru) {
			if (typeDocumentCode === 'FAC') {
				typeTransactionId = typeTransactionDefault.perFac;
			} else {
				typeTransactionId = typeTransactionDefault.perBol;
			}
		} else if (comCountryId === country.ecuador) {
			typeTransactionId = typeTransactionDefault.ecuFac;
		} else if (comCountryId === country.colombia) {
			typeTransactionId = typeTransactionDefault.colFac;
		}
		return typeTransactionId;
	}

	static processDocumentAccountStatus({
		data, comCountryId, typeDocumentCode, expirationDate,
	}) {
		const documentAccountStatus = {
			customerId: data.customerId || null,
			supplierId: data.supplierId || null,
			moduleId: data.moduleId,
			subsidiaryId: data.subsidiaryId,
			warehouseId: data.warehouseId,
			employeeId: data.employeeId || data.userId,
			documentNumber: data.documentNumber,
			dueAmount: 0,
			currency: data.currency,
			amount: data.amount,
			description: data.description,
			emissionDate: data.emissionDate,
			receptionDate: data.emissionDate,
			reference: data.documentNumber,
			companyId: data.companyId,
			expirationDate,
			concept: data.description,
			purDocumentId: data.purDocumentId || null,
			saleDocumentId: data.documentId || null,
			typeTransactionId: this.processTypeTransactionId({ comCountryId, typeDocumentCode }),
		};
		if (data.totalWithholdingTax) {
			documentAccountStatus.amount = data.amount + data.totalWithholdingTax;
			documentAccountStatus.dueAmount = data.totalWithholdingTax;
			documentAccountStatus.amortizations = [
				{
					moduleId: documentAccountStatus.moduleId,
					comEmployeeId: documentAccountStatus.employeeId,
					supplierId: documentAccountStatus.supplierId,
					amount: -data.totalWithholdingTax,
					currency: documentAccountStatus.currency,
					typePaymentId: data.typePaymentId,
					typeAmortization: 1,
					typeTransaction: 1,
					companyId: documentAccountStatus.companyId,
					subsidiaryId: documentAccountStatus.subsidiaryId,
					warehouseId: documentAccountStatus.warehouseId,
					observations: `Transacción de retención compra a crédito ${
						documentAccountStatus.documentNumber
					} por ${data.currency} ${documentAccountStatus.amount}`,
					amortizationDetails: [
						{
							purDocumentId: documentAccountStatus.purDocumentId,
							typePaymentId: data.typePaymentId,
							employeeId: documentAccountStatus.employeeId,
							amount: -data.totalWithholdingTax,
							paymentDate: documentAccountStatus.emissionDate,
							observations: `Transacción de retención compra a crédito ${
								documentAccountStatus.documentNumber
							} por ${data.currency} ${documentAccountStatus.amount}`,
							companyId: documentAccountStatus.companyId,
						},
					],
				},
			];
		}
		return documentAccountStatus;
	}

	static create(data, trx) {
		return this.query(trx).insertGraph(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[amortizations(selectColumns).[typePayment(selectColumns), bankAccount(selectColumns), employee(selectColumns), transaction(selectColumns), transactionBank(selectColumns), customer(selectColumns), module(selectColumns), supplier(selectColumns)], module(selectColumns), subsidiary(selectColumns), customer(selectColumns), supplier(selectColumns), employee(selectColumns), typeTransaction(selectColumns)]')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getByIdSimple(id, companyId, saleDocumentId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[amortizations(selectColumns), amortizationDocuments(selectColumns)]')
			.modifyEager('amortizationDocuments', (builder) => {
				builder
					.innerJoin(
						'ca_amortizations',
						'ca_amortizations.id',
						'ca_amortizations_details.amortization_id',
					)
					.whereNull('ca_amortizations.document_account_status_id');
			})
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.where('sale_document_id', saleDocumentId)
			.where('company_id', companyId)
			.first();
	}

	static getByIds(ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[amortizations(selectColumns), amortizationDocuments(selectColumns)]')
			.modifyEager('amortizationDocuments', (builder) => {
				builder
					.innerJoin(
						'ca_amortizations',
						'ca_amortizations.id',
						'ca_amortizations_details.amortization_id',
					)
					.whereNull('ca_amortizations.document_account_status_id');
			})
			.whereIn('id', ids)
			.where('status', '!=', PaymentState.payOut)
			.where('company_id', companyId);
	}

	static getByAccessKey(accessKey, companyId, trx) {
		return this.query(trx)
			.select(this.defaultColumns())
			.where('access_key', accessKey)
			.where('company_id', companyId)
			.first();
	}

	static getByDocument(saleDocumentId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager(
				'[customer(selectColumns), saleDocument(selectColumns), customer(selectColumns), supplier(selectColumns)]',
				{
					orderByExpirationDate: (builder) => {
						builder.orderBy('expiration_date');
					},
				},
			)
			.where('sale_document_id', saleDocumentId)
			.where('company_id', companyId)
			.first();
	}

	static getByDocumentSimple({ saleDocumentId, purDocumentId }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('sale_document_id', saleDocumentId)
			.skipUndefined()
			.where('pur_document_id', purDocumentId)
			.where('company_id', companyId)
			.first();
	}

	static editByDocument({ saleDocumentId, purDocumentId, data }, companyId) {
		return this.query()
			.patch(data)
			.skipUndefined()
			.where('sale_document_id', saleDocumentId)
			.skipUndefined()
			.where('pur_document_id', purDocumentId)
			.where('status', '!=', 3)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editPaymentStatus({
		id, field, data, companyId,
	}, trx) {
		return this.query(trx)
			.patch(data)
			.where(field, id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static editMultiple(data, trx) {
		const options = {
			noDelete: true,
			unrelate: false,
		};
		return this.query(trx).upsertGraph(data, options);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getReport(companyId, filter = {}) {
		const salesColumns = ['document_number'].map(c => `${this.tableName}.${c}`);
		const colummsCustomers = ['c.rz_social'];
		const columns = salesColumns.concat(colummsCustomers);

		let query = this.query()
			.select(columns)
			.innerJoin('com_customers as c', 'c.id', `${this.tableName}.customer_id`)
			.where('company_id', companyId)
			.skipUndefined()
			.where('module_id', filter.moduleId)
			.skipUndefined()
			.where('customer_id', filter.customerId)
			.skipUndefined()
			.where('supplier_id', filter.supplierId)
			.skipUndefined()
			.where('type_transaction_id', filter.typeTransactionId);
		if (filter.currency) {
			query.where('currency', filter.currency);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getTotalAmount(companyId, filter = {}) {
		let query = this.query()
			.select(raw('SUM(amount) AS totalAmount'))
			.where('company_id', companyId)
			.skipUndefined()
			.where('module_id', filter.moduleId)
			.skipUndefined()
			.where('customer_id', filter.customerId)
			.skipUndefined()
			.where('supplier_id', filter.supplierId)
			.skipUndefined()
			.where('type_transaction_id', filter.typeTransactionId);
		if (filter.currency) {
			query.where('currency', filter.currency);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static removeByDocument(purDocumentId, companyId) {
		return this.query()
			.softDelete()
			.where('company_id', companyId)
			.where('pur_document_id', purDocumentId);
	}
}

module.exports = DocumentAccountStatus;
