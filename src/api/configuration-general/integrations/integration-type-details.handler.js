'use strict';

const Boom = require('boom');
const helper = require('./../../../models/helper');
const { encrypt } = require('./../../../shared/helper');
const Integration = require('./../../../models/Integration');

async function handler(request) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const { integrationType, subsidiaryDefault } = request.pre;
		const { query } = request;
		if (subsidiaryDefault) {
			query.subsidiaryId = subsidiaryDefault.id;
		}
		const data = await Integration.getById(integrationType.id, companyId, query);
		if (query.subsidiaryId) {
			data.integrationCategory = data.integrationCategory.map((intCatg) => {
				const newData = intCatg;
				newData.flagAdittional = false;
				if (newData.integrations) {
					const configAdditional = newData.integrations.reduce((acum, integ) => {
						const newA = { ...acum };
						newA[integ.code] = integ.config || {};
						return newA;
					}, {});
					newData.integrations = newData.integrations.map((integ) => {
						const newA = { ...integ };
						newA.flagAdditional = false;
						const { integrationSubsidiary } = integ;
						if (integrationSubsidiary && integrationSubsidiary.additionalInformation) {
							const {
								flagGrouper,
								authorizationMercadopago,
								authorizationDate,
							} = integrationSubsidiary.additionalInformation;
							if (authorizationDate && authorizationMercadopago) {
								const expiration = new Date(authorizationDate);
								const dateCurrent = new Date(helper.localDate(new Date(), 'YYYY-MM-DD HH:mm:ss'));
								expiration.setMinutes(expiration.getMinutes() + 10);
								if (dateCurrent > expiration) {
									delete integrationSubsidiary.additionalInformation.authorizationMercadopago;
								}
							}
							if (
								flagGrouper &&
								!integrationSubsidiary.additionalInformation.authorizationMercadopago
							) {
								const { company } = request.auth.credentials.employee;
								const codeEncrypt = encrypt(`${query.subsidiaryId}=${company.id}=${integ.code}=${request.info.referrer}`);
								newA.urlLinkActivate = `https://auth.mercadopago.com.pe/authorization?client_id=${
									company.settings.clientAppId
								}&response_type=code&state=${codeEncrypt}&platform_id=mp&redirect_uri=${
									process.env.MY_URL
								}/payment-gateway/notifications`;
							}
						}
						if (integ.config) {
							const totalColumns = Object.keys(integ.config);
							newA.flagAdditional = totalColumns.length > 0;
						}
						return newA;
					}, []);
					newData.configAdditional = configAdditional;
				}
				return newData;
			});
		}
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
