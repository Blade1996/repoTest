'use strict';

const jsReport = require('jsreport-client')(process.env.JSREPORT_URL);
const handlebars = require('handlebars');
const baseModel = require('./base');
const helper = require('./helper');

class CompanyReport extends baseModel {
	static get tableName() {
		return 'com_companies_templates';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code', 'template', 'companyId'],
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
				msTemplateId: {
					type: 'integer',
				},
				image: {
					type: ['string', 'null'],
				},
				countryId: {
					type: 'integer',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'recipe',
			'company_id',
			'code',
			'name',
			'template',
			'type_document_id',
			'flag_active',
			'created_at',
			'updated_at',
			'ms_template_id',
			'image',
			'country_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static render(data, reportInfo) {
		const promise = new Promise((resolve, reject) => {
			jsReport.render(
				{
					data,
					template: {
						engine: 'handlebars',
						recipe: reportInfo.recipe,
						content: reportInfo.template,
					},
				},
				(err, response) => {
					if (err) {
						return reject(err);
					}
					return response.body(fileContent => resolve(fileContent));
				},
			);
		});
		return promise;
	}

	static async generateReport(report, data) {
		try {
			const reportResult = await this.render(data, report);
			return reportResult;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static renderHtml(report, data) {
		const template = handlebars.compile(report.template);
		return template(data);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);

		if (filter.flagTemplate) {
			query.whereRaw('type_document_id IS NOT NULL');
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByIdOrCode(companyId, code, companyTemplateId, typeDocument, countryId) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('id', companyTemplateId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('recipe', typeDocument)
			.first();
		if (countryId === 2) {
			query.where('country_id', countryId);
		}
		return query;
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getById(id, companyId, field = 'id') {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.${field}`, id)
			.where('company_id', companyId)
			.first();
	}

	static editTemplate(id, { template }, companyId) {
		return this.query()
			.patch({ template })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByCodes(companyId, codes) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', codes)
			.whereNotNull('ms_template_id')
			.where('company_id', companyId);
	}
}

module.exports = CompanyReport;
