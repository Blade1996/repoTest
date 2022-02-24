'use strict';

const { Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ProcessTypeIntegration extends baseModel {
	static get tableName() {
		return 'com_process_type_integrations';
	}

	static get relationMappings() {
		return {
			typeIntegration: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Integration.js`,
				join: {
					from: 'com_process_type_integrations.type_integration_id',
					to: 'com_integrations.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['typeIntegrationId', 'processId', 'subsidiaryId', 'companyId'],
			properties: {
				typeIntegrationCode: {
					type: ['string', 'null'],
				},
				typeIntegrationId: {
					type: ['integer', 'null'],
				},
				processId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				configTypeIntegration: {
					type: ['array', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				config: {
					type: ['array', 'null'],
				},
				flagActive: {
					type: ['integer', 'boolean', 'null'],
					default: true,
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

	static defaultColumns(columns = []) {
		return [
			'id',
			'type_integration_code',
			'type_integration_id',
			'process_id',
			'subsidiary_id',
			'config_type_integration',
			'additional_information',
		].concat(columns);
	}

	static get virtualAttributes() {
		return ['typeNotNames'];
	}

	get typeNotNames() {
		let typeNotNames = [];
		if (Array.isArray(this.configTypeIntegration) && this.configTypeIntegration.length > 0) {
			typeNotNames = this.configTypeIntegration.map(i => i.name);
		}
		return typeNotNames;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[typeIntegration(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, { companyId, subsidiaryId }) {
		return this.query()
			.eager('[typeIntegration(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('subsidiary_id', subsidiaryId)
			.where('company_id', companyId)
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getByCode({ typeIntegrationCode, subsidiaryId, processId }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('type_integration_code', typeIntegrationCode)
			.skipUndefined()
			.where('subsidiary_id', subsidiaryId)
			.skipUndefined()
			.where('process_id', processId)
			.where('company_id', companyId)
			.first();
	}

	static getConfigSync({ companyId, subsidiaryId, typeIntegrationCode = 'TIE' }) {
		return this.query()
			.select(raw('com_process_type_integrations.config_type_integration as config, com_subsidiaries.subsidiary_acl_code as subsidiaryAclCode, com_subsidiaries.ruc as ruc, com_integration_subsidiaries.additional_information as additionalInformation'))
			.innerJoin('com_process', 'com_process.id', 'com_process_type_integrations.process_id')
			.innerJoin(
				'com_subsidiaries',
				'com_subsidiaries.id',
				'com_process_type_integrations.subsidiary_id',
			)
			.innerJoin(raw('com_integration_subsidiaries on com_integration_subsidiaries.subsidiary_id = com_process_type_integrations.subsidiary_id and com_process_type_integrations.type_integration_code = com_integration_subsidiaries.integration_code and com_integration_subsidiaries.flag_app_prs_active = 1 and com_process_type_integrations.deleted_at IS NULL'))
			.where('com_process.company_id', companyId)
			.where('com_process_type_integrations.subsidiary_id', subsidiaryId)
			.where('com_process_type_integrations.type_integration_code', typeIntegrationCode)
			.where('com_process_type_integrations.flag_active', 1)
			.whereNull('com_process_type_integrations.deleted_at')
			.where('com_process.code', 'SYNC_REGISTERS')
			.first();
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

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = ProcessTypeIntegration;
