'use strict';

const Joi = require('joi');
const handler = require('./country-list.handler');

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
	path: '/countries/{id}',
};

module.exports = route;
