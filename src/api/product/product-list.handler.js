'use strict';

const Boom = require('boom');
const Product = require('../../models/Product');

async function handler() {
	try {
		const productList = await Product.getAll();
		return productList;
	} catch (error) {
		return Boom.badRequest(error, error);
	}
}

module.exports = handler;
