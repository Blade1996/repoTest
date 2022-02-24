'use strict';

const Joi = require('joi');
const handler = require('./type-process-migration.handler');

const route = {
	handler,
	method: 'POST',
	options: {
		auth: false,
		validate: {
			payload: {
				data: Joi.object().default({}),
				typeOperation: Joi.number()
					.integer()
					.valid(1, 2, 3),
			},
		},
	},
	path: '/type-process/migration',
};

module.exports = route;
