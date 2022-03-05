'use strict';

const toDoListRoute = require('./toDo-list.router');
const toDoCreateRoute = require('./toDo-create.route');
const toDoUpdateRoute = require('./toDo-update.route');
const toDoDeleteRoute = require('./toDo-delete.route.js');

function register(server) {
	server.route(toDoListRoute);
	server.route(toDoCreateRoute);
	server.route(toDoUpdateRoute);
	server.route(toDoDeleteRoute);
}

const plugin = {
	name: 'to-do',
	version: '1.0.0',
	register,
};

module.exports = plugin;

