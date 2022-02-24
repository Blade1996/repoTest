'use strict';

const devicesListRoute = require('./device-list.route');
const devicesDetailsRoute = require('./device-details.route');
const devicesValidationRoute = require('./device-validation.route');
const devicesDisconnectUserRoute = require('./device-disconnect-user.route');
const devicesDisconnectRoute = require('./device-disconnect.route');

function register(server) {
	server.route(devicesListRoute);
	server.route(devicesDetailsRoute);
	server.route(devicesValidationRoute);
	server.route(devicesDisconnectUserRoute);
	server.route(devicesDisconnectRoute);
}

const plugin = {
	name: 'devices',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
