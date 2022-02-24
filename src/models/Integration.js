'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const integrationTypeEntity = require('./enums/integration-type-entity-enum');

class Integration extends baseModel {
	static get tableName() {
		return 'com_integrations';
	}

	static get relationMappings() {
		return {
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module.js`,
				join: {
					from: 'com_integrations.module_id',
					to: 'com_module.id',
				},
			},
			integrationCategory: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/IntegrationCategory.js`,
				join: {
					from: 'com_integrations.id',
					to: 'com_integration_category.integration_id',
				},
			},
			integrationSubsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/IntegrationSubsidiary.js`,
				join: {
					from: 'com_integrations.id',
					to: 'com_integration_subsidiaries.integration_id',
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
			'config',
			'type_entity',
			'process_id',
			'url_image',
			'description',
			'flag_internal',
			'flag_edit',
			'flag_customizer',
			'category_id',
			'code_category',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['typeEntityName'];
	}

	get typeEntityName() {
		let typeEntityName = '';
		if (this.typeEntity === integrationTypeEntity.typeIntegration) {
			typeEntityName = 'Tipo de Integración';
		} else if (this.typeEntity === integrationTypeEntity.integration) {
			typeEntityName = 'Integración';
		} else if (this.typeEntity === integrationTypeEntity.process) {
			typeEntityName = 'Proceso';
		}
		return typeEntityName;
	}

	static match(query, search) {
		query.whereRaw('MATCH(name, description, ruc, sunat_code) AGAINST(?)', [search]);
		return query;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[module(selectColumns), integrationSubsidiary(selectColumns)]')
			.modifyEager('integrationSubsidiary', (builder) => {
				builder
					.skipUndefined()
					.where('com_integration_subsidiaries.subsidiary_id', filter.subsidiaryId)
					.where('com_integration_subsidiaries.company_id', companyId)
					.first();
			})
			.select(this.defaultColumns())
			.where('type_entity', integrationTypeEntity.integration)
			.where('company_id', companyId);

		if (filter.typeNotName) {
			query.where('type_not_names', 'like', `%${filter.typeNotName}%`);
		}

		if (filter.categoryIds) {
			query.whereIn('category_id', filter.categoryIds);
		}

		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId, filter) {
		return this.query()
			.eager('[module(selectColumns), integrationCategory(selectColumns).integrations(selectColumns).integrationSubsidiary(selectColumns)]')
			.modifyEager('integrationCategory.integrations', (builder) => {
				builder.where('com_integrations.company_id', companyId);
			})
			.modifyEager('integrationCategory.integrations.integrationSubsidiary', (builder) => {
				builder
					.skipUndefined()
					.where('com_integration_subsidiaries.subsidiary_id', filter.subsidiaryId)
					.where('com_integration_subsidiaries.company_id', companyId)
					.first();
			})
			.select(this.defaultColumns())
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getByCode({ code, typeEntity }, companyId) {
		return this.query()
			.eager('integrationCategory(selectColumns)')
			.select(this.defaultColumns())
			.where('type_entity', typeEntity)
			.where('code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getByCodes({ codes, typeEntity }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('type_entity', typeEntity)
			.skipUndefined()
			.where('code', codes)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static edit(id, data) {
		const newData = { ...data };
		let typeNotNames = data.typeNot.reduce((acum, item) => {
			const newAcum = acum;
			if (item.flagActive) {
				newAcum.push(item.name);
			}
			return newAcum;
		}, []);
		newData.typeNotNames = typeNotNames;
		typeNotNames = typeNotNames.map(item => item.name);

		return this.query()
			.patch(data)
			.where('id', id);
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

	static getByCompanyCodes(companiesCodes, typeEntity = integrationTypeEntity.integration) {
		const companyTable = 'com_companies';
		return this.query()
			.select(this.defaultColumns())
			.innerJoin(`${companyTable}`, `${companyTable}.id`, `${this.tableName}.company_id`)
			.whereIn(`${companyTable}.acl_code`, companiesCodes)
			.where('type_entity', typeEntity);
	}

	static withoutModifications(config) {
		if (config) {
			const keys = Object.values(config);
			return keys.find(i => i);
		}
		return undefined;
	}

	static getFormatData({
		data, comIntegrations, integrationType, subsidiary,
	}) {
		const newData = data.integrationCategory.reduce(
			(acum, item) => {
				const newAcum = acum;
				if (Array.isArray(item.integrations) && item.integrations.length > 0) {
					item.integrations.forEach((element) => {
						const comItg = comIntegrations.find(i => i.id === element.id) || {};
						const newItem = { ...element, codeCategory: item.code };
						newItem.urlImage = comItg.urlImage || '';
						newItem.configCredentials = element.config || {};
						newItem.additionalInformationSubsidiary =
							comItg.integrationSubsidiary && comItg.integrationSubsidiary.additionalInformation;
						newAcum.integrations.push(newItem);
						if (comItg.integrationSubsidiary) {
							const dataUpdate = {
								id: comItg.integrationSubsidiary.id,
								integrationId: element.id,
								categoryId: comItg.categoryId,
								flagCustomizer: element.flagCustomizer,
								flagActive: element.flagActive,
								flagInternal: element.flagInternal,
								flagAppPrsActive: comItg.code === 'firebase_sync' ? 1 : 0,
							};
							if (this.withoutModifications(newItem.configCredentials)) {
								// eslint-disable-next-line max-len
								const newdataInfo =
									comItg.integrationSubsidiary &&
									comItg.integrationSubsidiary.additionalInformation;
								dataUpdate.additionalInformation = Object.assign(newdataInfo || {}, {
									integrationCode: comItg.code,
									categoryCode: comItg.codeCategory,
									syncPlatforms: newItem.configCredentials.syncPlatforms || null,
								});
							}
							const configAdditionalKey = Object.keys(element.configAdditional || {});
							if (configAdditionalKey.length > 0) {
								dataUpdate.additionalInformation = Object.assign(
									dataUpdate.additionalInformation || {},
									element.configAdditional,
								);
							}
							newAcum.dataUpdate.push(dataUpdate);
						} else {
							const configAdditional = element.configAdditional || {};
							newAcum.dataUpdate.push({
								integrationCode: integrationType.code,
								integrationId: element.id,
								categoryId: comItg.categoryId,
								subsidiaryId: subsidiary.id,
								flagEdit: true,
								flagPayment: false,
								flagCustomizer: element.flagCustomizer,
								flagActive: element.flagActive,
								flagInternal: element.flagInternal,
								companyId: subsidiary.companyId,
								additionalInformation: {
									config: {},
									integrationCode: comItg.code,
									categoryCode: comItg.codeCategory,
									...configAdditional,
									syncPlatforms: newItem.configCredentials.syncPlatforms || null,
								},
								flagAppPrsActive: comItg.code === 'firebase_sync' ? 1 : 0,
							});
						}
					});
				}
				return newAcum;
			},
			{ dataUpdate: [], integrations: [] },
		);
		return newData;
	}
}

module.exports = Integration;
