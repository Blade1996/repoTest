'use strict';

const { isDevOrProd } = require('../../shared/helper');
const { isNullOrUndefined } = require('util');
const axios = require('axios');

function getCompanyId(request) {
	return request.auth.credentials.cms_companies_id;
}

function defaultAxios(instance, request, { version, clearCookie } = {}) {
	const instancesAxios = request.server.plugins['hapi-axios'];
	if (isDevOrProd()) {
		let headers = {};
		const cookies = request.state;
		if (!isNullOrUndefined(cookies) && isNullOrUndefined(clearCookie)) {
			const keysCookie = Object.keys(cookies);
			const Cookie = keysCookie.reduce(
				(acum, item) => (acum ? `${acum}; ${item}=${cookies[item]}` : `${item}=${cookies[item]}`),
				null,
			);
			if (!isNullOrUndefined(Cookie)) {
				headers = Object.assign({ Cookie }, headers);
			}
		}
		if (version && !isNullOrUndefined(version)) {
			headers = Object.assign({ Accept: 'application/vnd.apiacl.v2+json' }, headers);
		}
		if (request.headers.authorization) {
			const { credentials } = request.auth;
			let { authorization } = request.headers;
			if (credentials) {
				const { authorization: authorizationToken } = credentials;
				if (authorizationToken) {
					authorization = authorizationToken;
					delete headers.Cookie;
				}
			}
			headers = Object.assign(
				{
					authorization,
				},
				headers,
			);
		}
		instancesAxios[instance].defaults.headers = { ...headers };
	} else {
		instancesAxios[instance] = axios;
	}
	return { ...instancesAxios[instance] };
}

const methods = {
	getCompanyId,
	defaultAxios,
};

module.exports = methods;
