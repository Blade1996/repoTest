'use strict';

const Boom = require('boom');
const TypeProcess = require('../../../models/TypeProcess');

async function handler(request, h) {
	try {
		const { data, typeOperation } = request.payload;
		if (typeOperation === 1) {
			return TypeProcess.getByMigration({});
		} else if (typeOperation === 2 || typeOperation === 3) {
			return TypeProcess.updateNextMigration(data);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
