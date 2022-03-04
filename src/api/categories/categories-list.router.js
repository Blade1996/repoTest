'use strict';

const handler = require('./categories-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/categories',
	options: {
		auth: false,
	},
};

module.exports = route;
                                                                  