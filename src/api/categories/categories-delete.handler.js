
'use strict';

const Categories = require('./../../models/Categories');
const Boom = require('boom');

async function handler(request) {
	try {
        const { id } = request.params;
		const newActivity = await Categories.remove(id);
		return newActivity;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
