'use strict';

const Boom = require('boom');
const MsWayPayment = require('../../../models/MsWayPayment');
const Integration = require('../../../models/Integration');
const IntegrationCategory = require('../../../models/IntegrationCategory');
const Subsidiary = require('../../../models/ComSubsidiaries');
const Company = require('../../../models/Company');
const {
	processIntegrationNotFound,
	entityAclCodeNotFound,
	companiesAclCodeNotFound,
	subsidiaryNotFound,
	integrationNotFound,
	wayPaymentCommerceNotConfig,
} = require('../../shared/error-codes');
const integrationTypeEntity = require('../../../models/enums/integration-type-entity-enum');
const { credDeb } = require('../../../models/enums/way-payment-codes-enum');

async function getIntegrationType(request) {
	try {
		const data = await Integration.getByCode(
			{ code: request.params.codeType, typeEntity: integrationTypeEntity.typeIntegration },
			undefined,
		);
		return data || Boom.badRequest(processIntegrationNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function validSubsidiaryDefault(request) {
	try {
		const { employee } = request.auth.credentials;
		const { settings, id: companyId } = employee.company;
		const flagTypeIntegrationGrouper = settings && settings.flagTypeIntegrationGrouper;
		if (flagTypeIntegrationGrouper) {
			const subsidiary = await Subsidiary.getByCompanyDefault(companyId);
			if (subsidiary) {
				return subsidiary;
			}
		}
		return false;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

function countIntegrations(payload) {
	return payload.reduce((count, i) => count + i.integrations.length, 0);
}

async function getIntegrationsConfig(request) {
	try {
		const { cms_companies_id: companyId } = request.auth.credentials;
		const { integrationCategory: payloadData } = request.payload;
		const { integrationType, subsidiary } = request.pre;
		const { integrationCategory } = integrationType;
		const data = await Integration.getAll(
			{ categoryIds: integrationCategory.map(i => i.id), subsidiaryId: subsidiary.id },
			companyId,
		);
		return data.length === countIntegrations(payloadData)
			? data
			: Boom.badRequest(integrationNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getIntegrationsCategories(request) {
	try {
		const data = request.pre.comIntegrations;
		const codeCategories = data.map(i => i.codeCategory);
		const categoryData = await IntegrationCategory.getByCodes(codeCategories);
		return categoryData.length > 0 ? categoryData : Boom.badRequest(integrationNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function validAclCode(request) {
	try {
		const { companiesAclCode } = request.payload;
		if (Array.isArray(companiesAclCode) && companiesAclCode.length > 0) {
			const companyCodes = companiesAclCode.map(item => item.code);
			const companies = await Company.getByAclCodes(companyCodes);
			return companies.length === companyCodes.length
				? companies
				: Boom.badRequest(companiesAclCodeNotFound);
		}
		return Boom.badRequest(entityAclCodeNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getSubsidiary(request) {
	try {
		let { subsidiaryId } = request.query;
		const { subsidiaryDefault } = request.pre;
		if (!subsidiaryId && subsidiaryDefault) {
			subsidiaryId = subsidiaryDefault.id;
		}
		if (subsidiaryId) {
			const subsidiary = await Subsidiary.getById(subsidiaryId, {
				columns: ['config_integrations'],
			});
			if (subsidiary) {
				return subsidiary;
			}
		}
		return Boom.badRequest(subsidiaryNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getWayPaymentDefault(request) {
	try {
		const { employee } = request.auth.credentials;
		const { comCountryId } = employee.company;
		const wayPayment = await MsWayPayment.getByCode(credDeb, comCountryId);
		return wayPayment || Boom.badRequest(wayPaymentCommerceNotConfig);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getIntegrationType,
	validAclCode,
	getSubsidiary,
	getIntegrationsConfig,
	getIntegrationsCategories,
	validSubsidiaryDefault,
	getWayPaymentDefault,
};

module.exports = methods;
