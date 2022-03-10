'use strict';

const categoriesListRoute = require('./categories-list.router');
const categoriesCreateRoute = require('./categories-create.route');
const categoriesupdateRoute = require('./categories-update.route');
const categoriesdeleteRoute = require('./categories-delete.route');


function register(server) {
	server.route(categoriesListRoute);
	server.route(categoriesCreateRoute);
	server.route(categoriesupdateRoute);
	server.route(categoriesdeleteRoute);

	
}

const plugin = {
	name: 'categories',
	version: '1.0.0',
	register,
};

module.exports = plugin;

