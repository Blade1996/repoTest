'use strict';

const toDoListRoute = require('./toDo-list.router');

function register(server) {
	server.route(toDoListRoute);
}

const plugin = {
	name: 'to-do',
	version: '1.0.0',
	register,
};

module.exports = plugin;

