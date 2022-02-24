/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const NotAssignedState = require('./models/NotAssignedState');
const AcceptedState = require('./models/AcceptedState');
const InPlaceOriginState = require('./models/InPlaceOriginState');
const InRoadDeliveryState = require('./models/InRoadDeliveryState');
const InPlaceDestinyState = require('./models/InPlaceDestinyState');
const BackToOriginState = require('./models/BackToOriginState');
const GivenDeliveryState = require('./models/GivenDeliveryState');
const {
	notAssigned,
	accepted,
	inPlaceOrigin,
	inRoadDelivery,
	inPlaceDestiny,
	backToOrigin,
	givenDelivery,
} = require('./../../models/enums/order-delivery-state-enum');

class OrderDeliveryStateMachine {
	constructor(order, delivery, credentials, collectData) {
		this.credentials = credentials;
		this.order = order;
		this.delivery = delivery;
		this.collectData = collectData;
		this.orderDeliveryStateModel = this._deliveryState();
	}

	_deliveryState() {
		const additionalInfo = this.order && this.order.additionalInfo;
		let { deliveryState } = additionalInfo || { deliveryState: notAssigned };
		deliveryState = deliveryState || notAssigned;
		const options = {
			[notAssigned]: () => new NotAssignedState(this.order, this.delivery, this.credentials),
			[accepted]: () => new AcceptedState(this.order, this.delivery, this.credentials),
			[inPlaceOrigin]: () => new InPlaceOriginState(this.order, this.delivery, this.credentials),
			[inRoadDelivery]: () => new InRoadDeliveryState(this.order, this.delivery, this.credentials),
			[inPlaceDestiny]: () => new InPlaceDestinyState(this.order, this.delivery, this.credentials),
			[backToOrigin]: () => new BackToOriginState(this.order, this.delivery, this.credentials),
			[givenDelivery]: () => new GivenDeliveryState(this.order, this.delivery, this.credentials),
		};
		return options[deliveryState]();
	}

	async changeDeliveryState(state) {
		// console.log(this.collectData, state);
		const options = {
			[notAssigned]: () => this.orderDeliveryStateModel.unAssign(),
			[accepted]: () => this.orderDeliveryStateModel.accept(),
			[inPlaceOrigin]: () => this.orderDeliveryStateModel.inPlaceOrigin(),
			[inRoadDelivery]: () => this.orderDeliveryStateModel.inRoadDelivery(),
			[inPlaceDestiny]: () => this.orderDeliveryStateModel.inPlaceDestiny(),
			[backToOrigin]: () => this.orderDeliveryStateModel.backToOrigin(),
			[givenDelivery]: () => this.orderDeliveryStateModel.givenDelivery(this.collectData),
		};
		const functionToCommit = options[state];
		if (!functionToCommit) {
			this.orderDeliveryStateModel.noMethod();
		}
		await functionToCommit();
	}

	sendResponse() {
		return this.orderDeliveryStateModel.sendResponse();
	}
}

module.exports = OrderDeliveryStateMachine;
