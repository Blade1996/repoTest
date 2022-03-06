'use strict';

const Boom = require('boom');
const { isNullOrUndefined } = require('util');
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
async function validExits(request, h) {
	try {
		const { id } = request.params;
		const data = await ToDo.getActById(id);
		if (isNullOrUndefined(data)) {
			return Boom.badRequest(notFound);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}
const methods = {
	getUser,
	validExits
};

module.exports = methods;
