'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class TemplateTaxes extends baseModel {
	static get tableName() {
		return 'com_template_taxes';
	}

	static get relationMappings() {
		const relation = {
			documentType: {
				relation: baseModel.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypeDocument.js`,
				join: {
					from: 'com_template_taxes.type_document_id',
					to: 'com_ms_type_documents.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId'],
			properties: {
				typeDocumentId: {
					type: 'integer',
				},
				companyId: {
					type: 'integer',
				},
				template: {
					type: ['object', 'null'],
				},
				status: {
					type: ['integer', 'null'],
					default: 1,
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = ['type_document_id', 'company_id', 'template', 'status'];
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[documentType(documentTypeData)]')
			.skipUndefined()
			.where('type_document_id', filter.typeDocumentId)
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = TemplateTaxes;
