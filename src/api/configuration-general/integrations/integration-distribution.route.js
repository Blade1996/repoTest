'use strict';

const Joi = require('joi');
const handler = require('./integration-distribution.handler');
const { failAction } = require('./../../shared/httpHelper');
const { validAclCode } = require('./integration.pre');

const route = {
	handler,
	method: 'PATCH',
	options: {
		auth: false,
		pre: [
			{
				assign: 'companies',
				method: validAclCode,
			},
		],
		validate: {
			payload: {
				process: Joi.array().items(Joi.object()),
				integration: Joi.array().items(Joi.object()),
				companiesAclCode: Joi.array()
					.required()
					.min(1)
					.items(Joi.object({
						subsidiariesCodes: Joi.array()
							.items(Joi.string())
							.allow(null),
						code: Joi.string().required(),
					})),
			},
			failAction,
		},
	},
	path: '/integrations/distribution',
};

module.exports = route;
