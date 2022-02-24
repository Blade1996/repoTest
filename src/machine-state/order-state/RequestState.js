/* eslint-disable class-methods-use-this */

'use strict';

const OrderState = require('../OrderState');
const Boom = require('boom');
const { canceled, confirmed } = require('./../../models/enums/type-ms-order-states');
const OrderStates = require('./../../models/OrderStates');
const {
	deliverMethodNotAllowed,
	directMethodNotAllowed,
	pickUpMethodNotAllowed,
} = require('./../../api/shared/error-codes');

class RequestState extends OrderState {
	constructor(order) {
		super();
		this.order = order;
	}

	async cancel() {
		const orderStates = await OrderStates.getByCode(canceled);
		return orderStates.id;
	}

	async confirm() {
		const orderStates = await OrderStates.getByCode(confirmed);
		return orderStates.id;
	}

	direct() {
		return Boom.badRequest(directMethodNotAllowed);
	}

	pickUp() {
		return Boom.badRequest(pickUpMethodNotAllowed);
	}

	deliver() {
		return Boom.badRequest(deliverMethodNotAllowed);
	}
}

module.exports = RequestState;
