'use strict';

const Boom = require('boom');
const Integration = require('../../../models/Integration');
const IntegrationSubsidiary = require('../../../models/IntegrationSubsidiary');
const ComSubsidiaries = require('../../../models/ComSubsidiaries');
const { isDevOrProd } = require('../../../shared/helper');
const IntegrationServices = require('../../../process-integration/integration-services');

async function handler(request, h) {
	try {
		const {
			cms_companies_id: companyId, employee, company, project,
		} = request.auth.credentials;
		const aclCredentials = { company, project };
		const { authorization } = request.headers;
		const {
			subsidiary,
			integrationType,
			comIntegrations,
			comIntegrationCategory,
			wayPayment,
		} = request.pre;
		const data = request.payload;
		const newData = Integration.getFormatData({
			data,
			comIntegrations,
			integrationType,
			subsidiary,
		});
		let allResponseServices = [];
		if (isDevOrProd() && authorization) {
			allResponseServices = await IntegrationServices.registerIntegrations({
				newData: newData.integrations,
				subsidiary,
				authorization,
				integrationType,
				wayPayment,
				companyId,
				employee,
				aclCredentials,
			});
		}
		const newDataUpdate = await IntegrationServices.getDataUpdateIntegration({
			dataUpdate: newData.dataUpdate,
			allResponseServices,
			comIntegrationCategory,
		});
		if (isDevOrProd() && subsidiary) {
			await request.server.methods.getConfigSync.cache.drop({
				companyId,
				subsidiaryId: subsidiary.id,
			});
		}
		const response = await IntegrationSubsidiary.editMultiple(newDataUpdate);
		if (response && response.length > 0) {
			await ComSubsidiaries.editFlagActive(subsidiary.id, companyId);
		}
		return { response, allResponseServices };
	} catch (error) {
		if (error.message) {
			const errorMsg = {
				statusCode: 400,
				code: error.message,
				message: 'Credenciales no configuradas error en consulta de endpoint.',
			};
			return h.response(errorMsg).code(400);
		}
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
