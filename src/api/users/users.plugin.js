'use strict';

const userListRoute = require('./users-list.route');
const userCreateRoute = require('./users-create.route');
const userUpdateRoute = require('./users-update.route');
const userDeleteRoute = require('./users-delete.route');

function register(server) {
	server.route(userListRoute);
	server.route(userCreateRoute);
	server.route(userUpdateRoute);
	server.route(userDeleteRoute);
}

const plugin = {
	name: 'user',
	version: '1.0.0',
	register,
};

module.exports = plugin;
