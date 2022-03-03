'use strict';

const userListRoute = require('./users-list.route');
const userCreateRoute = require('./users-create.route');

function register(server) {
	server.route(userListRoute);
	server.route(userCreateRoute);
}

const plugin = {
	name: 'user',
	version: '1.0.0',
	register,
};

module.exports = plugin;
