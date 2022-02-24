'use strict';

const { Model, raw, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const EntityStateCode = require('./EntityStateCode');
const PaymentState = require('./PaymentState');
const Sales = require('./Sales');
const DocumentAccountStatus = require('./DocumentAccountStatus');

class AmortizationDetails extends baseModel {
	static get tableName() {
		return 'ca_amortizations_details';
	}

	static get relationMappings() {
		const relation = {
			checkingAccount: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/CaDocuments.js`,
				join: {
					from: 'ca_amortizations_details.ca_document_id',
					to: 'ca_documents.id',
				},
			},
			sale: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'ca_amortizations_details.sal_document_id',
					to: 'sal_documents.id',
				},
			},
			purchase: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Purchases.js`,
				join: {
					from: 'ca_amortizations_details.pur_document_id',
					to: 'pur_documents.id',
				},
			},
			typePayment: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'ca_amortizations_details.type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
			amortization: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Amortization.js`,
				join: {
					from: 'ca_amortizations_details.amortization_id',
					to: 'ca_amortizations.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [
				'companyId',
				'employeeId',
				'amount',
				'paymentDate',
				'typePaymentId',
				'amortizationId',
			],
			properties: {
				amount: {
					type: 'decimal',
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				caDocumentId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: 'integer',
				},
				observations: {
					type: 'string',
				},
				paymentDate: {
					type: ['string', 'datetime'],
				},
				salDocumentId: {
					type: ['integer', 'null'],
				},
				typePaymentId: {
					type: 'integer',
				},
				caDocumentDetailId: {
					type: ['integer', 'null'],
				},
				amortizationId: {
					type: 'integer',
				},
				purDocumentId: {
					type: ['integer', 'null'],
				},
				documentAccountStatusId: {
					type: ['integer', 'null'],
				},
				dataAudit: {
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

	static get virtualAttributes() {
		return ['lastBalanceAmount', 'stateAccountingCode', 'stateConciliationCode'];
	}

	get lastBalanceAmount() {
		const saleAmount = (this.sale && this.sale.amount) || 0;
		const saleDueAmount = (this.sale && this.sale.amount) || 0;
		const amount = this.amount || 0;
		const total = amount + (saleAmount - saleDueAmount);
		return total;
	}

	get stateAccountingCode() {
		let code = 'SCt.';
		if (this.amortization && (this.amortization.transaction || this.amortization.transactionBank)) {
			const { transaction: trn, transactionBank } = this.amortization;
			code = trn && trn.entityStateId === EntityStateCode.accounted ? 'Ct.' : code;
			code =
				transactionBank && transactionBank.entityStateId === EntityStateCode.accounted
					? 'Ct.'
					: code;
		}
		return code;
	}

	get stateConciliationCode() {
		let code = 'SC';
		if (this.amortization && this.amortization.transactionBank) {
			const { transactionBank } = this.amortization;
			code = transactionBank && transactionBank.bankReconcilementId ? 'C' : code;
		}
		return code;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'amount',
			'bank_account_id',
			'ca_document_id',
			'ca_document_detail_id',
			'id',
			'employee_id',
			'observations',
			'payment_date',
			'sal_document_id',
			'type_payment_id',
			'amortization_id',
			'pur_document_id',
			'document_account_status_id',
			'data_audit',
			'created_at',
			'updated_at',
			'flag_active',
		].map(c => raw(`ANY_VALUE(${this.tableName}.${c}) as ${c}`));
		return columns.concat(otherColumns);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static removeByPurDocument(purDocumentId, companyId) {
		return this.query()
			.softDelete()
			.where('pur_document_id', purDocumentId)
			.where('company_id', companyId);
	}

	static edit({ id, data }, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editByDocumentId({ salDocumentId, purDocumentId, data }, companyId) {
		return this.query()
			.patch(data)
			.skipUndefined()
			.where('sal_document_id', salDocumentId)
			.skipUndefined()
			.where('pur_document_id', purDocumentId)
			.where('company_id', companyId);
	}

	static unlinkTransaction({
		amortizationDetail, documentAccountStatus, employee, companyId,
	}) {
		try {
			const knex = AmortizationDetails.knex();
			const txResult = transaction(knex, () =>
				this.query()
					.upsertGraph(
						{
							id: amortizationDetail.id,
							flagActive: false,
							dataAudit: {
								lastUserModified: employee.name,
								userDeleted: employee.name,
								dateDeleted: helper.localDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
							},
							amortization: {
								id: amortizationDetail.amortization.id,
								flagActive: false,
							},
						},
						{
							noDelete: true,
							unrelate: false,
						},
					)
					.then(() => {
						const newDueAmount = amortizationDetail.sale.dueAmount - amortizationDetail.amount;
						return Sales.editDueAmount(
							amortizationDetail.sale.id,
							{
								dueAmount: newDueAmount,
								paymentState: newDueAmount > 0 ? PaymentState.partial : PaymentState.pending,
							},
							companyId,
						);
					})
					.then(() => {
						const newDueAmount = documentAccountStatus.dueAmount - amortizationDetail.amount;
						const editPaymentStatus = {
							id: amortizationDetail.sale.id,
							field: 'sale_document_id',
							data: {
								status: newDueAmount > 0 ? PaymentState.partial : PaymentState.pending,
								dueAmount: newDueAmount,
							},
							companyId,
						};
						return DocumentAccountStatus.editPaymentStatus(editPaymentStatus);
					}));

			return txResult
				.then(response => Promise.resolve(response))
				.catch(error => Promise.reject(error));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[amortization(selectColumns).[employee(selectColumns), transaction(selectColumns), transactionBank(selectColumns)], typePayment(selectColumns), sale(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('flag_active', 1)
			.findById(id);
	}

	static getBySaleDocument(saleDocumentId, companyId) {
		return this.query()
			.eager('[amortization(selectColumns).[employee(selectColumns), transaction(selectColumns), transactionBank(selectColumns)], typePayment(selectColumns)]')
			.select(this.defaultColumns())
			.where('sal_document_id', saleDocumentId)
			.where('company_id', companyId);
	}

	static getByPurchaseDocument(purDocumentId, companyId) {
		return this.query()
			.eager('amortization(selectColumns)')
			.select(this.defaultColumns())
			.where('pur_document_id', purDocumentId)
			.where('company_id', companyId);
	}

	static getAllAmountTotal(filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(raw('SUM(ca_amortizations_details.amount) AS totalPayment'))
			.join('sal_documents as s', 's.id', `${this.tableName}.sal_document_id`)
			.join('com_ms_type_payments as cp', 'cp.id', `${this.tableName}.type_payment_id`)
			.join('ca_amortizations as cm', 'cm.id', `${this.tableName}.amortization_id`)
			.join('com_customers as cc', 'cc.id', 'cm.customer_id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where('cm.module_id', filter.moduleId)
			.skipUndefined()
			.where('cm.type_amortization', filter.typeAmoritzation)
			.skipUndefined()
			.where('cm.currency', filter.currency)
			.skipUndefined()
			.where('cm.com_employee_id', filter.comEmployeeId)
			.skipUndefined()
			.where('cm.type_payment_id', filter.typePaymentId)
			.skipUndefined()
			.where('cm.customer_id', filter.customerId)
			.skipUndefined()
			.where('cm.document_account_status_id', filter.documentAccountStatus);

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (search) {
			query = this.match(query, search);
		}
		return query;
	}
	static async getCollectionReportpdf(filter = {}, companyId) {
		const { search } = filter;
		const columAmortization = ['created_at', 'amount'].map(c => `${this.tableName}.${c}`);
		const customerColums = ['s.expirated_at', 'cp.code', 's.document_number', 'cc.name'];
		const columns = columAmortization.concat(customerColums);
		let query = this.query()
			.select(columns)
			.join('sal_documents as s', 's.id', `${this.tableName}.sal_document_id`)
			.join('com_ms_type_payments as cp', 'cp.id', `${this.tableName}.type_payment_id`)
			.join('ca_amortizations as cm', 'cm.id', `${this.tableName}.amortization_id`)
			.join('com_customers as cc', 'cc.id', 'cm.customer_id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where('cm.module_id', filter.moduleId)
			.skipUndefined()
			.where('cm.type_amortization', filter.typeAmoritzation)
			.skipUndefined()
			.where('cm.currency', filter.currency)
			.skipUndefined()
			.where('cm.com_employee_id', filter.comEmployeeId)
			.skipUndefined()
			.where('cm.type_payment_id', filter.typePaymentId)
			.skipUndefined()
			.where('cm.customer_id', filter.customerId)
			.skipUndefined()
			.where('cm.document_account_status_id', filter.documentAccountStatus);

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (search) {
			query = this.match(query, search);
		}
		const data = await query;
		const totalsData = await this.getAllAmountTotal(filter, companyId);
		const concatData = data.concat(totalsData);
		return concatData;
	}
}

module.exports = AmortizationDetails;
