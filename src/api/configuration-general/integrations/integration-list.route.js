'use strict';

const Joi = require('joi');
const { failAction } = require('../../shared/httpHelper');
const handler = require('./integration-list.handler');
const { validSubsidiaryDefault } = require('./integration.pre');

const route = {
	handler,
	method: 'GET',
	options: {
		pre: [
			{
				assign: 'subsidiaryDefault',
				method: validSubsidiaryDefault,
			},
		],
		validate: {
			query: {
				subsidiaryId: Joi.number().integer(),
			},
			failAction,
		},
	},
	path: '/integrations',
};

module.exports = route;
