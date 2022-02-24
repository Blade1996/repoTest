/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

'use strict';

const errorCodes = require('./error-codes/delivery-error-codes');

class ExternalApisContract {
	getInformation(auth, params) {
		try {
			return { auth, params };
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

	getPrice() {
		throw new Error(errorCodes.functionNotFound);
	}

	updateStatus() {
		throw new Error(errorCodes.functionNotFound);
	}
}

module.exports = ExternalApisContract;
