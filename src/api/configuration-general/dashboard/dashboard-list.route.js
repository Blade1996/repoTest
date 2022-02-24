'use strict';

const Joi = require('joi');
const handler = require('./dashboard-list.handler');

const route = {
	handler,
	method: 'GET',
	options: {
		auth: false,
		validate: {
			query: {
				aclCode: Joi.string().required(),
				startDate: Joi.any().required(),
				endDate: Joi.any().required(),
			},
		},
	},
	path: '/dashboard',
};

module.exports = route;
