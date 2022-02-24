'use strict';

const Joi = require('joi');
const handler = require('./item-company-update.handler');

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
				name: Joi.string().required(),
				code: Joi.string().allow('', null),
				dataState: Joi.object().required(),
				salSaleColumns: Joi.object(),
				urlImage: Joi.string().allow('', null),
				urlIcon: Joi.string().allow('', null),
			},
		},
	},
	path: '/items-company/{id}',
};

module.exports = route;
