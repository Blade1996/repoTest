/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

'use strict';

const RedisCredential = require('../process-integration/redis-credential');
const errorCodes = require('./error-codes/payment-error-codes');

class PaymentGatewayContract {
	getPaymentLink() {
		throw new Error(errorCodes.paymentLinkFunctionMustBeImplemented);
	}

	getCheckoutInformation(auth, params) {
		try {
			return RedisCredential.getCredentials(auth, params);
		} catch (error) {
			throw new Error(errorCodes.checkoutInformationMustBeImplemented);
		}
	}

	validateTransaction(h) {
		throw new Error(errorCodes.validateTransactionFunctionMustBeImplemented);
	}

	saveTransaction() {
		throw new Error(errorCodes.saveTransactionFunctionNotImplemented);
	}

	getPaymentGatewayInformation() {
		throw new Error(errorCodes.paymentGatewayInformationFunctionMustBeImplemented);
	}

	getStatusTransaction() {
		throw new Error(errorCodes.statusTransactionFunctionMustBeImplemented);
	}

	getRefundTransaction() {
		throw new Error(errorCodes.refundTransactionFunctionMustBeImplemented);
	}

	getCurrency() {
		throw new Error(errorCodes.currencyFunctionMustBeImplemented);
	}

	getTotalPayment() {
		throw new Error(errorCodes.paymentCurrencyFunctionMustBeImplemented);
	}

	getAllTransaction(query) {
		throw new Error(errorCodes.paymentListTransactionFunctionMustBeImplemented);
	}

	authorizeTransaction(h, payload) {
		throw new Error(errorCodes.authorizeTransactionFunctionMustBeImplemented);
	}

	noMethod() {
		throw new Error(errorCodes.functionNotFound);
	}
}

module.exports = PaymentGatewayContract;
