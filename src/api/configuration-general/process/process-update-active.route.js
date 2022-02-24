'use strict';

const Joi = require('joi');
const handler = require('./process-update-active.handler');

const route = {
	handler,
	method: 'PATCH',
	options: {
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.required(),
			},
			payload: {
				flagActive: Joi.any(),
			},
		},
	},
	path: '/process/{id}/active',
};

module.exports = route;
