'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PurDocumentsAnnexDetails extends baseModel {
	static get tableName() {
		return 'pur_documents_annex_details';
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['accessKey', 'purDocumentAnnexId', 'companyId'],
			properties: {
				documentsRelated: {
					type: ['object', 'null'],
					default: {},
				},
				accessKey: {
					type: ['string', 'null'],
				},
				purDocumentAnnexId: {
					type: ['integer', 'null'],
				},
				companyId: {
					type: ['integer', 'null'],
				},
				detailsErrors: {
					type: ['string', 'null'],
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
		const columns = [
			'id',
			'access_key',
			'pur_document_annex_id',
			'company_id',
			'documents_related',
			'flag_active',
		];
		return columns.concat(otherColumns);
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('access_key', filter.accessKey)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('pur_document_annex_id', filter.purDocumentAnnexId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByAnnexId(companyId, purDocumentAnnexId) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('pur_document_annex_id', purDocumentAnnexId);
		return query;
	}

	static getByAccessKey(accessKey, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('access_key', accessKey)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data, options, trx) {
		return this.query(trx).upsertGraph(data, options);
	}

	static edit(id, data, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id);
	}

	static remove(id, trx) {
		return this.query(trx)
			.softDelete()
			.where('id', id);
	}
}
module.exports = PurDocumentsAnnexDetails;
