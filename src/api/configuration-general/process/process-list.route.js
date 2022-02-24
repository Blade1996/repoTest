'use strict';

const handler = require('./process-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/process',
};

module.exports = route;
