'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');
const Integration = require('../../../models/Integration');
const ProcessTypeIntegration = require('../../../models/ProcessTypeIntegration');
const Subsidiary = require('../../../models/ComSubsidiaries');
const { processIntegrationNotFound, subsidiaryNotFound } = require('../../shared/error-codes');
const { notifications: not } = require('../../../process-integration/type-integrations-enum.js');
const integrationTypeEntity = require('../../../models/enums/integration-type-entity-enum');

async function getIntegrationType(request) {
	try {
		const code = request.query.integrationTypeCode || not;
		const data = await Integration.getByCode(
			{ code, typeEntity: integrationTypeEntity.typeIntegration },
			undefined,
		);
		return data || Boom.badRequest(processIntegrationNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getProcessDetail(request, h) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const code = request.query.integrationTypeCode || not;
		const data = await ProcessTypeIntegration.getByCode(
			{
				typeIntegrationCode: code,
				subsidiaryId: request.query.subsidiaryId,
				processId: request.params.id,
			},
			companyId,
		);
		return h.response(data);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getSubsidiary(request, h) {
	try {
		if (request.query.subsidiaryId) {
			const subsidiary = await Subsidiary.getById(request.query.subsidiaryId);
			return subsidiary || Boom.badRequest(subsidiaryNotFound);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getProcess(request) {
	try {
		const { subsidiaryId, integrationTypeCode } = request.query;
		const companyId = request.auth.credentials.cms_companies_id;
		const data = await Process.getById(request.params.id, companyId, {
			subsidiaryId,
			typeIntegrationCode: integrationTypeCode || not,
		});
		return data || Boom.notFound();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function getProcessSubsidiary(request) {
	try {
		const { process } = request.pre;
		const { typeNot: typeNotCom } = process;
		process.typeNot = process.processTypeIntegration
			? process.processTypeIntegration.configTypeIntegration
			: typeNotCom;
		return process;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getIntegrationType,
	getProcessDetail,
	getSubsidiary,
	getProcess,
	getProcessSubsidiary,
};

module.exports = methods;
