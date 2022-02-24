'use strict';

const countryListRoute = require('./country-list.route');
const countryDetailRoute = require('./country-details.route');

function register(server) {
	server.route(countryListRoute);
	server.route(countryDetailRoute);
}

const plugin = {
	name: 'countries',
	version: '1.0.0',
	register,
};

exports.plugin = plugin;
