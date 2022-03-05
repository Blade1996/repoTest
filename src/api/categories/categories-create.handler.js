'use strict';

const Categories = require('./../../models/Categories');
const Boom = require('boom');

async function handler(request) {
	try {
		const data = request.payload;
		const newActivity = await Categories.create(data);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
