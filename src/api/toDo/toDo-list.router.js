'use strict';

const handler = require('./toDo-list.handler');

const route = {
	handler,
	method: 'GET',
	path: '/to-do',
	options: {
		auth: false,
	},
};

module.exports = route;
