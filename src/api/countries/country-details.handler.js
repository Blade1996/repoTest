'use strict';

const Boom = require('boom');
const Country = require('../../../models/Country');

async function handler(request) {
	try {
		const data = await Country.getById(request.params.id);
		return data;
	} catch (error) {
		return Boom.badImplementation(null, error);
	}
}

module.exports = handler;
