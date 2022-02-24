/* eslint-disable class-methods-use-this */

'use strict';

const Firebase = require('./apis-strategies/Firebase');
const Quipu = require('./apis-strategies/Quipu');
const { firebaseSync, quipu } = require('./apis-strategies/apis-strategies-codes');

class ExternalApisStrategy {
	constructor(data, apiStrategyCode, categoryCode = undefined) {
		this.data = data;
		this.categoryCode = categoryCode;
		this.externalApiStrategy = this.getExternalApi(apiStrategyCode);
	}

	getExternalApi(apiStrategyCode) {
		const strategies = {
			[firebaseSync]: () => new Firebase(this.data, this.categoryCode),
			[quipu]: () => new Quipu(this.data, this.categoryCode),
		};
		return strategies[apiStrategyCode] && strategies[apiStrategyCode]();
	}

	configInit(params = {}) {
		return this.externalApiStrategy.configInit(params);
	}

	getInformation(params) {
		return this.externalApiStrategy.getInformation(params);
	}

	create(params = {}) {
		return this.externalApiStrategy.create(params);
	}

	createComplete(params = {}) {
		return this.externalApiStrategy.createComplete(params);
	}
}

module.exports = ExternalApisStrategy;
