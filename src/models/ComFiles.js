'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class ComFiles extends baseModel {
	static get tableName() {
		return 'com_files';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['codeTable', 'registerId', 'urlFile'],
			properties: {
				codeTable: {
					type: ['string', 'null'],
				},
				registerId: {
					type: ['integer', 'null'],
				},
				purDocumentAnnexId: {
					type: ['integer', 'null'],
				},
				urlFile: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['autocomplete'];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'code_table',
			'register_id',
			'pur_document_annex_id',
			'url_file',
			'description',
			'created_at',
		];
		return columns.concat(otherColumns);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('company_id', companyId)
			.where('id', id);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('company_id', companyId)
			.where('id', id);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}
}

module.exports = ComFiles;
