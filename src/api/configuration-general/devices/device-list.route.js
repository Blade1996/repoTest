'use strict';

const handler = require('./device-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/devices',
};

module.exports = route;
