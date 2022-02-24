'use strict';

const Boom = require('boom');
const IntegrationSubsidiary = require('../../../models/IntegrationSubsidiary');

async function handler(request) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const { subsidiaryDefault } = request.pre;
		const { query } = request;
		if (subsidiaryDefault) {
			query.subsidiaryId = subsidiaryDefault.id;
		}
		const integrations = await IntegrationSubsidiary.getAllBasic(query, companyId);
		return integrations;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
