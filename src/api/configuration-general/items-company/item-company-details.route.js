'use strict';

const Joi = require('joi');
const handler = require('./item-company-details.handler');

const route = {
	handler,
	method: 'GET',
	options: {
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.required(),
			},
		},
	},
	path: '/items-company/{id}',
};

module.exports = route;
