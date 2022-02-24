'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');
const { notifications } = require('../../../process-integration/type-integrations-enum');

async function handler(request, h) {
	try {
		const { query } = request;
		const companyId = request.auth.credentials.cms_companies_id;
		query.typeIntegrationCode = notifications;
		const list = await Process.getAll(query, companyId);
		return h.paginate(list, request.query);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
