/* eslint-disable class-methods-use-this */

'use strict';

const { functionNotFound } = require('../../api/shared/error-codes');

class OrderDeliveryStateInterface {
	accept() {
		throw new Error('accept_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	inPlaceOrigin() {
		throw new Error('inPlaceOrigin_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	inRoadDelivery() {
		throw new Error('inRoadDelivery_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	inPlaceDestiny() {
		throw new Error('inPlaceDestiny_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	backToOrigin() {
		throw new Error('backToOrigin_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	givenDelivery() {
		throw new Error('givenDelivery_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	sendResponse() {
		throw new Error('sendResponse_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	sendNotifications() {
		throw new Error('sendNotifications_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	unAssign() {
		throw new Error('notAssign_FUNCTION_MUST_BE_IMPLEMENTED');
	}

	noMethod() {
		throw new Error(functionNotFound);
	}
}

module.exports = OrderDeliveryStateInterface;
