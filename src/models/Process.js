'use strict';

const { isDevOrProd } = require('../shared/helper');
const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const simpleAxios = require('./../api/shared/simple-axios');
const ProcessTypeIntegration = require('./ProcessTypeIntegration');

class Process extends baseModel {
	static get tableName() {
		return 'com_process';
	}

	static get relationMappings() {
		return {
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'com_process.module_id',
					to: 'com_module.id',
				},
			},
			processTypeIntegration: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ProcessTypeIntegration.js`,
				join: {
					from: 'com_process.id',
					to: 'com_process_type_integrations.process_id',
				},
			},
			processTypeIntegrations: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ProcessTypeIntegration.js`,
				join: {
					from: 'com_process.id',
					to: 'com_process_type_integrations.process_id',
				},
			},
			typeProcess: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TypeProcess.js`,
				join: {
					from: 'com_process.type_process_id',
					to: 'type_process.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'companyId'],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				moduleId: {
					type: ['integer', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				ambit: {
					type: ['string', 'null'],
				},
				typeNotNames: {
					type: ['array', 'null'],
				},
				typeNot: {
					type: ['array', 'null'],
				},
				processId: {
					type: ['integer', 'null'],
				},
				typeEntity: {
					type: ['integer', 'null'],
				},
				config: {
					type: ['object', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				flagInternal: {
					type: ['boolean', 'integer', 'null'],
				},
				flagEdit: {
					type: ['boolean', 'integer', 'null'],
				},
				categoryId: {
					type: ['integer', 'null'],
				},
				codeCategory: {
					type: ['string', 'null'],
				},
				typeProcessId: {
					type: ['integer', 'null'],
				},
				codeTemplateDefault: {
					type: ['array', 'null'],
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
			'code',
			'name',
			'module_id',
			'ambit',
			'type_not_names',
			'type_not',
			'flag_active',
			'company_id',
			'url_image',
			'description',
			'flag_internal',
			'flag_edit',
			'flag_customizer',
			'type_process_id',
			'code_template_default',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static match(query, search) {
		query.whereRaw('MATCH(code, name, description, ambit) AGAINST(?)', [search]);
		return query;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[module(selectColumns), processTypeIntegration(selectColumns), typeProcess(selectColumns)]')
			.modifyEager('processTypeIntegration', (builder) => {
				builder
					.where('company_id', companyId)
					.skipUndefined()
					.where('com_process_type_integrations.subsidiary_id', filter.subsidiaryId)
					.skipUndefined()
					.where('com_process_type_integrations.type_integration_code', filter.typeIntegrationCode)
					.first();
			})
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_process_id', filter.typeProcessId)
			.where('company_id', companyId);

		if (filter.typeNotName) {
			query.where('type_not_names', 'like', `%${filter.typeNotName}%`);
		}

		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId, filter = {}) {
		return this.query()
			.eager('[module(selectColumns), processTypeIntegration(selectColumns), typeProcess(selectColumns)]')
			.modifyEager('processTypeIntegration', (builder) => {
				builder
					.where('company_id', companyId)
					.skipUndefined()
					.where('com_process_type_integrations.subsidiary_id', filter.subsidiaryId)
					.skipUndefined()
					.where('com_process_type_integrations.type_integration_code', filter.typeIntegrationCode)
					.first();
			})
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_process_id', filter.typeProcessId)
			.where('company_id', companyId)
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static async getProcessNotifications({
		subsidiaryCode, authorization, data, flagTemplate,
	}) {
		const typeNotifications = await this.getTypeNotifications({
			subsidiaryCode,
			authorization,
			flagTemplate,
		});

		if (typeNotifications.status === 200) {
			const newTypeNot = typeNotifications.responseNot.map((typeNotItem) => {
				const newItem = { ...typeNotItem };
				const typeNotProcess = data.typeNot.find(i => i.code === typeNotItem.code);
				let templateCom = [];
				let typeNotFlagActive = false;
				if (typeNotProcess) {
					templateCom = typeNotProcess.templates || [];
					typeNotFlagActive = typeNotProcess.flagActive;
				}
				newItem.flagActive = !!typeNotFlagActive;
				let { templateCompany } = newItem;
				templateCompany = templateCompany || [];
				newItem.templates = templateCompany.map(e => ({
					code: e.code,
					name: e.name,
					urlImage: e.urlImage,
					flagActive: !!templateCom.find(i => i.code === e.code && i.flagActive),
				}));
				delete newItem.templateCompany;
				return newItem;
			});
			return newTypeNot;
		}

		return data;
	}

	static async getTypeNotifications({ subsidiaryCode = '', authorization, flagTemplate }) {
		if (isDevOrProd()) {
			const auxSubsidiaryCode = subsidiaryCode ? `subsidiaryCode=${subsidiaryCode}` : '';
			let filterTemplate = flagTemplate ? 'templates=true' : '';
			if (subsidiaryCode) {
				filterTemplate = filterTemplate ? `&${filterTemplate}` : filterTemplate;
			}
			const { data: responseNot, status } = await simpleAxios({
				url: `${
					process.env.NOTIFICATIONS_MAKI_URL
				}/notification-types-unique?${auxSubsidiaryCode}${filterTemplate}`,
				method: 'GET',
				headers: {
					authorization,
				},
				validateStatus: () => true,
			});
			return { responseNot, status };
		}
		return { status: 404 };
	}

	static async notificationTypesConfig({
		companyId, subsidiaryId, authorization, data,
	}) {
		const { data: responseNot, status } = await simpleAxios({
			url: `${process.env.NOTIFICATIONS_MAKI_URL}/notification-types/${companyId}/config`,
			method: 'PATCH',
			headers: {
				authorization,
			},
			data: {
				data: data.typeNot.map(item => ({
					code: item.code,
					flagActive: item.flagActive,
					flagConfig: item.flagActive,
					subsidiaryId,
				})),
			},
			validateStatus: () => true,
		});
		return { responseNot, status };
	}

	static async createTemplate({
		companyId, authorization, data, processCode,
	}) {
		// eslint-disable-next-line no-mixed-operators
		const num = Math.floor(Math.random() * 100 + 1);
		const { data: responseNot, status } = await simpleAxios({
			url: `${process.env.NOTIFICATIONS_MAKI_URL}/templates/${companyId}/external`,
			method: 'POST',
			headers: {
				authorization,
			},
			data: {
				typeNotificationCode: data.typeNotificationCode,
				name: data.name,
				code: `${processCode}-${data.typeNotificationCode}-${num}`,
				template: data.tramaHtml,
				processCode,
				flagTemplateDefault: data.flagTemplateDefault,
			},
			validateStatus: () => true,
		});
		return { responseNot, status };
	}

	static editTemplateMultiple({ processSubsidiary, newTemplate }) {
		const processSubsidiaryUpd = processSubsidiary.map((process) => {
			const newConfig = process.configTypeIntegration.map((typeNotItem) => {
				const newItem = { ...typeNotItem };
				const { templates } = newItem;
				templates.push({
					code: newTemplate.code,
					name: newTemplate.name,
					urlImage: newTemplate.urlImage,
					flagActive: false,
				});
				newItem.templates = templates;
				return newItem;
			});
			const newProcess = {
				id: process.id,
				configTypeIntegration: newConfig,
			};
			return newProcess;
		});
		return this.editMultiple(processSubsidiaryUpd);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getByCode({ code, subsidiaryId, typeIntegrationCode }, companyId) {
		return this.query()
			.eager('[processTypeIntegration(selectColumns), processTypeIntegrations(selectColumns), typeProcess(selectColumns)]')
			.modifyEager('processTypeIntegration', (builder) => {
				builder
					.where('company_id', companyId)
					.skipUndefined()
					.where('com_process_type_integrations.subsidiary_id', subsidiaryId)
					.skipUndefined()
					.where('com_process_type_integrations.type_integration_code', typeIntegrationCode)
					.first();
			})
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getByCodes({ codes }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', codes)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static getByCompanyCodes(companiesCodes) {
		const companyTable = 'com_companies';
		return this.query()
			.select(this.defaultColumns())
			.innerJoin(`${companyTable}`, `${companyTable}.id`, `${this.tableName}.company_id`)
			.whereIn(`${companyTable}.acl_code`, companiesCodes);
	}

	static getTypeNotName(data) {
		const typeNotNames = data.typeNot.reduce((acum, item) => {
			const newAcum = acum;
			if (item.flagActive) {
				newAcum.push(item.name);
			}
			return newAcum;
		}, []);
		return typeNotNames;
	}

	static processProcessDetails(data, { processDetail, integrationType, subsidiary }) {
		const newProcessDetail = {
			configTypeIntegration: data.typeNot,
		};
		if (!processDetail) {
			newProcessDetail.typeIntegrationCode = integrationType.code;
			newProcessDetail.typeIntegrationId = integrationType.id;
			newProcessDetail.processId = data.id;
			newProcessDetail.subsidiaryId = subsidiary.id;
			newProcessDetail.companyId = subsidiary.companyId;
		} else {
			newProcessDetail.id = processDetail.id;
		}
		return newProcessDetail;
	}

	static edit(id, {
		data, processDetail, integrationType, subsidiary,
	}) {
		let newData = { ...data, id };
		newData.typeNotNames = this.getTypeNotName(data);
		newData = this.processProcessDetails(newData, { processDetail, integrationType, subsidiary });
		return ProcessTypeIntegration.editMultiple(newData);
	}

	static editMultiple(data) {
		return this.query().upsertGraph(data, {
			noDelete: true,
			relate: true,
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

module.exports = Process;
