'use strict';

const Product = require('../../models/Product');
const Boom = require('boom');

async function handler(request) {
	try {
		const { id } = request.params;
		const newActivity = await Product.remove(id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;