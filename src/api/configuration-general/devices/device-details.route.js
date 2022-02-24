'use strict';

const Joi = require('joi');
const handler = require('./device-details.handler');

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
	path: '/devices/{id}',
};

module.exports = route;
