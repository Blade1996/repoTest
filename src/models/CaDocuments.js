'use strict';

const { Model, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const { payOut } = require('./PaymentState');
const DocumentAccountStatus = require('./DocumentAccountStatus');

class CaDocuments extends baseModel {
	static get tableName() {
		return 'ca_documents';
	}

	static get relationMappings() {
		const relation = {
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CaDocumentsDetails.js`,
				join: {
					from: 'ca_documents.id',
					to: 'ca_documents_details.cc_document_id',
				},
			},
			saleDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'ca_documents.document_id',
					to: 'sal_documents.id',
				},
			},
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'ca_documents.module_id',
					to: 'com_module.id',
				},
			},
			purchaseDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Purchases.js`,
				join: {
					from: 'ca_documents.pur_document_id',
					to: 'pur_documents.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'employeeId', 'userId', 'amount', 'type'],
			properties: {
				companyId: {
					type: 'integer',
				},
				documentId: {
					type: 'integer',
				},
				employeeId: {
					type: 'integer',
				},
				userId: {
					type: 'integer',
				},
				amount: {
					type: 'decimal',
				},
				expirationDate: {
					type: 'date',
				},
				type: {
					type: 'integer',
				},
				status: {
					type: 'integer',
				},
				description: {
					type: 'text',
				},
				moduleId: {
					type: ['integer', 'null'],
				},
				purDocumentId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'amount',
			'document_id',
			'employee_id',
			'user_id',
			'expiration_date',
			'type',
			'module_id',
			'pur_document_id',
			'status',
			'description',
			'additional_information',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['statusName'];
	}

	get statusName() {
		let name;
		if (this.status === 1) {
			name = 'Pendiente';
		} else if (this.status === 2) {
			name = 'Parcial';
		} else if (this.status === 3) {
			name = 'Pagado';
		}
		return name;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns, orderByExpirationDate)', {
				orderByExpirationDate: (builder) => {
					builder.orderBy('expiration_date');
				},
			})
			.where('company_id', companyId)
			.skipUndefined()
			.where('module_id', filter.moduleId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByIds(companyId, ids, validSale) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[details(selectColumns), saleDocument(selectColumns).typeDocument(documentTypeData), purchaseDocument(selectColumns).typeDocument(documentTypeData)]')
			.where('company_id', companyId)
			.whereIn('id', ids);

		if (validSale) {
			query.modifyEager('saleDocument', (builder) => {
				builder.where('sal_documents.payment_state', '!=', payOut);
			});
		}
		return query;
	}

	static getAllByDocumentId(companyId, filter = {}, documentIds) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns)')
			.where('company_id', companyId)
			.whereIn('document_id', documentIds)
			.orderBy('expiration_date');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllByPurchaseDocumentId(companyId, filter = {}, documentIds) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns)')
			.where('company_id', companyId)
			.whereIn('pur_document_id', documentIds)
			.orderBy('expiration_date');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns)')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getByDocument(documentId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager(
				'[details(selectColumns, orderByExpirationDate).typePayment(selectColumns), saleDocument(selectColumns)]',
				{
					orderByExpirationDate: (builder) => {
						builder.orderBy('expiration_date');
					},
				},
			)
			.where('document_id', documentId)
			.where('company_id', companyId)
			.first();
	}

	static getByPurchaseDocument(documentId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[details(selectColumns).typePayment(selectColumns), purchaseDocument(selectColumns)]')
			.where('pur_document_id', documentId)
			.where('company_id', companyId)
			.first();
	}

	static create(data) {
		const newData = data;
		newData.status = 1;
		newData.details = newData.details.map((item) => {
			const newItem = item;
			newItem.status = 1;
			newItem.companyId = newData.companyId;
			return newItem;
		});
		const knex = CaDocuments.knex();
		return transaction(knex, trx => CaDocuments.query(trx).insertGraph(newData));
	}

	async $afterInsert(queryContext) {
		try {
			if (this.additionalInformation) {
				const { comCountryId, typeDocumentCode } = this.additionalInformation;
				const payload = DocumentAccountStatus.processDocumentAccountStatus({
					data: { ...this, ...this.additionalInformation },
					comCountryId,
					typeDocumentCode,
					expirationDate: this.expirationDate,
				});
				return Promise.resolve(DocumentAccountStatus.create(payload, queryContext.transaction));
			}
			return this;
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

	static removeByPurDocument(purDocumentId, companyId) {
		return this.query()
			.softDelete()
			.where('pur_document_id', purDocumentId)
			.where('company_id', companyId);
	}
}

module.exports = CaDocuments;
