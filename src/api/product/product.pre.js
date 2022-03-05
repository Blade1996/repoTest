/* eslint-disable no-mixed-operators */
/* eslint-disable no-param-reassign */

'use strict';

const Boom = require('boom');
const Product = require('./../../models/Product');
const { alreadyExists } = require('./../shared/error-codes');


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

const methods = {
	getProduct,
};

module.exports = methods;
