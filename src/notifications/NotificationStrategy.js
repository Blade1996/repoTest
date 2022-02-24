/* eslint-disable class-methods-use-this */

'use strict';

const Email = require('./notification-strategies/type-notification-email');
const Push = require('./notification-strategies/type-notification-push');
const Wsap = require('./notification-strategies/type-notification-wsap');
const {
	email,
	wsap,
	push,
	// wsapChat,
} = require('./notification-strategies/type-notifications-enums');

class notificationStrategy {
	constructor(data, notificationStrategyCode, categoryCode = undefined) {
		this.data = data;
		this.categoryCode = categoryCode;
		this.notificationGatewayStrategy = this.getTypeNotification(notificationStrategyCode);
	}

	getTypeNotification(notificationStrategyCode) {
		const strategies = {
			[email]: () => new Email(this.data, this.categoryCode),
			[wsap]: () => new Wsap(this.data),
			[push]: () => new Push(this.data),
			// [wsapChat]: () => new WsapChat(this.data),
		};
		return strategies[notificationStrategyCode] && strategies[notificationStrategyCode]();
	}

	sendNotificationEmail(params) {
		return this.notificationGatewayStrategy.sendNotificationEmail(params);
	}

	getCheckoutInformation(params) {
		return this.notificationGatewayStrategy.getCheckoutInformation(params);
	}

	getnotificationLink() {
		return this.notificationGatewayStrategy.getnotificationLink();
	}

	validateTransaction(h, query) {
		return this.notificationGatewayStrategy.validateTransaction(h, query);
	}
}

module.exports = notificationStrategy;
