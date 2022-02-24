'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');

async function handler(request) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const data = await Device.getById(request.params.id, companyId);
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
