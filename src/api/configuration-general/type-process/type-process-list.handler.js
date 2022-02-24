'use strict';

const Boom = require('boom');
const TypeProcess = require('../../../models/TypeProcess');

async function handler(request, h) {
	try {
		const { query } = request;
		const list = await TypeProcess.getAll(query);
		return h.paginate(list, request.query);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
