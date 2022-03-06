'use strict';

const User = require('./../../models/User');
const Boom = require('boom');

async function handler(request) {
	try {
		const { id } = request.params;
		const data = request.payload;
		const newActivity = await User.edit(data, id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
