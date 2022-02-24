/* eslint-disable class-methods-use-this */

'use strict';

const Aimo = require('./delivery-strategies/Aimo');
const Olva = require('./delivery-strategies/Olva');
const { aimo, olva } = require('./delivery-strategies/delivery-strategies-codes');

class ExternalApisStrategy {
	constructor(data, deliveryStrategyCode, categoryCode = undefined) {
		this.data = data;
		this.categoryCode = categoryCode;
		this.deliveryStrategy = this.getDelivery(deliveryStrategyCode);
	}

	getDelivery(deliveryStrategyCode) {
		const strategies = {
			[aimo]: () => new Aimo(this.data, this.categoryCode),
			[olva]: () => new Olva(this.data, this.categoryCode),
		};
		return strategies[deliveryStrategyCode] && strategies[deliveryStrategyCode]();
	}

	getInformation(params) {
		return this.deliveryStrategy.getInformation(params);
	}

	create(params = {}) {
		return this.deliveryStrategy.create(params);
	}

	createComplete(params = {}) {
		return this.deliveryStrategy.createComplete(params);
	}

	getPrice(params = {}) {
		return this.deliveryStrategy.getPrice(params);
	}

	updateStatus(params = {}) {
		return this.deliveryStrategy.updateStatus(params);
	}
}

module.exports = ExternalApisStrategy;
