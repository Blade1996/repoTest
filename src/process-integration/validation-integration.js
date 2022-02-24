'use strict';

const PaymentGateway = require('../payment-gateway/PaymentGatewayStrategy');
const ExternalApis = require('../external-apis/ExternalApisStrategy');
const { gateway, apisExternal, ecommerceExternal } = require('./type-integrations-enum');

async function integrationValidation({
	code,
	config,
	configCredentials,
	additionalInformation,
	integrationType,
	employee,
	subsidiary,
	aclCredentials,
}) {
	let responseIntegration = {};
	let newConfigCredentials = { ...configCredentials };
	if (integrationType.code === gateway || integrationType.code === ecommerceExternal) {
		const paymentGatewayInstance = new PaymentGateway(config, code);
		// eslint-disable-next-line no-await-in-loop
		responseIntegration = await paymentGatewayInstance.createCommerce({
			code,
			company: employee.company,
			additionalInformation,
			subsidiary,
		});
		if (responseIntegration && responseIntegration.success) {
			newConfigCredentials = Object.assign(configCredentials, responseIntegration.data);
			if (responseIntegration.grouper) {
				delete responseIntegration.success;
				responseIntegration = responseIntegration.data;
			}
		}
	}
	if (integrationType.code === apisExternal) {
		const externalApisInstance = new ExternalApis(
			{
				newConfigCredentials,
				employee,
				subsidiary,
				aclCredentials,
			},
			code,
		);
		// eslint-disable-next-line no-await-in-loop
		responseIntegration = await externalApisInstance.configInit({
			countryId: employee.company.comCountryId,
		});
		if (responseIntegration) {
			newConfigCredentials = Object.assign(configCredentials, responseIntegration);
		}
	}
	return { newConfigCredentials, responseIntegration };
}

module.exports = integrationValidation;
