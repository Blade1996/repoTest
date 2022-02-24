/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const moment = require('moment');
const SalOrders = require('../../models/SalOrders');
const { isDevOrProd } = require('./../../shared/helper');
const { validated } = require('../../models/StatusOrders');
const ComSubsidiaries = require('../../models/ComSubsidiaries');
const { payOut, pending } = require('../../models/PaymentState');
const PaymentGatewayContract = require('../PaymentGatewayContract');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { niubiz, niubizSdk } = require('./../payment-strategies/payment-strategies-codes');
const { paymentButton, sdk } = require('../type-payment-gateway-enums');
const ModuleCode = require('../../models/ModuleCode');
const { web } = require('../../models/ChannelCode');

const {
	niubizGatewayIncorrectlyConfigured,
	niubizValidationResponseNotProvided,
} = require('./../error-codes/payment-error-codes');

class Niubiz extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.order = order;
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://apitestenv.vnforapps.com',
			prod: 'https://apiprod.vnforapps.com',
		};
		return url[this.environment];
	}

	getUrlSdk() {
		const url = {
			dev: 'https://apitestenv.vnforapps.com/api.certificate/v1/query',
			prod: 'https://jobs.vnforapps.com/api.certificate/v1/query',
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
		const data = {
			status: 2,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	_getBuyerInfo() {
		const { responsiblePickUp, customer } = this.order;
		const arraySplit = (str, sep = ' ') => (str || '').split(sep);
		const showValue = (array, pos) => (array.length > pos && array[pos]) || '';
		const arrayEmail = arraySplit((responsiblePickUp && responsiblePickUp.email) || customer.email);
		const document = responsiblePickUp.dni || customer.dni;
		const diffDays = moment(new Date()).diff(moment(customer.createdAt), 'days');
		return {
			email: showValue(arrayEmail, 0),
			mobile: responsiblePickUp ? responsiblePickUp.phone : customer.phone,
			document: customer.dni ? document : customer.ruc,
			documentType: customer.dni ? 'DNI' : 'RUC',
			diffDays,
		};
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const {
				ipAddress, id, number, customerId,
			} = this.order;
			let dataToken;
			let statusNew = 200;
			if (isDevOrProd()) {
				const { data, status } = await axios.post(
					`${this.getUrlApi()}/api.security/v1/security`,
					{},
					{
						auth: {
							username: gateway.accessUser,
							password: gateway.accessKey,
						},
					},
				);
				dataToken = data;
				statusNew = status;
			}
			const {
				email, mobile, document, documentType, diffDays,
			} = this._getBuyerInfo();
			let gatewayResponse = {};
			const merchantDefineData = {
				MDD1: id,
				MDD2: number,
				MDD3: customerId,
				MDD4: email,
				MDD21: 0,
				MDD31: mobile,
				MDD32: `${documentType}${document}`,
				MDD33: documentType,
				MDD34: document,
				MDD70: 1,
				MDD75: 'Registrado',
				MDD77: diffDays,
			};
			if (this.categoryCode !== sdk) {
				const { data: dataFinal, status: statusFinal } = await axios({
					url: `${this.getUrlApi()}/api.ecommerce/v2/ecommerce/token/session/${gateway.merchantId}`,
					method: 'POST',
					data: {
						amount: this.getTotalPayment(),
						antifraud: {
							clientIp: ipAddress,
							merchantDefineData,
						},
						channel: web,
						recurrenceMaxAmount: this.getTotalPayment(),
					},
					headers: {
						authorization: dataToken,
					},
					validateStatus: () => true,
				});
				statusNew = statusFinal;
				gatewayResponse = dataFinal;
				gatewayResponse.token = dataToken;
				delete gatewayResponse.merchantId;
				gatewayResponse.merchantDefineData = merchantDefineData;
			} else if (this.categoryCode === sdk && isDevOrProd()) {
				const { data: dataFinal, status: statusFinal } = await axios({
					url: `${this.getUrlSdk()}/${gateway.merchantId}`,
					method: 'POST',
					data: {
						amount: this.getTotalPayment(),
						antifraud: {
							clientIp: ipAddress,
							merchantDefineData,
						},
						channel: web,
						recurrenceMaxAmount: this.getTotalPayment(),
					},
					headers: {
						authorization: dataToken,
						Host: 'apitestenv.vnforapps.com',
					},
					validateStatus: () => true,
				});
				statusNew = statusFinal;
				gatewayResponse = dataFinal;
				gatewayResponse.token = dataToken;
				delete gatewayResponse.merchantId;
				gatewayResponse.merchantDefineData = merchantDefineData;
			}
			const editOrder = {
				sessionGateway: gatewayResponse,
				tokenGateway: dataToken,
				status: statusNew === 200 || statusNew === 201 ? 1 : 2,
				paymentStates: statusNew === 200 || statusNew === 201 ? 1 : 3,
				gatewayResponse,
				gateway,
			};

			const response = await this.registerOrderGateway(editOrder);
			response.payboxProduction = gateway.payboxProduction;
			response.merchantId = gateway.merchantId;
			response.hash = this.hash;
			response.currency = this.getCurrency();
			response.amount = this.getTotalPayment();
			if (statusNew !== 200) {
				return h.response(response).code(statusNew);
			}
			return h.response(response).code(201);
		}
		throw new Error(niubizGatewayIncorrectlyConfigured);
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth } = this.order;
		if (isDevOrProd() && auth) {
			const subsidiary = await this._validEcommerceDefault();
			const codeCredentials = this._findPaymentCredentials(subsidiary.subsidiaryAclCode);
			const dataGateWay = await RedisCredential.getCredentials(auth, codeCredentials);
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
			return gatewayConfiguration.find(item => item.code === niubiz);
		}
		return undefined;
	}

	async validateTransaction(h, payload) {
		const {
			gatewayTransactionId,
			companyId,
			tokenGateway,
			redirectionUri,
			redirectionErrorUri,
		} = this.order;
		const { transactionToken, gatewayResponse: gatewayResponseSdk } = payload;
		if (!transactionToken) {
			throw new Error(niubizValidationResponseNotProvided);
		}

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		if (gatewayTransaction && gatewayTransaction.additionalInformation) {
			const { payboxProduction, merchantId } = gatewayTransaction.additionalInformation;
			this.environment = payboxProduction ? 'prod' : 'dev';
			let gatewayResponse = gatewayResponseSdk;
			if (gatewayTransaction.codeCategory !== sdk) {
				gatewayResponse = await this.validationTokenDateResource({
					transactionToken,
					tokenGateway,
					merchantId,
				});
			}
			let codeErrorVisa = gatewayResponse.dataMap || gatewayResponse.data;
			codeErrorVisa = codeErrorVisa.ACTION_CODE || '';
			const succeed = codeErrorVisa === '000';
			const gatewayErrorCode = succeed
				? ''
				: this.errorCodesPaymentTransaction(codeErrorVisa) || codeErrorVisa;
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
				if (redirectionUri) {
					return h.redirect(`${this.order.commerce.urlDomain}/${redirectionUri}/${this.order.id}`);
				}
				return h.response(additionalInformation).code(200);
			}
			if (isDevOrProd() && redirectionErrorUri) {
				return h.redirect(`${this.order.commerce.urlDomain}/${redirectionErrorUri}`);
			}
		}
		return false;
	}

	async _validEcommerceDefault() {
		const { commerce, companyId, auth } = this.order;
		const { settings } = auth.employee.company;
		const { subsidiary } = commerce;
		const flagTypeIntegrationGrouper = settings && settings.flagTypeIntegrationGrouper;
		if (flagTypeIntegrationGrouper) {
			const subsidiaryDefault = await ComSubsidiaries.getByCompanyDefault(companyId);
			if (subsidiaryDefault) {
				return subsidiaryDefault;
			}
		}
		return subsidiary;
	}

	async validationTokenDateResource({ transactionToken, tokenGateway, merchantId }) {
		const url = `${this.getUrlApi()}/api.authorization/v3/authorization/ecommerce/${merchantId}`;
		const { data: dataAuthorization } = await axios({
			url,
			method: 'POST',
			headers: {
				authorization: tokenGateway,
			},
			data: {
				antifraud: null,
				captureType: 'manual',
				channel: web,
				countable: true,
				order: {
					amount: this.getTotalPayment(),
					currency: this.getCurrency(),
					productId: null,
					purchaseNumber: this.order.id,
					tokenId: transactionToken,
				},
				sponsored: null,
			},
			validateStatus: () => true,
		});
		return dataAuthorization;
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
					merchantId: gateway.merchantId,
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
				gatewayTransaction.gatewayErrorCode =
					paramsNew.gatewayErrorCode || paramsNew.gatewayResponse.errorMessage;
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
		const { additionalInformation: additionalInformationNew, gatewayResponse } = data;

		let { additionalInformation } = this.order;
		additionalInformation = additionalInformation || {};
		let { paymentGateway } = additionalInformation;
		if (additionalInformationNew && additionalInformationNew.gatewayTransactionId) {
			additionalInformation.gatewayTransactionId = additionalInformationNew.gatewayTransactionId;
		}

		paymentGateway = paymentGateway || {};
		const { dataMap, data: dataError } = gatewayResponse || {};
		const {
			SIGNATURE: referenceId,
			AUTHORIZATION_CODE: authorizationCode,
			ID_UNICO: requestId,
			STATUS: status,
			CARD: cardReference,
			BRAND: cardBrand,
		} =
			dataMap || dataError || {};

		paymentGateway.status = this._getStatusValid(status) || paymentGateway.status;
		paymentGateway.requestId = requestId || paymentGateway.requestId;
		paymentGateway.authorizationCode = authorizationCode || paymentGateway.authorizationCode;
		paymentGateway.referenceId = referenceId || paymentGateway.referenceId;

		paymentGateway.cardReference = cardReference || paymentGateway.cardReference;
		paymentGateway.cardBrand = cardBrand || paymentGateway.cardBrand;
		additionalInformation.gatewayCode = niubiz;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	_getStatusValid(status) {
		let name;
		if (status === 'Verified' || status === 'Authorized') {
			name = 'Aprobado';
		} else {
			name = 'Rechazado';
		}
		return name;
	}

	getPaymentGatewayInformation() {
		return {
			code: niubiz,
			name: 'Niubiz',
			description: 'Método de pago Niubiz',
		};
	}

	errorCodesPaymentTransaction(codeError) {
		const codeNiubiz = {
			101: 'EXPIRED_CARD',
			102: 'CONTACT_ISSUING_ENTITY',
			104: 'OPERATION_NOT_ALLOWED_CARD',
			106: 'EXCESS_ATTEMPTS_ENTER_SECRET_KEY',
			107: 'CONTACT_ISSUING_ENTITY',
			108: 'EXCESS_ACTIVITY',
			109: 'INVALID_ESTABLISHMENT_IDENTIFICATION',
			110: 'OPERATION_ALLOWED_CARD',
			111: 'EXCEEDS_ALLOWED_VIRTUAL_OPERATIONS',
			112: 'SECRET_KEY_REQUIRED',
			116: 'INSUFFICIENT_FUNDS',
			117: 'INCORRECT_SECRET_PASSWORD',
			118: 'INVALID_CARD',
			119: 'EXCESSIVE_ATTEMPTS_ENTER_SECRET_KEY',
			121: 'OPERATION_REJECTED',
			126: 'SECRET_KEY_INVALIDATES',
			129: 'CARD_NOT_OPERATIVE',
			180: 'CARD_INVALID',
			181: 'CARD_WITH_DEBIT_RESTRICTIONS',
			182: 'CARD_WITH_CREDIT_RESTRICTIONS',
			183: 'SYSTEM_ERROR',
			190: 'OPERATION_REJECTED_CONTACT_STATION',
			191: 'OPERATION_REJECTED_CONTACT_STATION',
			192: 'OPERATION_REJECTED_CONTACT_STATION',
			199: 'OPERATION_REJECTED',
			201: 'OPERATION_REJECTED_EXPIRED_CARD',
			202: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
			204: 'OPERATION_REJECTED_OPERATION_NO_ALLOWED',
			206: 'OPERATION_REJECTED_ATTEMPTS_TO_SECRET_KEY',
			207: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			208: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			209: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			263: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			264: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
			265: 'OPERATION_REJECTED_SECRET_PASSWORD_CARDHOLDER',
			266: 'OPERATION_REJECTED_EXPIRED_CARD',
			280: 'INCORRECT_SECRET_PASSWORD',
			290: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
			300: 'NUMBER_ORDER_DUPLICATED_COMMERCE',
			306: 'OPERATION_REJECTED',
			401: 'WAREHOUSE_INVALID_CONTACT_COMMERCE',
			402: 'OPERATION_REJECTED',
			403: 'UNAUTHENTICATED_CARD',
			404: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			405: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			406: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			407: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			408: 'CODE_OF_SECURY_DOES_NOT_MATCH',
			409: 'CODE_OF_SECURY_DOES_NOT_PROCESSED',
			410: 'CODE_OF_SECURY_DOES_NOT_INPUT',
			411: 'CODE_OF_SECURY_DOES_NOT_PROCESSED',
			412: 'CODE_OF_SECURY_NOT_RECOGNIZED',
			413: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			414: 'OPERATION_REJECTED',
			415: 'OPERATION_REJECTED',
			416: 'OPERATION_REJECTED',
			417: 'OPERATION_REJECTED',
			418: 'OPERATION_REJECTED',
			419: 'OPERATION_REJECTED',
			420: 'CARD_IS_NOT_VISA',
			421: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			422: 'TRADE_NOT_CONFIG_MEDIUM_PAYMENT',
			423: 'THE_WAS_CANCELED_PAYMENT_PROCESS',
			424: 'OPERATION_REJECTED',
			666: 'PROBLEM_COMMUNICATION_TRY_AGAIN',
			667: 'TRANSACTION_WITHOUT_VERIFIED_BY_VISA',
			668: 'OPERATION_REJECTED_CONTACT_COMMERCE',
			669: 'OPERATION_REJECTED_ANTI_FRAUT_MODULE',
			670: 'OPERATION_REJECTED_ANTI_FRAUT_MODULE',
			672: 'OPERATION_REJECTED_TRANSACTION_WITHOUT_RESPONSE_FROM_ANTIFRAUDE',
			673: 'OPERATION_REJECTED_TRANSACTION_WITHOUT_RESPONSE_FROM_AUTHORIZER',
			674: 'OPERATION_REJECTED_INVALID_SESSION',
			675: 'TRANSACTION_INITIALIZATION',
			676: 'OPERATION_REJECTED_DO_NOT_ACTIVATE_SEND_TO_AUTHORIZER',
			677: 'OPERATION_REJECTED_ANTIFRAUD_RESPONSE_WITH_VALID_PARAMETERS',
			678: 'OPERATION_REJECTED_INVALID_ECI_VALUE',
			682: 'OPERATION_REJECTED_PAYMENT_ATTEMPT_OUTSIDE_THE_ALLOWED_TIME',
			683: 'OPERATION_REJECTED_INCORRECT_SESSION_REGISTRATION',
			684: 'OPERATION_DENIED_INCORRECT_REGISTRATION_FRAUD',
			685: 'OPERATION_DENIED_INCORRECT_REGISTRATION_AUTHORIZER',
			904: 'OPERATION_REJECTED_MESSAGE_FORMAT_WRONG',
			909: 'OPERATION_REJECTED_SYSTEM_ERROR',
			910: 'OPERATION_REJECTED_SYSTEM_ERROR',
			912: 'ISSUING_ENTITY_NOT_AVAILABLE',
			913: 'TRANSMISSION_DUPLICATED',
			916: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			928: 'OPERATION_REJECTED_CONTACT_STATION_CARD',
			940: 'TRANSACTION_VOIDED_PREVIOUSLY',
			941: 'TRANSACTION_VOIDED_PREVIOUSLY',
			942: 'OPERATION_REJECTED',
			943: 'ORIGIN_DATA_DIFFERENT',
			945: 'TRANSMISSION_DUPLICATED',
			946: 'OPERATION_CANCELLATION_IN_PROCESS',
			947: 'TRANSMISSION_DUPLICATED',
			948: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
			949: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
			965: 'OPERATION_REJECTED_CONTACT_WITH_ISSUER',
		};
		const errorKeys = Object.keys(codeNiubiz);
		const errorEureka = errorKeys.filter(item => item === `${codeError}`);
		return errorEureka.length > 0 ? codeNiubiz[errorEureka[0]] : '';
	}

	_findPaymentCredentials(subsidiaryCode) {
		const params = {
			subsidiaryCode,
			categoryCode: this.categoryCode,
			integrationCode: niubiz,
		};
		if (this.categoryCode === sdk) {
			params.integrationCode = niubizSdk;
		}
		return params;
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = Niubiz;
