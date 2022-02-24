'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class MsTemplates extends baseModel {
	static get tableName() {
		return 'ms_templates';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code', 'template', 'type_document_id'],
			properties: {
				companyId: {
					type: 'integer',
				},
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				template: {
					type: 'string',
				},
				typeDocumentId: {
					type: 'integer',
				},
				countryId: {
					type: ['integer', 'null'],
				},
				flagReport: {
					type: ['boolean', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
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
		let columns = [
			'id',
			'recipe',
			'type_document_id',
			'code',
			'name',
			'template',
			'country_id',
			'flag_active',
			'created_at',
			'updated_at',
			'flag_report',
			'additional_information',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get relationMappings() {
		return {
			reportTemplate: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CompanyReport.js`,
				join: {
					from: 'ms_templates.id',
					to: 'com_companies_templates.ms_template_id',
				},
			},
		};
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getAll(filter = {}, typeDocumentId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('type_document_id', typeDocumentId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id, typeDocumentId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('type_document_id', typeDocumentId);
	}

	static getTemplatesDefault(countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_default', true)
			.where('country_id', countryId);
	}

	static getByCodes(codes, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('country_id', countryId)
			.whereIn('code', codes);
	}

	static getByTemplatesCompany(companyId, filter = {}, countryId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[reportTemplate(selectColumns)]')
			.modifyEager('reportTemplate', (builder) => {
				builder.where('com_companies_templates.company_id', companyId);
			})
			.where('country_id', countryId)
			.where('flag_report', 1);
		if (filter.search) {
			query.where(builder =>
				builder
					.orWhere('code', 'like', `%${filter.search}%`)
					.orWhere('name', 'like', `%${filter.search}%`));
		}
		return query;
	}
}

module.exports = MsTemplates;
