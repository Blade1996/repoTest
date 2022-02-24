'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');

async function handler(request, h) {
	try {
		const { authorization } = request.headers;
		const { process } = request.pre;
		const companyId = request.auth.credentials.cms_companies_id;
		const data = request.payload;
		const newTemplate = await Process.createTemplate({
			companyId,
			authorization,
			data,
			processCode: process.code,
		});
		if (newTemplate.status === 201) {
			return { responseNotification: newTemplate };
		}
		return h.response(newTemplate).code(400);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
