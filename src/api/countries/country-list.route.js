'use strict';

const handler = require('./country-list.handler.js');

const route = {
	handler,
	method: 'GET',
	path: '/countries',
};

module.exports = route;
