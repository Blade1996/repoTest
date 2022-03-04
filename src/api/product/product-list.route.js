'use strict';

const handler = require('./product-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/product',
	options: {
		auth: false,
	},
};

module.exports = route;
