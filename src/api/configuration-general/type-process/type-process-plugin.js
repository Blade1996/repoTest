'use strict';

const typeProcessListRoute = require('./type-process-list.route');
const typeProcessMigrationRoute = require('./type-process-migration.route');

function register(server) {
	server.route(typeProcessListRoute);
	server.route(typeProcessMigrationRoute);
}

const plugin = {
	name: 'type-process',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
