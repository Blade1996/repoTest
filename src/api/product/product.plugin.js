'use strict';

const productListRoute = require('./product-list.router');
const productCreateRoute = require('./product-create.route');

function register(server) {
	server.route(productListRoute);
	server.route(productCreateRoute);
}

const plugin = {
	name: 'to-do',
	version: '1.0.0',
	register,
};

module.exports = plugin;

