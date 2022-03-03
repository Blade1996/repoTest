'use strict';

const Boom = require('boom');
const User = require('../../models/User');

async function handler() {
	try {
		const userList = await User.getAll();
		return userList;
	} catch (error) {
		return Boom.badRequest(error, error);
	}
}

module.exports = handler;
