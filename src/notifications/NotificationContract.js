/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

'use strict';

const RedisCredential = require('../process-integration/redis-credential');
const errorCodes = require('./error-codes/notification-error-codes');

class NotificationContract {
	sendNotificationEmail() {
		throw new Error(errorCodes.functionNotFound);
	}

	getCheckoutInformation(auth, params) {
		try {
			return RedisCredential.getCredentials(auth, params);
		} catch (error) {
			throw new Error(errorCodes.checkoutInformationMustBeImplemented);
		}
	}

	getNotificationInformation() {
		throw new Error(errorCodes.paymentGatewayInformationFunctionMustBeImplemented);
	}

	noMethod() {
		throw new Error(errorCodes.functionNotFound);
	}
}

module.exports = NotificationContract;
