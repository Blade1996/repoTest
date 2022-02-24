'use strict';

const { raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const { gateway } = require('../process-integration/type-integrations-enum.js');

class IntegrationSubsidiary extends baseModel {
	static get tableName() {
		return 'com_integration_subsidiaries';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['integrationId', 'subsidiaryId'],
			properties: {
				integrationCode: {
					type: ['string', 'null'],
				},
				integrationId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				flagEdit: {
					type: ['integer', 'boolean', 'null'],
				},
				flagCustomizer: {
					type: ['integer', 'boolean', 'null'],
				},
				flagInternal: {
					type: ['integer', 'boolean', 'null'],
				},
				flagPayment: {
					type: ['integer', 'boolean', 'null'],
				},
				flagAppPrsActive: {
					type: ['integer', 'boolean', 'null'],
				},
				additionalInformation: {
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'integration_code',
			'integration_id',
			'subsidiary_id',
			'flag_edit',
			'flag_customizer',
			'flag_internal',
			'flag_payment',
			'additional_information',
			'company_id',
			'flag_active',
			'flag_app_prs_active',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('integration_id', filter.integrationId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.where('company_id', companyId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllBasic(filter = {}, companyId) {
		let query = this.query()
			.select('integration_code', 'flag_customizer')
			.skipUndefined()
			.where('integration_id', filter.integrationId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.where('company_id', companyId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getListActive({ companyId, subsidiaryId, typeIntegrationCode = gateway }) {
		return this.query()
			.select(raw('com_integration_subsidiaries.integration_id as id, com_integration_subsidiaries.flag_active as flagActive, com_integrations.code_category as codeCategory, com_integrations.url_image as urlImage, com_integrations.name as name, com_integrations.code as code'))
			.innerJoin(
				'com_integrations',
				'com_integrations.id',
				'com_integration_subsidiaries.integration_id',
			)
			.where('com_integration_subsidiaries.subsidiary_id', subsidiaryId)
			.where('com_integration_subsidiaries.company_id', companyId)
			.where('com_integration_subsidiaries.integration_code', typeIntegrationCode)
			.where('com_integration_subsidiaries.flag_active', true);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getByCode({ code }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('integration_code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getByCompanyId(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
	}

	static editMultiple(data) {
		return this.query().upsertGraph(data, {
			noDelete: true,
			unrelate: false,
		});
	}

	static editFlagActive(id, { flagActive, companyId }) {
		return this.query()
			.patch({ flagActive })
			.where('id', id)
			.where('company_id', companyId);
	}

	static editSimple(id, data, companyId) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static findByIntegrationId(subsidiaryId, companyId, codeCategory, integrationsCode, flagActive) {
		return this.query()
			.select(this.defaultColumns(['com_integrations.config']))
			.innerJoin(
				'com_integrations',
				'com_integrations.id',
				'com_integration_subsidiaries.integration_id',
			)
			.where('com_integration_subsidiaries.subsidiary_id', subsidiaryId)
			.where('com_integration_subsidiaries.company_id', companyId)
			.skipUndefined()
			.where('com_integration_subsidiaries.flag_active', flagActive)
			.skipUndefined()
			.where('com_integrations.code_category', codeCategory)
			.skipUndefined()
			.where('com_integrations.code', integrationsCode)
			.first();
	}
}

module.exports = IntegrationSubsidiary;
