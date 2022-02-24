'use strict';

const Boom = require('boom');

async function handler(request, h) {
	try {
		const { companiesAclCode, process, integration } = request.payload;
		request.server.events.emit('update_conf_integration', {
			companies: companiesAclCode,
			data: {
				process,
				integration,
			},
		});
		return h.response().code(204);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
