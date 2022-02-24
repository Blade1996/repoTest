'use strict';

const Joi = require('joi');
const handler = require('./item-company-delete.handler');
const { validateCommerce } = require('./items-company.pre');

const route = {
	handler,
	method: 'DELETE',
	options: {
		pre: [
			{
				assign: 'integrationType',
				method: validateCommerce,
			},
		],
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
