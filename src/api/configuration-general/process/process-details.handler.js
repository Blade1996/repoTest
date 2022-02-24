'use strict';

const Boom = require('boom');
const Process = require('../../../models/Process');
const { apisExternal: api } = require('../../../process-integration/type-integrations-enum.js');

async function handler(request) {
	try {
		const { authorization } = request.headers;
		const { integrationTypeCode } = request.query;
		const { subsidiary, processSubsidiary } = request.pre;
		if (integrationTypeCode === api) {
			return processSubsidiary.typeNot;
		}
		const data = await Process.getProcessNotifications({
			subsidiaryCode: subsidiary ? subsidiary.sucursalCode : '',
			authorization,
			data: processSubsidiary,
			flagTemplate: true,
		});
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
