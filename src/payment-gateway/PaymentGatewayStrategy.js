/* eslint-disable class-methods-use-this */

'use strict';

const Niubiz = require('./payment-strategies/Niubiz');
const Xchange = require('./payment-strategies/Xchange');
const PagoPlux = require('./payment-strategies/PagoPlux');
const LeadGods = require('./payment-strategies/LeadGods');
const DataFast = require('./payment-strategies/DataFast');
const Paymentez = require('./payment-strategies/Paymentez');
const PlaceToPay = require('./payment-strategies/PlaceToPay');
const MercadoPago = require('./payment-strategies/MercadoPago');
const MiddEcommerce = require('./payment-strategies/MiddEcommerce');
const Alignet = require('./payment-strategies/Alignet');
const {
	niubiz,
	shopify,
	xchange,
	alignet,
	datafast,
	pagoplux,
	leadgods,
	paymentez,
	niubizSdk,
	placetopay,
	woocommerce,
	mercadopago,
	mercadopagoMp,
	pagopluxLink,
} = require('./payment-strategies/payment-strategies-codes');

class PaymentGatewayStrategy {
	constructor(order, paymentStrategyCode, categoryCode = undefined) {
		this.order = order;
		this.categoryCode = categoryCode;
		this.paymentGatewayStrategy = this.getPaymentGateway(paymentStrategyCode);
	}

	getPaymentGateway(paymentStrategyCode) {
		const strategies = {
			[mercadopago]: () => new MercadoPago(this.order, this.categoryCode),
			[mercadopagoMp]: () => new MercadoPago(this.order, this.categoryCode, paymentStrategyCode),
			[placetopay]: () => new PlaceToPay(this.order, this.categoryCode),
			[datafast]: () => new DataFast(this.order, this.categoryCode),
			[pagoplux]: () => new PagoPlux(this.order, this.categoryCode),
			[pagopluxLink]: () => new PagoPlux(this.order, this.categoryCode),
			[alignet]: () => new Alignet(this.order, this.categoryCode),
			[niubiz]: () => new Niubiz(this.order, this.categoryCode),
			[niubizSdk]: () => new Niubiz(this.order, 'SDK'),
			[paymentez]: () => new Paymentez(this.order),
			[leadgods]: () => new LeadGods(this.order),
			[xchange]: () => new Xchange(this.order),
			[shopify]: () => new MiddEcommerce(this.order),
			[woocommerce]: () => new MiddEcommerce(this.order, woocommerce),
		};
		return strategies[paymentStrategyCode] && strategies[paymentStrategyCode]();
	}

	getPaymentLink() {
		return this.paymentGatewayStrategy.getPaymentLink();
	}

	createCommerce(params = {}) {
		if ([leadgods, mercadopagoMp, shopify, woocommerce].indexOf(params.code) > -1) {
			return this.paymentGatewayStrategy.createCommerce(params);
		}
		return this.paymentGatewayStrategy
			? this.paymentGatewayStrategy.getPaymentGatewayInformation()
			: {};
	}

	getCheckoutInformation(params) {
		return this.paymentGatewayStrategy.getCheckoutInformation(params);
	}

	validateTransaction(h, query) {
		return this.paymentGatewayStrategy.validateTransaction(h, query);
	}

	authorizeTransaction(h, payload) {
		return this.paymentGatewayStrategy.authorizeTransaction(h, payload);
	}

	getPaymentGatewayInformation() {
		return this.paymentGatewayStrategy.getPaymentGatewayInformation();
	}

	getRefundTransaction() {
		return this.paymentGatewayStrategy.getRefundTransaction();
	}

	getStatusTransaction() {
		return this.paymentGatewayStrategy.getStatusTransaction();
	}

	getAllTransaction(query) {
		return this.paymentGatewayStrategy.getAllTransaction(query);
	}

	saveTransaction() {
		return this.paymentGatewayStrategy.saveTransaction();
	}

	getTotalPayment() {
		return this.paymentGatewayStrategy.getTotalPayment();
	}

	getCurrency() {
		return this.paymentGatewayStrategy.getCurrency();
	}
}

module.exports = PaymentGatewayStrategy;
