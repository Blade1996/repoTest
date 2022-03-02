'use strict';

const toDoListRoute = require('./toDo-list.router');
const toDoCreateRoute = require('./toDo-create.route');

function register(server) {
	server.route(toDoListRoute);
	server.route(toDoCreateRoute);
}

const plugin = {
	name: 'to-do',
	version: '1.0.0',
	register,
};

module.exports = plugin;

