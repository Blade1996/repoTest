'use strict';

const handler = require('./device-validation.handler');
const { valideDevice } = require('../../../shared/validations');

const route = {
	handler,
	method: 'GET',
	options: {
		pre: [
			{
				assign: 'skipDeviceValidation',
				method: valideDevice,
			},
		],
	},
	path: '/devices-validation',
};

module.exports = route;
