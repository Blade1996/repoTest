'use strict';

const ToDo = require('./../../models/ToDo');
const Boom = require('boom');

async function handler(request) {
	try {
		const { id } = request.params;
		const data = request.payload;
		const newActivity = await ToDo.edit(data, id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
