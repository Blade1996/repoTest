'use strict';

const ToDo = require('./../../models/ToDo');
const Boom = require('boom');

async function handler(request) {
	try {
		const { id } = request.params;
		const newActivity = await ToDo.remove(id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
