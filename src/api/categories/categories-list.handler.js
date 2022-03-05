'use strict';

const Boom = require('boom');
const Categories = require('../../models/Categories');

async function handler() {
	try {
		const categoriesList = await Categories.getAll();
		return categoriesList;
	} catch (error) {
		return Boom.badRequest(error, error);
	}
}

module.exports = handler;
