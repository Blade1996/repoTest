/* eslint-disable class-methods-use-this */

'use strict';

const RequestState = require('./order-state/RequestState');
const { requested } = require('../models/enums/type-ms-order-states');
const {
	cancel,
	confirm,
	direct,
	pickUp,
	deliver,
} = require('../models/enums/order-state-methods-enum');

class MachineOrderState {
	constructor(order) {
		this.order = order;
		this.orderStateObject = this.state(order);
	}

	state(order) {
		const options = {
			[requested]: () => new RequestState(order),
		};
		const orderStateCode = order.orderState && order.orderState.code;
		return orderStateCode && options[orderStateCode] && options[orderStateCode]();
	}

	changeState(newStateMethod) {
		const methods = {
			[cancel]: () => this.orderStateObject.cancel(),
			[confirm]: () => this.orderStateObject.confirm(),
			[direct]: () => this.orderStateObject.direct(),
			[pickUp]: () => this.orderStateObject.pickUp(),
			[deliver]: () => this.orderStateObject.deliver(),
		};
		if (!methods[newStateMethod]) {
			return this.orderStateObject.noMethod();
		}
		return methods[newStateMethod]();
	}
}

module.exports = MachineOrderState;
