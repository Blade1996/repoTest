'use strict';

const handler = require('./user-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/user',
	options: {
		auth: false,
	},
};

module.exports = route;
