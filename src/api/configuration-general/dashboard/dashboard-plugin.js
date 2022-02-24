'use strict';

const dashboardListRoute = require('./dashboard-list.route');

function register(server) {
	server.route(dashboardListRoute);
}

const plugin = {
	name: 'dashboard',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
