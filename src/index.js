'use strict';

require('dotenv').config();
const glueManifest = require('./api/server');

/* eslint-disable no-console */

async function startServer() {
	try {
		const server = await glueManifest;
		await server.start();
		console.log(`Server started at ${server.info.uri}`);
	} catch (error) {
		console.log('Index Js', error);
		throw new Error(error);
	}
}

startServer();
