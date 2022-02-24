'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');
const { isDevOrProd } = require('../../../shared/helper');

async function handler(request) {
	try {
		const { processDetail, integrationType, subsidiary } = request.pre;
		const companyId = request.auth.credentials.cms_companies_id;
		const data = request.payload;
		if (isDevOrProd()) {
			await request.server.methods.getConfigSync.cache.drop({
				companyId,
				subsidiaryId: subsidiary.id,
			});
		}
		const response = await Process.edit(request.params.id, {
			data,
			processDetail,
			integrationType,
			subsidiary,
		});
		return { response };
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
