'use strict';

const axios = require('axios');
const redis = require('redis');
const bluebird = require('bluebird');
const admin = require('firebase-admin');
const { isDevOrProd, isNullOrUndefined } = require('./shared/helper');
const RedisCredential = require('./process-integration/redis-credential');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

/** @type {RedisClient} */
let client = null;

if (isDevOrProd()) {
	client = redis.createClient({
		host: process.env.REDIS_LICESES_HOST,
		port: process.env.REDIS_LICESES_PORT,
	});
	client.on('error', (err) => {
		/* eslint-disable no-console */
		console.log(`Error Redis ${err}`);
	});
}

/**
 * @returns {Promise}
 */
function findCredentialRedis(currentKey) {
	return client.getAsync(currentKey);
}

function startServer() {
	let db = {};

	// eslint-disable-next-line func-names
	this.initConnection = async function (credentials) {
		if (isDevOrProd()) {
			let dataFirebase;
			const { subsidiaryFilters } = credentials;
			const codeCredential = credentials.flagSync ? credentials.codeSync : null;
			if (subsidiaryFilters) {
				dataFirebase = await RedisCredential.getCredentials(credentials, subsidiaryFilters);
				if (!isNullOrUndefined(dataFirebase) && dataFirebase.credentials_key) {
					dataFirebase = dataFirebase.credentials_key;
					dataFirebase.flagRest = !!(dataFirebase.flagRest && dataFirebase.flagRest === 'SI');
				} else {
					dataFirebase = undefined;
				}
			}
			if (!dataFirebase && !isNullOrUndefined(codeCredential)) {
				dataFirebase = {};
				const currentKey = `${process.env.REDIS_LICESES_DB}${codeCredential}`;
				dataFirebase.privateKey = await findCredentialRedis(currentKey);
				dataFirebase.databaseURL = credentials.databaseURL;
				dataFirebase.secret = credentials.secret;
				dataFirebase.flagRest = !!credentials.flagRest;
			}
			if (dataFirebase && dataFirebase.flagRest) {
				return dataFirebase;
			} else if (dataFirebase) {
				const newApp = `${Math.random() * 10000}${codeCredential}`;

				// console.log('RESPONSE DTA CONSULTA', dataFirebase.databaseURL, newApp);
				admin.initializeApp(
					{
						credential: admin.credential.cert(JSON.parse(dataFirebase.privateKey)),
						databaseURL: dataFirebase.databaseURL,
					},
					newApp,
				);
				db = admin.app(newApp);
				return db.database();
			}
		}
		return null;
	};

	// eslint-disable-next-line func-names
	this.closeConnection = function () {
		return db.delete();
	};

	// eslint-disable-next-line func-names
	this.syncApiRestFb = async function (config, path, data, method = 'POST') {
		return axios({
			url: `${config.databaseURL}/${path}.json?auth=${config.secret}`,
			method,
			data,
			validateStatus: () => true,
		});
	};
}

module.exports = startServer;
