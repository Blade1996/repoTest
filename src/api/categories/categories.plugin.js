'use strict';

const categoriesListRoute = require('./categories-list.router');
const categoriesCreateRoute = require('./categories-create.route');

function register(server) {
	server.route(categoriesListRoute);
	server.route(categoriesCreateRoute);
}

const plugin = {
	name: 'categories',
	version: '1.0.0',
	register,
};

module.exports = plugin;

