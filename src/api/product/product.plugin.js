'use strict';

const productListRoute = require('./product-list.route');
const productCreateRoute = require('./product-create.route');
const productUpdateRoute = require('./product-update.route');
const productDeleteRoute = require('./product-delete.route.js');

function register(server) {
	server.route(productListRoute);
	server.route(productCreateRoute);
	server.route(productUpdateRoute);
	server.route(productDeleteRoute);
}

const plugin = {
	name: 'product',
	version: '1.0.0',
	register,
};

module.exports = plugin;

