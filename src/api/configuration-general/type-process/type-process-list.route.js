'use strict';

const handler = require('./type-process-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/type-process',
};

module.exports = route;
