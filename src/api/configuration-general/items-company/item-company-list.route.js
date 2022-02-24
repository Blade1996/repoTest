'use strict';

const handler = require('./item-company-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/items-company',
};

module.exports = route;
