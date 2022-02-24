'use strict';

const Boom = require('boom');
const RedisCredential = require('../../../process-integration/redis-credential');
const { isDevOrProd } = require('../../../shared/helper');
const { firebaseSync } = require('../../../external-apis/apis-strategies/apis-strategies-codes');
const { applicationPersistence } = require('../../../external-apis/category-external-apis-enums');

async function handler(request, h) {
	try {
		const { subsidiaryDef } = request.pre;
		let credentials = {};
		if (isDevOrProd() && request.auth.credentials) {
			const params = {
				subsidiaryCode: subsidiaryDef.subsidiaryAclCode,
				categoryCode: applicationPersistence,
				integrationCode: firebaseSync,
			};
			const data = await RedisCredential.getCredentials(request.auth.credentials, params);
			if (data && data.credentials_key) {
				credentials = data.credentials_key;
				credentials.privateKey = JSON.parse(credentials.privateKey) || {};
			}
		}
		return h.response(credentials);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
