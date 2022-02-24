'use strict';

const Boom = require('boom');
const Country = require('../../../models/Country');

async function handler(request, h) {
	try {
		const list = await Country.getAll(request.query);
		return h.paginate(list, request.query);
	} catch (error) {
		return Boom.badImplementation(null, error);
	}
}

module.exports = handler;
