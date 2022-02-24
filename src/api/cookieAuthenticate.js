'use strict';

const cookieAuthenticate = {
	ttl: 7 * 24 * 60 * 60 * 1000,
	isSecure: false,
	isHttpOnly: true,
	path: '/',
	encoding: 'none',
	isSameSite: 'Strict',
	strictHeader: true,
	clearInvalid: true,
	domain: null,
};

module.exports = cookieAuthenticate;
