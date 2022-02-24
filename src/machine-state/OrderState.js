/* eslint-disable class-methods-use-this */

'use strict';

const { functionNotFound } = require('./../../src/api/shared/error-codes');

class OrderState {
	cancel() {
		throw new Error('CANCEL_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	confirm() {
		throw new Error('CONFIRM_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	direct() {
		throw new Error('DIRECT_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	pickUp() {
		throw new Error('PICK_UP_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	deliver() {
		throw new Error('DELIVER_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	noMethod() {
		throw new Error(functionNotFound);
	}
}

module.exports = OrderState;
