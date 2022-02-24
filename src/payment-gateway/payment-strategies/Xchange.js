/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const PaymentGatewayContract = require('../PaymentGatewayContract');
const SalOrders = require('../../models/SalOrders');
const GatewayTransaction = require('../../models/GatewayTransaction');
const MsWayPayment = require('../../models/MsWayPayment');
const RedisCredential = require('../../process-integration/redis-credential');
const { isDevOrProd } = require('./../../shared/helper');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { payOut, pending } = require('../../models/PaymentState');
const { validated } = require('../../models/StatusOrders');
const { xchange } = require('./../payment-strategies/payment-strategies-codes');
const { paymentButton } = require('../type-payment-gateway-enums');
const ModuleCode = require('../../models/ModuleCode');
const {
	xchangeGatewayIncorrectlyConfigured,
	xchangeValidationResponseNotProvided,
} = require('./../error-codes/payment-error-codes');

class Xchange extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.order = order;
		this.hash = '';
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getPaymentLink() {
		// TODO implement payment link generator method
		return 'link_pago';
	}

	async saveTransaction(params) {
		const gatewayInfo = this.getPaymentGatewayInformation();
		this.hash = await buildAndGenerateTransactionHash(
			this.order.id,
			this.order.companyId,
			gatewayInfo.code,
		);
		const data = {
			code: this.hash,
			codeGateway: gatewayInfo.code,
			codeApp: this.order.codeApp,
			status: 1,
			paymentStates: 1,
			dateTransaction: new Date(),
			codeCategory: this.categoryCode,
			...params,
			commerceId: this.order.commerce.id,
			moduleId: ModuleCode.ecommerce,
			orderId: this.order.id,
			amount: this.getTotalPayment(),
			currency: this.getCurrency(),
			companyId: this.order.companyId,
			additionalInformation: {
				payboxProduction: this.environment === 'prod' || false,
			},
		};
		return GatewayTransaction.create(data);
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse) {
		const data = {
			status: succeed ? 2 : 1,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const editOrder = {
				sessionGateway: {
					total: this.getTotalPayment(),
				},
				dateExpiration: null,
				status: 1,
			};
			await this.registerOrderGateway(editOrder);
			return h
				.response({
					email: gateway.email,
					username: gateway.username,
					total: this.getTotalPayment(),
					curency: this.getCurrency(),
					payboxProduction: gateway.payboxProduction === 'production' || false,
					responsibleEmail: this.order.responsiblePickUp && this.order.responsiblePickUp.email,
					responsibleName: this.order.responsiblePickUp && this.order.responsiblePickUp.name,
					hash: this.hash,
				})
				.code(201);
		}
		throw new Error(xchangeGatewayIncorrectlyConfigured);
	}

	async registerOrderGateway(params) {
		const { commerceId, commerce } = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
			const { wayPaymentCommerce } = this.order;
			const newGatewayTransaction = await this.saveTransaction(paramsNew);
			paramsNew.additionalInformation = { gatewayTransactionId: newGatewayTransaction.id };
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			paramsNew.wayPaymentId = wayPaymentCommerce ? wayPaymentCommerce.wayPaymentId : undefined;
		} else {
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			const { gatewayTransactionId, paymentGateway } = paramsNew.additionalInformation;
			const gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayResponse,
				tokenGateway: paymentGateway.authorizationCode,
				referenceId: paymentGateway.referenceId,
			};
			paramsNew.tokenGateway = paymentGateway.authorizationCode;
			paramsNew.referenceId = paymentGateway.referenceId;
			if (!params.flagApproval) {
				gatewayTransaction.gatewayErrorCode = `code: ${paymentGateway.status || null}`;
				paramsNew.gatewayErrorCode = `code: ${paymentGateway.status || null}`;
			}
			await this._updateTransaction(gatewayTransactionId, params.flagApproval, gatewayTransaction);
		}
		if (!commerceId) {
			paramsNew.commerceId = commerce.id;
		}
		delete paramsNew.gatewayResponse;
		delete paramsNew.dateExpiration;
		delete paramsNew.paymentStates;
		delete paramsNew.codeCategory;
		delete paramsNew.referenceId;
		delete paramsNew.status;
		return SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		if (isDevOrProd() && auth) {
			const { subsidiary } = commerce;
			const params = {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				categoryCode: this.categoryCode,
				integrationCode: xchange,
			};
			const dataGateWay = await RedisCredential.getCredentials(auth, params);
			if (dataGateWay && dataGateWay.credentials_key) {
				this.environment =
					dataGateWay.credentials_key.payboxProduction === 'production' ? 'prod' : 'dev';
				return dataGateWay.credentials_key;
			}
		} else if (
			wayPaymentCommerce &&
			wayPaymentCommerce.gatewayConfiguration &&
			wayPaymentCommerce.gatewayConfiguration.length > 0
		) {
			const { gatewayConfiguration } = wayPaymentCommerce;
			return gatewayConfiguration.find(item => item.code === xchange);
		}
		return undefined;
	}

	async validateTransaction(h, query) {
		const { gatewayResponse } = this.order;
		if (!gatewayResponse) {
			throw new Error(xchangeValidationResponseNotProvided);
		}
		const succeed = gatewayResponse.status === 'succeeded';

		const additionalInformation = await this.registerOrderGateway({
			gatewayAuthorizationResponse: gatewayResponse,
			gatewayResponse,
			paymentStateId: succeed ? payOut : pending,
			flagStatusOrder: validated,
			flagApproval: succeed,
		});
		if (query.wayPaymentId) {
			const wayPaymentId = Number(query.wayPaymentId);
			const wayPayment = await MsWayPayment.getById(wayPaymentId);
			if (wayPayment) {
				this.order.wayPayment = wayPayment;
			}
		}
		if (succeed && isDevOrProd()) {
			await SalOrders.handleNotification({
				order: this.order,
				wayPayment: this.order.wayPayment,
				paymentGateway: additionalInformation.paymentGateway,
			});
		}
		if (query.uri) {
			return h.redirect(`${this.order.commerce.urlDomain}/${query.uri}?orderId=${this.order.id}`);
		}
		return gatewayResponse;
	}

	getPaymentGatewayInformation() {
		return {
			code: xchange,
			name: 'Xchange',
			description: 'Método de pago Xchange',
		};
	}

	_structureAdditionalInformation(data) {
		const { additionalInformation: additionalInformationNew, gatewayResponse } = data;

		let { additionalInformation } = this.order;
		additionalInformation = additionalInformation || {};
		let { paymentGateway } = additionalInformation;
		if (additionalInformationNew && additionalInformationNew.gatewayTransactionId) {
			additionalInformation.gatewayTransactionId = additionalInformationNew.gatewayTransactionId;
		}

		paymentGateway = paymentGateway || {};
		const transaction = gatewayResponse || {};
		if (transaction) {
			paymentGateway.referenceId = transaction.id_transaccion || null;
			paymentGateway.authorizationCode = transaction.token || null;
			paymentGateway.status = transaction.status;
		}
		additionalInformation.gatewayCode = xchange;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = Xchange;
