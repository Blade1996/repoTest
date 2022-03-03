/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */

'use strict';

const Boom = require('boom');
const User = require('./../../models/User');
const { alreadyExists } = require('./../shared/error-codes');


async function getUser(request, h) {
	try {
		const { payload } = request;
		const data = await User.findByName(payload.name);
		
		if (data) {
			return Boom.badRequest(alreadyExists);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getUser,
};

module.exports = methods;
