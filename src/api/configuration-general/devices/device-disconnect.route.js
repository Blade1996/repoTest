'use strict';

const Joi = require('joi');
const handler = require('./device-disconnect.handler');
const { getDevice, validDisconnectDevice } = require('./device.pre');

const route = {
	handler,
	method: 'PATCH',
	options: {
		pre: [
			{
				assign: 'deviceSession',
				method: getDevice,
			},
			{
				method: validDisconnectDevice,
			},
		],
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.positive()
					.required(),
			},
		},
	},
	path: '/disconnect-devices/{id}',
};

module.exports = route;
