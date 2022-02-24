'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const PaymentState = require('./PaymentState');
const format = require('date-fns/format');

class CaDocumentsDetails extends baseModel {
	static get tableName() {
		return 'ca_documents_details';
	}

	static get relationMappings() {
		const relation = {
			caDocuments: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/CaDocuments.js`,
				join: {
					from: 'ca_documents_details.cc_document_id',
					to: 'ca_documents.document_id',
				},
			},
			typePayment: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'ca_documents_details.type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'ccDocumentId', 'amount', 'amountPayment', 'expirationDate'],
			properties: {
				companyId: {
					type: 'integer',
				},
				ccDocumentId: {
					type: 'integer',
				},
				typePaymentId: {
					type: 'integer',
				},
				status: {
					type: 'integer',
				},
				amount: {
					type: 'decimal',
				},
				amountPayment: {
					type: 'decimal',
				},
				expirationDate: {
					type: 'datetime',
				},
				number: {
					type: ['integer', 'null'],
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'cc_document_id',
			'amount',
			'amount_payment',
			'expiration_date',
			'type_payment_id',
			'status',
			'created_at',
			'number',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['statusName', 'localDate'];
	}

	get localDate() {
		return {
			expirationDate: format(new Date(this.expirationDate), 'YYYY-MM-DD'),
		};
	}

	get statusName() {
		let name;
		if (this.status === PaymentState.pending) {
			name = 'Pendiente';
		} else if (this.status === PaymentState.partial) {
			name = 'Parcial';
		} else if (this.status === PaymentState.payOut) {
			name = 'Pagado';
		}
		return name;
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = CaDocumentsDetails;
