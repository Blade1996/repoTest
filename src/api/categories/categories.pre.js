/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */

'use strict';

const Boom = require('boom');
const Categories = require('./../../models/Categories');
const { alreadyExists } = require('./../shared/error-codes');


async function getCategories(request, h) {
	try {
		const { payload } = request;
		const data = await Categories.findByName(payload.name);
		if (data) {
			return Boom.badRequest(alreadyExists);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getCategories,
};

module.exports = methods;
