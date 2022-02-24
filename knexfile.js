'use strict';

require('dotenv').config();

const config = {
	codeship: {
		client: 'mysql',
		debug: true,
		connection: {
			database: process.env.DB_NAME_CS,
			host: process.env.DB_HOST_CS,
			user: process.env.DB_USER_CS,
			password: process.env.DB_PASS_CS,
			port: process.env.DB_PORT_CS,
		},
		migrations: {
			tableName: process.env.DB_TABLE_MIGRATIONS,
		},
	},
	development: {
		client: 'mysql',
		debug: true,
		connection: {
			database: process.env.DB_NAME_DEV,
			host: process.env.DB_HOST_DEV,
			user: process.env.DB_USER_DEV,
			password: process.env.DB_PASS_DEV,
			port: process.env.DB_PORT_DEV,
		},
		migrations: {
			tableName: process.env.DB_TABLE_MIGRATIONS,
		},
	},
	production: {
		client: 'mysql',
		debug: false,
		connection: {
			database: process.env.DB_NAME_PROD,
			host: process.env.DB_HOST_PROD,
			user: process.env.DB_USER_PROD,
			password: process.env.DB_PASS_PROD,
			port: process.env.DB_PORT_PROD,
		},
		migrations: {
			tableName: process.env.DB_TABLE_MIGRATIONS,
		},
	},
	test: {
		client: 'mysql',
		debug: true,
		connection: {
			database: process.env.DB_NAME_TEST,
			host: process.env.DB_HOST_TEST,
			user: process.env.DB_USER_TEST,
			password: process.env.DB_PASS_TEST,
			port: process.env.DB_PORT_TEST,
		},
		migrations: {
			tableName: process.env.DB_TABLE_MIGRATIONS,
		},
	},
};

module.exports = config[process.env.NODE_ENV];
