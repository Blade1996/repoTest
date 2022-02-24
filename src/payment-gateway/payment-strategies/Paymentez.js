/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const crypto = require('crypto');
const PaymentGatewayContract = require('../PaymentGatewayContract');
const SalOrders = require('../../models/SalOrders');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { isDevOrProd } = require('./../../shared/helper');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const {
	payOut, pending, refund, pendingRefund,
} = require('../../models/PaymentState');
const { validated } = require('../../models/StatusOrders');
const { paymentez } = require('./../payment-strategies/payment-strategies-codes');
const helper = require('./../../models/helper');
const { paymentButton } = require('../type-payment-gateway-enums');
const ModuleCode = require('../../models/ModuleCode');

const {
	paymentezGatewayIncorrectlyConfigured,
	paymentezValidationResponseNotProvided,
	gatewayPreviouslyCanceledTransaction,
	validTimeAutomaticRefundExceeded,
} = require('./../error-codes/payment-error-codes');

class Paymentez extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.order = order;
		this.hash = '';
		this.iva = 12;
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://ccapi-stg.paymentez.com',
			prod: 'https://ccapi.paymentez.com',
		};
		return url[this.environment];
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
		const { transaction } = gatewayResponse;
		const data = {
			status: succeed ? 2 : 1,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		if (transaction && transaction.id && transaction.authorization_code) {
			data.referenceId = transaction.id || null;
			data.tokenGateway = transaction.authorization_code || null;
		}
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const { payboxBase12, taxIva } = this._getPayboxBase();
			const editOrder = {
				sessionGateway: {
					taxIva,
					payboxBase12,
				},
				dateExpiration: null,
				status: 1,
			};
			await this.registerOrderGateway(editOrder);
			return h
				.response({
					clientAppCode: gateway.clientAppCode,
					clientAppKey: gateway.clientAppKey,

					// tax value
					orderVat: taxIva.toFixed(2),

					// subtotal (total without tax)
					taxableAmount: payboxBase12.toFixed(2),

					// percentage value of the tax
					taxPercentage: taxIva > 0 ? this.iva : 0,

					orderAmount: this.getTotalPayment(),
					curency: this.getCurrency(),

					payboxProduction: gateway.payboxProduction === 'production' || false,

					responsibleEmail: this.order.responsiblePickUp && this.order.responsiblePickUp.email,
					responsibleName: this.order.responsiblePickUp && this.order.responsiblePickUp.name,

					userId: this.order.customerId,
					userEmail: this.order.customer.email,
					userPhone: this.order.customer.phone || '0000000000',
					orderReference: this.order.number,
					orderDescription: `${this.order.commerce.name}-PE:${this.order.number}`,
					hash: this.hash,
				})
				.code(201);
		}
		throw new Error(paymentezGatewayIncorrectlyConfigured);
	}

	_getPayboxBase() {
		const { details } = this.order;
		let payboxBase0 = 0;
		let payboxBase12 = 0;
		let taxIva = 0;
		let percentageIva = this.iva / 100;
		percentageIva += 1;
		details.forEach((item) => {
			if (item.taxes && item.taxes.length > 0) {
				const taxes = item.taxes.find(i => i.code === '2' && i.codePercentage === '2');
				if (taxes) {
					const tax = item.total / percentageIva;
					taxIva += item.total - tax;
					payboxBase12 += tax;
				} else {
					payboxBase0 += item.total;
				}
			}
		});
		if (this.order.costShippingTax) {
			payboxBase12 += this.order.costShipping - this.order.costShippingTaxAmount;
			taxIva += this.order.costShippingTaxAmount || 0;
		} else {
			payboxBase0 += this.order.costShipping;
		}
		return { payboxBase0, payboxBase12, taxIva };
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		if (isDevOrProd() && auth) {
			const { subsidiary } = commerce;
			const params = {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				categoryCode: this.categoryCode,
				integrationCode: paymentez,
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
			return gatewayConfiguration.find(item => item.code === paymentez);
		}
		return undefined;
	}

	async validateTransaction(h, query) {
		const { gatewayResponse } = this.order;
		if (!gatewayResponse) {
			throw new Error(paymentezValidationResponseNotProvided);
		}

		const succeed = gatewayResponse.transaction.status === 'success';
		const additionalInformation = await this.registerOrderGateway({
			gatewayAuthorizationResponse: gatewayResponse,
			gatewayResponse,
			paymentStateId: succeed ? payOut : pending,
			flagStatusOrder: validated,
			flagApproval: succeed,
		});
		if (succeed && isDevOrProd()) {
			await SalOrders.handleNotification({
				order: this.order,
				wayPayment: this.order.wayPayment,
				paymentGateway:
					additionalInformation && additionalInformation.paymentGateway
						? additionalInformation.paymentGateway
						: undefined,
			});
		}
		if (query.uri) {
			return h.redirect(`${this.order.commerce.urlDomain}/${query.uri}/${this.order.id}`);
		}
		return gatewayResponse;
	}

	async registerOrderGateway(params) {
		const { commerceId, commerce, wayPaymentCommerce } = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
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
		await SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
		return paramsNew.additionalInformation;
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
		const { transaction } = gatewayResponse || {};
		if (transaction) {
			paymentGateway.referenceId = transaction.id;
			paymentGateway.authorizationCode = transaction.authorization_code;
			paymentGateway.status = transaction.status;
		}
		additionalInformation.gatewayCode = paymentez;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	_validCurentDate(date, hourValid) {
		let flagValid = false;
		let dateBeforePayment = new Date(date);
		dateBeforePayment.setDate(dateBeforePayment.getDate() + 1);
		dateBeforePayment = helper.localDate(dateBeforePayment, 'YYYY-MM-DD');
		const hourPayment = helper.localDate(date, 'HH:mm:ss');
		const datePayment = helper.localDate(date, 'YYYY-MM-DD');
		const currentDate = helper.localDate(new Date(), 'YYYY-MM-DD');
		const hourCurrent = helper.localDate(new Date(), 'HH:mm:ss');
		if (hourPayment < hourValid) {
			if (datePayment === currentDate) {
				flagValid = true;
			} else if (datePayment === dateBeforePayment) {
				flagValid = true;
			}
		} else if (hourCurrent >= hourValid) {
			if (currentDate < dateBeforePayment) {
				flagValid = true;
			}
		}
		return flagValid;
	}

	async getRefundTransaction() {
		const gateway = await this._getCredentials();
		if (gateway) {
			const { additionalInformation, companyId, commerce } = this.order;
			const gatewayTransaction = await GatewayTransaction.getById(
				additionalInformation.gatewayTransactionId,
				{
					companyId,
				},
			);

			if (gatewayTransaction && gatewayTransaction.codeGateway === paymentez) {
				const { gatewayAuthorizationResponse } = gatewayTransaction;
				if (gatewayTransaction.status === 3) {
					throw new Error(gatewayPreviouslyCanceledTransaction);
				}

				const { transaction } = gatewayAuthorizationResponse;
				if (transaction && transaction.payment_date) {
					if (!this._validCurentDate(transaction.payment_date, '17:00:00') && isDevOrProd()) {
						throw new Error(validTimeAutomaticRefundExceeded);
					}
					let gatewayResponse;
					if (isDevOrProd()) {
						const { data } = await axios({
							url: `${this.getUrlApi()}/v2/transaction/refund/`,
							method: 'POST',
							headers: {
								'Auth-Token': this._getAuthApi(gateway),
							},
							data: {
								transaction: {
									id: gatewayTransaction.referenceId,
								},
							},
							validateStatus: () => true,
						});
						gatewayResponse = data;
					} else {
						gatewayResponse = {};
					}
					const succeed = gatewayResponse.status === 'success';

					const data = {
						status: succeed ? 3 : gatewayTransaction.status,
					};
					await GatewayTransaction.edit(gatewayTransaction.id, data);
					gatewayResponse.paymentStateId = succeed ? refund : pendingRefund;
					await GatewayTransaction.create({
						codeGateway: paymentez,
						codeApp: this.order.codeApp,
						status: succeed ? 3 : 2,
						typeTransaction: 2,
						dateTransaction: new Date(),
						paymentStates: succeed ? 2 : 3,
						codeCategory: this.categoryCode,
						referenceId: gatewayTransaction.referenceId,
						tokenGateway: gatewayTransaction.tokenGateway,
						commerceId: commerce ? commerce.id : undefined,
						orderId: this.order.id,
						amount: this.getTotalPayment(),
						currency: this.getCurrency(),
						companyId: this.order.companyId,
						transactionId: gatewayTransaction.id,
						gatewayAuthorizationResponse: gatewayResponse,
					});
					return gatewayResponse;
				}
			}
		}
		throw new Error(paymentezGatewayIncorrectlyConfigured);
	}

	_getAuthApi(credentials) {
		let date = new Date().getTime();
		date = Math.round(date / 1000);
		const { serverAppCode, serverAppKey } = credentials;
		const uniqTokenHash = this._sha1(`${serverAppKey}${date}`);
		return this._encrypt(`${serverAppCode};${date};${uniqTokenHash}`);
	}

	_encrypt(data) {
		const buff = Buffer.from(data);
		return buff.toString('base64');
	}

	_sha1(data) {
		return crypto
			.createHash('sha256')
			.update(data)
			.digest('hex');
	}

	getPaymentGatewayInformation() {
		return {
			code: paymentez,
			name: 'Paymentez',
			description: 'Método de pago Paymentez',
		};
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = Paymentez;
