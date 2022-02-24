'use strict';

const Joi = require('joi');
const { failAction } = require('./../../shared/httpHelper');
const handler = require('./item-company-create.handler');

const route = {
	handler,
	method: 'POST',
	path: '/items-company',
	options: {
		validate: {
			payload: {
				name: Joi.string()
					.required()
					.max(200),
				code: Joi.string().allow('', null),
				dataState: Joi.object().required(),
				salSaleColumns: Joi.object(),
				urlImage: Joi.string().allow('', null),
				urlIcon: Joi.string().allow('', null),
			},
			failAction,
		},
	},
};

module.exports = route;
