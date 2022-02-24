'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class TypeDocument extends baseModel {
	static get tableName() {
		return 'sal_type_documents';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comTypeDocumentId', 'comCompanyId'],
			properties: {
				comTypeDocumentId: {
					type: 'integer',
				},
				comCompanyId: {
					type: 'integer',
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static getAll(filter = {}, companyId, flagType) {
		let query = this.query()
			.select('com_type_document_id', 'com_company_id', 'additional_information')
			.eager('[documentType(documentTypeData)]')
			.where('com_company_id', companyId)
			.innerJoin(
				'com_ms_type_documents',
				'com_ms_type_documents.id',
				`${this.tableName}.com_type_document_id`,
			)
			.skipUndefined()
			.where('com_ms_type_documents.flag_type', flagType)
			.skipUndefined()
			.where('com_ms_type_documents.include_in_list', filter.includeInList)
			.skipUndefined()
			.where('com_ms_type_documents.com_country_id', filter.countryId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static get relationMappings() {
		const relation = {
			documentType: {
				relation: baseModel.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypeDocument.js`,
				join: {
					from: 'sal_type_documents.com_type_document_id',
					to: 'com_ms_type_documents.id',
				},
			},
		};
		return relation;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static editMultiple(ids, data, companyId) {
		return this.query()
			.patch(data)
			.withArchived(true)
			.where('com_company_id', companyId)
			.whereIn('com_type_document_id', ids);
	}

	static removeIds(ids, companyId) {
		return this.query()
			.softDelete()
			.whereNotIn('com_type_document_id', ids)
			.where('com_company_id', companyId);
	}
}

module.exports = TypeDocument;
