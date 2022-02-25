'use strict';

/* istanbul ignore next */
const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let client = null;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
	client = redis.createClient({
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
	});
	client.on('error', (err) => {
		/* eslint-disable no-console */
		console.log(`Error Redis ${err}`);
	});
}

class RedisClass {
	static setDataKey(key, data = '') {
		try {
			return client.setAsync(key, data);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(`Error to setDataKey key ${key}: ${error}`);
			return error;
		}
	}

	static getDataKey(key) {
		try {
			const data = client.getAsync(key);
			return data;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(`Error to getDataKey key ${key}: ${error}`);
			return error;
		}
	}

	static deleteKey(key) {
		try {
			return client.delAsync(key);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(`Error to deleteKey key ${key}: ${error}`);
			return error;
		}
	}

	static expireKey(key) {
		try {
			return client.expire(key, 3600 * 60);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log(`Error to expireKey key ${key}: ${error}`);
			return error;
		}
	}
}
module.exports = RedisClass;
