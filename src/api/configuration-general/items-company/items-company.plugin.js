'use strict';

const itemCreateRoute = require('./item-company-create.route');
const itemListRoute = require('./item-company-list.route');
const itemDetailsRoute = require('./item-company-details.route');
const itemUpdateRoute = require('./item-company-update.route');
const itemDeleteRoute = require('./item-company-delete.route');

function register(server) {
	server.route(itemListRoute);
	server.route(itemDetailsRoute);
	server.route(itemCreateRoute);
	server.route(itemUpdateRoute);
	server.route(itemDeleteRoute);
}

const plugin = {
	name: 'items-company',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
