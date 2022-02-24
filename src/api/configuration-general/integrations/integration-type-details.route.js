'use strict';

const Joi = require('joi');
const handler = require('./integration-type-details.handler');
const { getIntegrationType, validSubsidiaryDefault } = require('./integration.pre');

const route = {
	handler,
	method: 'GET',
	options: {
		pre: [
			{
				assign: 'integrationType',
				method: getIntegrationType,
			},
			{
				assign: 'subsidiaryDefault',
				method: validSubsidiaryDefault,
			},
		],
		validate: {
			params: {
				codeType: Joi.string().required(),
			},
		},
	},
	path: '/integrations/{codeType}',
};

module.exports = route;
