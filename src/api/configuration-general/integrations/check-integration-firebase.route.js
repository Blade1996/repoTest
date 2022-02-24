'use strict';

const Joi = require('joi');
const handler = require('./check-integration-firebase.handler');
const pre = require('./integration.pre');

const route = {
	handler,
	method: 'GET',
	options: {
		pre: [
			{
				assign: 'subsidiaryDef',
				method: pre.validSubsidiaryDefault,
			},
		],
		validate: {
			query: {
				subsidiaryId: Joi.number()
					.integer()
					.allow(null),
			},
		},
	},
	path: '/integration-firebase',
};

module.exports = route;
