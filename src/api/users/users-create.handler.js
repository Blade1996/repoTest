'use strict';

const User = require('./../../models/User');
const Boom = require('boom');

async function handler(request) {
	try {
		const data = request.payload;
		const newActivity = await User.create(data);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
