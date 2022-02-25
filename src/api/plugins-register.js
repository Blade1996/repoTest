'use strict';

const raven = require('hapi-raven');
const statusPlugin = require('hapijs-status-monitor');
const { isDevOrProd } = require('../shared/helper');
const pagiJapi = require('./shared/paginate');
const countryPlugin = require('./countries/countries.plugin');
const dashboardPlugin = require('./configuration-general/dashboard/dashboard-plugin');

// const hapiAxios = require('./shared/axios');

const plugins = [pagiJapi, countryPlugin, dashboardPlugin];

if (isDevOrProd()) {
	plugins.push({
		plugin: raven,
		options: {
			environment: process.env.NODE_ENV,
			dsn: process.env.SENTRY_DNS,
		},
	});

	plugins.push({
		plugin: statusPlugin,
		options: {
			path: '/',
			title: 'Sales Maki',
			routeConfig: {
				auth: false,
			},
		},
	});
}

module.exports = plugins;
