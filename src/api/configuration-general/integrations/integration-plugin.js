'use strict';

const integrationDistributionRoute = require('./integration-distribution.route');
const integrationFirebaseRoute = require('./check-integration-firebase.route');
const processDetailsRoute = require('./integration-type-details.route');
const processUpdateRoute = require('./integration-type-update.route');
const integrationsListRoute = require('./integration-list.route');
const { updateConfIntegration } = require('./integrations.events');

function register(server) {
	server.route(integrationDistributionRoute);
	server.route(integrationFirebaseRoute);
	server.route(processDetailsRoute);
	server.route(processUpdateRoute);
	server.route(integrationsListRoute);
	server.event('update_conf_integration');
	server.events.on('update_conf_integration', updateConfIntegration);
}

const plugin = {
	name: 'integrations',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
