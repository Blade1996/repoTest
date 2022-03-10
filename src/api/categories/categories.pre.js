/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */


'use strict';

const Boom = require('boom');
const { isNullOrUndefined } = require('util');
const Categories = require('./../../models/Categories');
const { alreadyExists, notfound } = require('./../shared/error-codes');


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

async function ValidExists(request, h) {
	try {
		const { id } = request.params;
		const data = await Categories.getActById(id);
		if (isNullOrUndefined(data)) {
			return Boom.badRequest(notfound);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}
const methods = {
	getCategories,
    ValidExists,
};

module.exports = methods;
