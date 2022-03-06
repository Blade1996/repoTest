'use strict';

const User = require('./../../models/User');
const Boom = require('boom');

async function handler(request) {
	try {
		const { id } = request.params;
		const newActivity = await User.remove(id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
