'use strict';

const Podium = require('podium');
const Module = require('./../models/Module');
const Company = require('./../models/Company');
const Process = require('./../models/Process');
const Integration = require('./../models/Integration');
const IntegrationCategory = require('./../models/IntegrationCategory');
const IntegrationSubsidiary = require('./../models/IntegrationSubsidiary');
const ProcessTypeIntegration = require('./../models/ProcessTypeIntegration');
const TypeProcess = require('./../models/TypeProcess');
const { validObject, validCurrentArray } = require('./../shared/helper');
const { ecommerce } = require('../models/ModuleCode');

const emitter = new Podium('Alias');

emitter.registerEvent({
	name: 'distribution',
	channels: ['integration', 'process'],
});

// eslint-disable-next-line func-names
const handlerIntegration = async function ({
	company,
	comIntegrations,
	subsidiariesCodes,
	integrationsCategory,
}) {
	try {
		const integrationsData = await Integration.editMultiple(comIntegrations);
		const subsidiaryIds = company.subsidiary.reduce((acum, item) => {
			if (subsidiariesCodes.indexOf(item.subsidiaryAclCode) > -1) {
				acum.push(item.id);
			}
			return acum;
		}, []);
		const data = await IntegrationSubsidiary.getByCompanyId(company.id);
		const comIntegrationSubsidiaries = integrationsData.reduce((acum, item) => {
			subsidiaryIds.forEach((subsidiaryId) => {
				let info = data.find(i => i.integrationId === item.id && i.subsidiaryId === subsidiaryId);
				const flagGrouper = !!(item.config && item.config.flagGrouper);
				if (info) {
					info.flagInternal = item.flagInternal;
					info.flagPayment = item.flagPayment;
					info.flagActive = !!info.flagActive;
					info.additionalInformation = Object.assign(validObject(info.additionalInformation), {
						flagGrouper,
					});
				} else {
					const dataCategory = integrationsCategory.find(i => i.code === item.codeCategory);
					info = {
						integrationCode: dataCategory.category.code,
						integrationId: item.id,
						subsidiaryId,
						flagEdit: false,
						flagCustomizer: false,
						flagInternal: item.flagInternal,
						flagPayment: item.flagPayment,
						companyId: company.id,
						flagActive: false,
						flagAppPrsActive: false,
						additionalInformation: { flagGrouper },
					};
				}
				acum.push(info);
			});
			return acum;
		}, []);
		if (comIntegrationSubsidiaries && comIntegrationSubsidiaries.length > 0) {
			await IntegrationSubsidiary.editMultiple(comIntegrationSubsidiaries);
		}
		return Promise.resolve(comIntegrationSubsidiaries);
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
};

// eslint-disable-next-line func-names
const handlerProcess = async function ({
	company,
	comProcess,
	itemProcess,
	integrationCodes,
	subsidiariesCodes,
}) {
	try {
		const processData = await Process.editMultiple(comProcess);
		const subsidiaryIds = company.subsidiary.reduce((acum, item) => {
			if (subsidiariesCodes.indexOf(item.subsidiaryAclCode) > -1) {
				acum.push(item.id);
			}
			return acum;
		}, []);
		const processTypeCompany = await ProcessTypeIntegration.getAll({}, company.id);
		const comProcessTypeIntegrations = processData.reduce((acum, item) => {
			subsidiaryIds.forEach((subsidiaryId) => {
				const itemNewProcess = itemProcess.find(i => i.code === item.code);
				const keysId = Object.keys(itemNewProcess.categories);
				keysId.forEach((categoryCode) => {
					// eslint-disable-next-line max-len
					let info = processTypeCompany.find(i => i.subsidiaryId === subsidiaryId && i.typeIntegrationCode === categoryCode);
					const configType = [];
					if (itemNewProcess.categories && itemNewProcess.categories[categoryCode]) {
						const keysId2 = Object.keys(itemNewProcess.categories[categoryCode]);
						keysId2.forEach((id) => {
							const processConfig = itemNewProcess.categories[categoryCode][id];
							processConfig.templates = processConfig.templates || [];
							configType.push(processConfig);
						});
					}
					if (!info) {
						const dataCategory = integrationCodes.find(i => i.code === categoryCode);
						info = {
							typeIntegrationCode: categoryCode,
							typeIntegrationId: dataCategory.id,
							configTypeIntegration: configType,
							subsidiaryId,
							companyId: company.id,
							processId: item.id,
							flagActive: true,
						};
					} else if (configType && configType.length > 0) {
						info.configTypeIntegration = Object.assign(
							info.configTypeIntegration || {},
							configType || {},
						);
					}
					if (info.typeIntegration) {
						info.typeIntegration.flagActive = !!info.typeIntegration.flagActive;
					}
					acum.push(info);
				});
			});
			return acum;
		}, []);
		if (comProcessTypeIntegrations && comProcessTypeIntegrations.length > 0) {
			await ProcessTypeIntegration.editMultiple(comProcessTypeIntegrations);
		}
		return Promise.resolve(comProcessTypeIntegrations);
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
};

async function distributionCompanies({ companies = [], data = {} }) {
	emitter.on(
		{
			name: 'distribution',
			channels: ['integration'],
		},
		handlerIntegration,
	);

	emitter.on(
		{
			name: 'distribution',
			channels: ['process'],
		},
		handlerProcess,
	);

	const integrationsCategory = await IntegrationCategory.getAll({}, true);
	const modules = await Module.getAll();

	const companyCodes = companies.map(item => item.code);
	const companiesData = await Company.getByAclCodes(companyCodes, true);
	const integrationCompany = await Integration.getByCompanyCodes(companyCodes);
	const integrationCodes = await Integration.getByCodes({ typeEntity: 1 });
	const processCompany = await Process.getByCompanyCodes(companyCodes);
	const typeProcess = await TypeProcess.getAll();

	companiesData.forEach((company) => {
		let dataIntegrationsNew = [];
		const codeIntegrations = [];
		const comIntegrations = data.integration.reduce((acum, item) => {
			const dataIntegrations = integrationCompany.find(i =>
				i.code === item.code &&
					i.codeCategory === item.categoryCode &&
					i.companyId === company.id);
			const [urlImage] = item.urlImage;
			if (dataIntegrations) {
				dataIntegrations.name = item.name;
				dataIntegrations.description = item.description;
				dataIntegrations.order = item.order;
				dataIntegrations.flagInternal = item.flagInternal;
				dataIntegrations.config = validObject(item.additionalInformation);
				dataIntegrations.urlImage = urlImage;
				dataIntegrations.flagPayment = item.flagPayment;
				dataIntegrations.flagActive = !!dataIntegrations.flagActive;
				dataIntegrationsNew = dataIntegrations;
			} else {
				const dataCategory = integrationsCategory.find(i => i.code === item.categoryCode);
				dataIntegrationsNew = {
					code: item.code,
					name: item.name,
					description: item.description,
					companyId: company.id,
					config: validObject(item.additionalInformation),
					flagInternal: item.flagInternal,
					flagPayment: item.flagPayment,
					typeEntity: 2,
					urlImage,
					categoryId: dataCategory.id,
					codeCategory: dataCategory.code,
					order: item.order,
					processId: dataCategory.integrationId,
					flagActive: false,
					flagEdit: false,
					flagCustomizer: false,
				};
			}
			const auxIntegrations = codeIntegrations.find(e => e === item.code);
			if (!auxIntegrations) {
				codeIntegrations.push(item.code);
				acum.push(dataIntegrationsNew);
			}
			return acum;
		}, []);

		const comProcess = data.process.reduce((acum, item) => {
			const dataType = typeProcess.find(type => type.code === item.typeProcess);
			let info = processCompany.find(i => i.code === item.code && i.companyId === company.id);
			const [urlImage] = item.urlImage || '';
			const dataModule = modules.find(i => i.code === item.module);
			const typeName = Array.isArray(item.typeNot) && item.typeNot.map(t => t.name);
			if (info) {
				info.name = item.name;
				info.description = item.description;
				info.typeProcessId = dataType && dataType.id;
				info.order = item.order;
				info.urlImage = urlImage;
				info.flagActive = !!info.flagActive;
				info.ambit = item.scope;
				info.typeNot = validCurrentArray(item.typeNot, info.typeNot, true);
				info.typeNotNames = validCurrentArray(typeName, info.typeNotNames);
				info.moduleId = dataModule && dataModule.id ? dataModule.id : ecommerce;
			} else {
				info = {
					code: item.code,
					name: item.name,
					typeProcessId: dataType && dataType.id,
					description: item.description,
					companyId: company.id,
					order: item.order,
					urlImage,
					ambit: item.scope,
					typeNot: validCurrentArray(item.typeNot),
					typeNotNames: validCurrentArray(typeName),
					moduleId: dataModule && dataModule.id ? dataModule.id : ecommerce,
					flagActive: true,
				};
			}
			acum.push(info);
			return acum;
		}, []);

		const dataCompany = companies.find(i => i.code === company.aclCode);
		const { subsidiariesCodes } = dataCompany;

		emitter.emit(
			{
				name: 'distribution',
				channel: 'integration',
			},
			{
				company,
				comIntegrations,
				subsidiariesCodes,
				integrationsCategory,
			},
		);

		emitter.emit(
			{
				name: 'distribution',
				channel: 'process',
			},
			{
				company,
				comProcess,
				integrationCodes,
				subsidiariesCodes,
				itemProcess: data.process,
			},
		);
	});

	emitter.hasListeners('distribution'); // true

	emitter.removeAllListeners('distribution'); // Removes all listeners subscribed to 'event'

	return data;
}

module.exports = distributionCompanies;
