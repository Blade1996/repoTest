'use strict';

const handler = require('./users-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/users',
	options: {
		auth: false,
	},
};

module.exports = route;
