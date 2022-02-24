'use strict';

const processListRoute = require('./process-list.route');
const processDetailsRoute = require('./process-details.route');
const processUpdateRoute = require('./process-update.route');
const processUpdateActiveRoute = require('./process-update-active.route');
const processTemplateCreate = require('./process-template-create.route');
const { getConfigSync, getConfigSyncKey } = require('./process.methods');
const { isDevOrProd } = require('../../../shared/helper');

function register(server) {
	server.route(processListRoute);
	server.route(processDetailsRoute);
	server.route(processUpdateRoute);
	server.route(processUpdateActiveRoute);
	server.route(processTemplateCreate);
	server.method('getConfigSync', getConfigSync, {
		cache: {
			cache: 'redisCache',
			expiresIn: isDevOrProd() ? 3600 * 1000 : 1,
			generateTimeout: 5000,
		},
		generateKey: getConfigSyncKey,
	});
}

const plugin = {
	name: 'process',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
