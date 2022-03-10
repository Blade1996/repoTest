/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */

'use strict';

const Boom = require('boom');
const { isNullOrUndefined } = require('util');
const Product = require('./../../models/Product');
const { alreadyExists, notFound } = require('./../shared/error-codes');


async function getProduct(request, h) {
	try {
		const { payload } = request;
		const data = await Product.findByName(payload.name);
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
		const data = await Product.getActById(id);
		if (isNullOrUndefined(data)) {
			return Boom.badRequest(notFound);
		}
		return h.response();
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	getProduct,
	validExits,
};

module.exports = methods;