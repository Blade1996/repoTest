'use strict';

const catboxRedis = require('catbox-redis');

const cache = [
	{
		name: 'redisCache',
		engine: catboxRedis,
		host: process.env.REDIS_HOST_SALE,
		port: process.env.REDIS_PORT_SALE,
		partition: process.env.CATBOX_PARTITION_SALE,
	},
];

module.exports = cache;
