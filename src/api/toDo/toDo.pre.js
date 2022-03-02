/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */

'use strict';

const Boom = require('boom');
const ToDo = require('./../../models/ToDo');
const { alreadyExists } = require('./../shared/error-codes');


async function getToDo(request, h) {
	try {
		const { payload } = request;
		const data = await ToDo.findByName(payload.activity);
		if (data) {
			return Boom.badRequest(alreadyExists);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getToDo,
};

module.exports = methods;
