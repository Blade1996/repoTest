'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');

async function handler(request, h) {
	try {
		const { query } = request;
		const companyId = request.auth.credentials.cms_companies_id;
		const list = await Device.getAll(companyId, query);
		return h.paginate(list, request.query);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
