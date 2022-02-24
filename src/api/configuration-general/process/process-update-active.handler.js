'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');

async function handler(request) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const { flagActive } = request.payload;
		const data = await Process.editFlagActive(request.params.id, { flagActive, companyId });
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
