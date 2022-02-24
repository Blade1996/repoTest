'use strict';

const Joi = require('joi');
const handler = require('./device-disconnect-user.handler');

const route = {
	handler,
	method: 'PATCH',
	options: {
		validate: {
			params: {
				userCode: Joi.string().required(),
			},
		},
	},
	path: '/disconnect-devices/{userCode}/user',
};

module.exports = route;
