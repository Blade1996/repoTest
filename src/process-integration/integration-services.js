'use strict';

const simpleAxios = require('./../api/shared/simple-axios');
const { gateway } = require('../process-integration/type-integrations-enum.js');
const WayPaymentCommerce = require('../models/WayPaymentCommerce');
const ComEcommerceCompany = require('../models/ComEcommerceCompany');
const validationIntegration = require('./validation-integration');

async function integrationConfig({
	code,
	config,
	configCredentials,
	additionalInformation,
	integrationType,
	employee,
	subsidiary,
	aclCredentials,
}) {
	const { responseIntegration, newConfigCredentials } = await validationIntegration({
		code,
		config,
		employee,
		subsidiary,
		integrationType,
		configCredentials,
		additionalInformation,
		aclCredentials,
	});
	const keysId = Object.keys(newConfigCredentials);
	keysId.forEach((i) => {
		if (
			typeof newConfigCredentials[i] !== 'string' &&
			typeof newConfigCredentials[i] !== 'number'
		) {
			delete newConfigCredentials[i];
		}
	});
	return { responseIntegration, newConfigCredentials };
}

function getCategoryName(codeCategory) {
	let name = '';
	switch (codeCategory) {
	case 'PAYMENT_LINK':
		name = 'Link de Pago';
		break;
	case 'PAYMENT_BUTTON':
		name = 'Tarjeta de crédito o débito';
		break;
	case 'SDK':
		name = 'Otro';
		break;
	default:
		break;
	}
	return name;
}

function getDataUpdate({ integrations = [] }) {
	return integrations.reduce((acum, i) => {
		const newAcum = acum;
		if (i.flagActive) {
			const categoryIndex = acum.findIndex(ix => ix.codeCategory === i.codeCategory);
			if (categoryIndex >= 0) {
				newAcum[categoryIndex].gateway.push({
					code: i.code,
					name: i.name,
					urlImage: i.urlImage,
					categoryCode: i.codeCategory,
				});
			} else {
				newAcum.push({
					code: i.codeCategory,
					name: this.getCategoryName(i.codeCategory),
					gateway: [
						{
							code: i.code,
							name: i.name,
							urlImage: i.urlImage,
							categoryCode: i.codeCategory,
						},
					],
				});
			}
		}
		return newAcum;
	}, []);
}

async function updateWayPaymentCommerce({
	integrations,
	integrationType,
	subsidiary,
	companyId,
	wayPayment,
}) {
	let dataUpdate = [];
	if (integrationType.code === gateway) {
		const { commerces } = subsidiary;
		const commerceIds = commerces ? commerces.map(i => i.id) : [];
		if (commerceIds.length > 0) {
			dataUpdate = this.getDataUpdate({ integrations });
			const commerceUpdate = await WayPaymentCommerce.editConfigCredDeb(
				{ gatewayConfiguration: dataUpdate },
				{ wayPayment, commerces },
				companyId,
			);
			if (commerceUpdate.length > 0) {
				await ComEcommerceCompany.updateMultipe(commerceUpdate);
			}
		}
	}
	return dataUpdate;
}

function withoutModifications(config) {
	if (config) {
		const keys = Object.values(config);
		return keys.find(i => i);
	}
	return undefined;
}

async function registerIntegrations({
	newData,
	subsidiary,
	authorization,
	integrationType,
	wayPayment,
	companyId,
	employee,
	aclCredentials,
}) {
	const allResponseServices = [];
	// eslint-disable-next-line no-plusplus
	for (let index = 0; index < newData.length; index++) {
		const e = newData[index];
		if (e.flagCustomizer && this.withoutModifications(e.config)) {
			const { configCredentials, additionalInformationSubsidiary: additionalInformation } = e;
			// eslint-disable-next-line no-await-in-loop
			const integrationResponse = await this.integrationConfig({
				code: e.code,
				config: e.config,
				configCredentials,
				additionalInformation,
				integrationType,
				employee,
				subsidiary,
				aclCredentials,
			});

			const url = `${process.env.ACL_URL}/company/serviceaccount`;
			const dataServ = {
				url,
				method: 'PATCH',
				headers: {
					authorization,
				},
				data: {
					credentials: integrationResponse.newConfigCredentials,
					codeCategory: e.codeCategory,
					codeIntegracion: e.code,
					codeSubsidiary: subsidiary.subsidiaryAclCode,
					flagCustomizer: e.flagCustomizer,
					flagEdit: e.flagActive,
					flagInternal: e.flagInternal || false,
				},
			};
			// eslint-disable-next-line no-await-in-loop
			const { data: responseACL } = await simpleAxios({
				...dataServ,
				validateStatus: () => true,
			});
			allResponseServices.push({
				idIntegration: e.id,
				codeIntegracion: e.code,
				nameIntegration: e.name,
				responseACL,
				responseIntegration: integrationResponse.responseIntegration,
				responseIntegrationComplete: Object.assign(
					integrationResponse.newConfigCredentials,
					integrationResponse.responseIntegration,
				),
			});
		}
	}
	await this.updateWayPaymentCommerce({
		integrations: newData,
		subsidiary,
		integrationType,
		companyId,
		wayPayment,
	});
	return allResponseServices;
}

async function getDataUpdateIntegration({
	dataUpdate,
	allResponseServices,
	comIntegrationCategory,
}) {
	let newDataUpdate = dataUpdate;
	newDataUpdate = dataUpdate.map((e) => {
		if (allResponseServices && allResponseServices.length > 0) {
			if (e.flagCustomizer) {
				const dataConfig = allResponseServices.find(i => i.idIntegration === e.integrationId) || {};
				if (dataConfig.responseIntegrationComplete) {
					const dataCategory = comIntegrationCategory.find(c => c.id === e.categoryId) || {};
					if (dataCategory.configTemplate) {
						const categoryData = dataCategory.configTemplate[dataConfig.codeIntegracion];
						if (categoryData && categoryData.sensitiveFields) {
							const arrayCategory = categoryData.sensitiveFields;
							arrayCategory.forEach((element) => {
								delete dataConfig.responseIntegrationComplete[element];
							});
						}
					}

					e.additionalInformation.config = dataConfig.responseIntegrationComplete;
				}
			} else {
				// eslint-disable-next-line no-lonely-if
				if (e.id) {
					delete e.additionalInformation;
				}
			}
		}
		delete e.categoryId;
		return e;
	});
	return newDataUpdate;
}

module.exports = {
	registerIntegrations,
	integrationConfig,
	updateWayPaymentCommerce,
	withoutModifications,
	getCategoryName,
	getDataUpdate,
	getDataUpdateIntegration,
};
