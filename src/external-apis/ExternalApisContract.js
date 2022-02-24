/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

'use strict';

const RedisCredential = require('../process-integration/redis-credential');
const errorCodes = require('./error-codes/external-apis-error-codes');

class ExternalApisContract {
	configInit() {
		throw new Error(errorCodes.functionNotFound);
	}

	getInformation(auth, params) {
		try {
			return RedisCredential.getCredentials(auth, params);
		} catch (error) {
			throw new Error(errorCodes.informationMustBeImplemented);
		}
	}

	create() {
		throw new Error(errorCodes.functionNotFound);
	}

	createComplete() {
		throw new Error(errorCodes.functionNotFound);
	}
}

module.exports = ExternalApisContract;
