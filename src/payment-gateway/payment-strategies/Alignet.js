/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const PaymentGatewayContract = require('../PaymentGatewayContract');
const SalOrders = require('../../models/SalOrders');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { isDevOrProd } = require('./../../shared/helper');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { payOut, pending } = require('../../models/PaymentState');
const { validated } = require('../../models/StatusOrders');
const { alignet } = require('./../payment-strategies/payment-strategies-codes');
const { paymentButton } = require('../type-payment-gateway-enums');
const ModuleCode = require('../../models/ModuleCode');

const {
	alignetGatewayIncorrectlyConfigured,
	alignetValidationResponseNotProvided,
} = require('./../error-codes/payment-error-codes');

class Alignet extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.order = order;
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://api.uat.alignet.io',
			prod: 'https://api.alignet.io',
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
			dateTransaction: new Date(),
			codeCategory: this.categoryCode,
			...params,
			commerceId: this.order.commerce.id,
			moduleId: ModuleCode.ecommerce,
			orderId: this.order.id,
			amount: this.getTotalPayment(),
			currency: this.getCurrency(),
			companyId: this.order.companyId,
		};
		return GatewayTransaction.create(data);
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse) {
		const { transaction } = gatewayResponse;
		const data = {
			status: 2,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		if (transaction && transaction.id && transaction.authorization_code) {
			data.referenceId = transaction.id || null;
			data.tokenGateway = transaction.authorization_code || null;
		}
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	_getBuyerInfo() {
		const { responsiblePickUp, deliveryAddress, customer } = this.order;
		const arraySplit = (str, sep = ' ') => (str || '').split(sep);
		const showValue = (array, pos) => (array.length > pos && array[pos]) || '';
		let nameBuyer = responsiblePickUp.name;
		let surnameBuyer = responsiblePickUp.lastname;
		if (customer.name && customer.lastname) {
			nameBuyer = customer.name;
			surnameBuyer = customer.lastname;
		}
		const arrayEmail = arraySplit((responsiblePickUp && responsiblePickUp.email) || customer.email);
		return {
			first_name: customer.dni ? nameBuyer : customer.rzSocial,
			last_name: customer.dni ? surnameBuyer : undefined,
			email: showValue(arrayEmail, 0),
			phone: {
				country_code: '51',
				subscriber: responsiblePickUp ? responsiblePickUp.phone : customer.phone,
			},
			location: {
				line_1: deliveryAddress ? deliveryAddress.addressLine1 : '',
				line_2: deliveryAddress ? deliveryAddress.addressLine2 : '',
				city: 'LIMA',
				state: 'LIMA',
				country: 'PE',
				zip_code: '18',
			},
		};
	}

	_getCardHolder() {
		const { responsiblePickUp, customer, auth } = this.order;
		const { employee } = auth;
		const { country } = employee.company;
		const { configTaxes } = country;
		const arraySplit = (str, sep = ' ') => (str || '').split(sep);
		const showValue = (array, pos) => (array.length > pos && array[pos]) || '';
		let nameBuyer = responsiblePickUp.name;
		let surnameBuyer = responsiblePickUp.lastname;
		if (customer.name && customer.lastname) {
			nameBuyer = customer.name;
			surnameBuyer = customer.lastname;
		}
		const document = responsiblePickUp.dni || customer.dni;
		const arrayEmail = arraySplit((responsiblePickUp && responsiblePickUp.email) || customer.email);
		return [
			{
				first_name: nameBuyer,
				last_name: surnameBuyer,
				email_address: showValue(arrayEmail, 0),
				identity_document_country: configTaxes.countryCodeISO3166 || 'PE',
				identity_document_type: customer.dni ? 'DNI' : '',
				identity_document_identifier: document,
			},
		];
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const { number } = this.order;
			const reference = `${this.order.id}-PE-${number}`;
			const gatewayResponse = {
				action: 'authorize',
				transaction: {
					currency: this.getCurrency(),
					amount: this.getTotalPayment(),
					meta: {
						internal_operation_number: reference,
						description: `${this.order.commerce.name}-PE: ${this.order.number}`,
						additional_fields: {},
					},
				},
				address: {
					billing: this._getBuyerInfo(),
					shipping: {},
				},
				card_holder: this._getCardHolder(),
			};
			const editOrder = {
				sessionGateway: gatewayResponse,
				tokenGateway: 'dataToken',
				status: 1,
				paymentStates: 1,
				gatewayResponse,
				gateway,
			};
			const response = await this.registerOrderGateway(editOrder);
			response.payboxProduction = gateway.payboxProduction;
			response.keyFlexCapture = gateway.keyFlexCapture;
			return h.response(response).code(201);
		}
		throw new Error(alignetGatewayIncorrectlyConfigured);
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		if (isDevOrProd() && auth) {
			const { subsidiary } = commerce;
			const params = {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				categoryCode: this.categoryCode,
				integrationCode: alignet,
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
			return gatewayConfiguration.find(item => item.code === alignet);
		}
		return undefined;
	}

	async validateTransaction(h, query) {
		const { gatewayTransactionId, companyId, gatewayResponse: infoDataConfig } = this.order;
		if (!infoDataConfig || !infoDataConfig.action || infoDataConfig.action !== 'authorize') {
			throw new Error(alignetValidationResponseNotProvided);
		}

		if (!infoDataConfig.channel || infoDataConfig.channel !== '1') {
			throw new Error(alignetValidationResponseNotProvided);
		}

		if (!infoDataConfig.payment_method || !infoDataConfig.payment_method.card) {
			throw new Error(alignetValidationResponseNotProvided);
		}

		const dataCard = infoDataConfig.payment_method.card[0];
		if (!dataCard.pan || !dataCard.expiry_date || !dataCard.security_code) {
			throw new Error(alignetValidationResponseNotProvided);
		}

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		if (gatewayTransaction && gatewayTransaction.additionalInformation) {
			const { payboxProduction, keyFlexCapture } = gatewayTransaction.additionalInformation;
			this.environment = payboxProduction ? 'prod' : 'dev';
			const { data: gatewayResponse } = await this.validationTokenDateResource({
				infoDataConfig,
				keyFlexCapture,
				sessionGateway: gatewayTransaction.sessionGateway,
			});
			let codeErrorVisa = gatewayResponse.transaction.meta.status;
			const succeed = gatewayResponse.success === 'true' || gatewayResponse.success;
			codeErrorVisa = codeErrorVisa.code || '';
			const gatewayErrorCode = succeed ? '' : this.errorCodesPaymentTransaction(codeErrorVisa);
			const additionalInformation = await this.registerOrderGateway({
				gatewayAuthorizationResponse: gatewayResponse,
				paymentStateId: succeed ? payOut : pending,
				flagStatusOrder: validated,
				flagApproval: succeed,
				gatewayErrorCode,
				gatewayResponse,
			});
			if (succeed && isDevOrProd()) {
				await SalOrders.handleNotification({
					order: this.order,
					wayPayment: this.order.wayPayment,
					paymentGateway: additionalInformation.paymentGateway,
				});
			}
			if (query.uri) {
				return h.redirect(`${this.order.commerce.urlDomain}/${query.uri}/${this.order.id}`);
			}
			return gatewayResponse;
		}
		return false;
	}

	async validationTokenDateResource({ infoDataConfig, keyFlexCapture, sessionGateway }) {
		const url = `${this.getUrlApi()}/charges`;
		const {
			action,
			payment_method: paymentMethod,
			transaction,
			channel,
			card_holder: cardHolder,
		} = infoDataConfig;
		const {
			transaction: transactionSession,
			address,
			card_holder: cardHolderSession,
		} = sessionGateway;
		return axios({
			url,
			method: 'POST',
			headers: {
				authorization: keyFlexCapture,
			},
			data: {
				action,
				channel,
				payment_method: paymentMethod,
				transaction: {
					currency: transaction.currency || this.getCurrency(),
					amount: transaction.amount || this.getTotalPayment(),
					meta: transaction.meta || transactionSession.meta,
				},
				address,
				card_holder: cardHolder || cardHolderSession,
			},
			validateStatus: () => true,
		});
	}

	async registerOrderGateway(params) {
		const { commerceId, commerce, wayPaymentCommerce } = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
			const {
				sessionGateway: session, status, paymentStates, tokenGateway, gateway,
			} = paramsNew;
			const referenceId = session.order ? session.order.transactionId : null;
			const newGatewayTransaction = await this.saveTransaction({
				sessionGateway: session,
				status,
				paymentStates,
				referenceId,
				tokenGateway,
				gatewayErrorCode: paramsNew.status === 2 ? session.errorMessage : null,
				additionalInformation: {
					payboxProduction: this.environment === 'prod' || false,
					keyFlexCapture: gateway.keyFlexCapture,
				},
			});
			if (paramsNew.status === 2) {
				return params.sessionGateway;
			}
			paramsNew.additionalInformation = { gatewayTransactionId: newGatewayTransaction.id };
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			paramsNew.additionalInformation = Object.assign(paramsNew.additionalInformation, {
				gatewayTransactionId: newGatewayTransaction.id,
			});
			paramsNew.wayPaymentId = wayPaymentCommerce ? wayPaymentCommerce.wayPaymentId : undefined;
		} else {
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			const { gatewayTransactionId, paymentGateway } = paramsNew.additionalInformation;
			const gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayResponse,
				tokenGateway: paymentGateway.authorizationCode,
				referenceId: paymentGateway.referenceId,
				gatewayErrorCode: !params.flagApproval ? params.gatewayErrorCode : undefined,
			};
			delete paramsNew.additionalInformation.gatewayErrorCode;
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
		delete paramsNew.gateway;
		delete paramsNew.status;
		await SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
		return params.sessionGateway || paramsNew.additionalInformation;
	}

	_structureAdditionalInformation(data) {
		const { additionalInformation: additionalInformationNew, gatewayResponse, flagApproval } = data;

		let { additionalInformation } = this.order;
		additionalInformation = additionalInformation || {};
		let { paymentGateway } = additionalInformation;
		if (additionalInformationNew && additionalInformationNew.gatewayTransactionId) {
			additionalInformation.gatewayTransactionId = additionalInformationNew.gatewayTransactionId;
		}

		paymentGateway = paymentGateway || {};
		const { order } = gatewayResponse || {};
		if (!flagApproval) {
			paymentGateway.status = gatewayResponse.dataMap ? gatewayResponse.dataMap.STATUS : undefined;
		}
		if (order) {
			paymentGateway.referenceId = order.transactionId;
			paymentGateway.authorizationCode = order.tokenId;
			paymentGateway.status = gatewayResponse.dataMap ? gatewayResponse.dataMap.STATUS : undefined;
		}
		additionalInformation.gatewayCode = alignet;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	getPaymentGatewayInformation() {
		return {
			code: alignet,
			name: 'Alignet',
			description: 'Método de pago Alignet',
		};
	}

	errorCodesPaymentTransaction(codeError) {
		const codeAlignet = {};
		const errorKeys = Object.keys(codeAlignet);
		const errorEureka = errorKeys.filter(item => item === `${codeError}`);
		return errorEureka.length > 0 ? codeAlignet[errorEureka[0]] : '';
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = Alignet;
