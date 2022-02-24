/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const Aws = require('./../../models/Aws');
const qrcode = require('qrcode-generator');
const helper = require('./../../models/helper');
const SalOrders = require('../../models/SalOrders');
const { isDevOrProd } = require('./../../shared/helper');
const { validated } = require('../../models/StatusOrders');
const PaymentGatewayContract = require('./../PaymentGatewayContract');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { placetopay } = require('./../payment-strategies/payment-strategies-codes');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { paymentLink } = require('../type-payment-gateway-enums');
const {
	validTimeAutomaticRefundExceeded,
	placeToPayPaymentTransactionError,
	gatewayPreviouslyCanceledTransaction,
	placeToPayGatewayIncorrectlyConfigured,
} = require('./../error-codes/payment-error-codes');
const {
	payOut, pending, refund, pendingRefund,
} = require('../../models/PaymentState');
const ModuleCode = require('../../models/ModuleCode');

class PlaceToPay extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentLink) {
		super();
		this.iva = 12;
		this.order = order;
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://test.placetopay.ec/redirection',
			prod: 'https://secure.placetopay.ec/redirection',
		};
		return url[this.environment];
	}

	async genereteLinkCodeQr(qrData, fileName) {
		try {
			let codeQr = this.generateQr(qrData);
			codeQr = codeQr.split(',', 2);
			const codeQrBase64 = codeQr[1];
			const urlImage = await Aws(
				codeQrBase64,
				fileName,
				process.env.AWS_S3_BUCKET_MAKI,
				'image/png',
			);
			return urlImage.Location;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	generateQr(qrData) {
		const qr = qrcode(9, 'Q');
		qr.addData(qrData);
		qr.make();
		const code = qr.createDataURL();
		return code;
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			return h.response(await this.getPaymentLink(gateway)).code(201);
		}
		throw new Error(placeToPayGatewayIncorrectlyConfigured);
	}

	async registerOrderGateway(params, credentials) {
		const { commerceId, commerce } = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
			const { wayPaymentCommerce } = this.order;
			paramsNew.additionalInformation = {
				payboxProduction: this.environment === 'prod' || false,
				user: credentials.login,
				token: credentials.secretKey,
			};
			const newGatewayTransaction = await this.saveTransaction(paramsNew);
			paramsNew.additionalInformation = { gatewayTransactionId: newGatewayTransaction.id };
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			paramsNew.wayPaymentId = wayPaymentCommerce ? wayPaymentCommerce.wayPaymentId : undefined;
		} else {
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			const { gatewayTransactionId, paymentGateway } = paramsNew.additionalInformation;
			const gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayAuthorizationResponse,
			};
			const flagPending = paymentGateway.status === 'Pendiente';
			paramsNew.tokenGateway = paymentGateway.authorizationCode;
			paramsNew.referenceId = paymentGateway.referenceId;
			if (!params.flagApproval && !flagPending) {
				gatewayTransaction.gatewayErrorCode = `code: ${paramsNew.status || null}`;
				paramsNew.gatewayErrorCode = `code: ${paramsNew.status || null}`;
			}
			await this._updateTransaction(
				gatewayTransactionId,
				params.flagApproval,
				gatewayTransaction,
				flagPending,
			);
		}

		if (!commerceId) {
			paramsNew.commerceId = commerce.id;
		}

		delete paramsNew.gatewayResponse;
		delete paramsNew.dateExpiration;
		delete paramsNew.paymentStates;
		delete paramsNew.codeCategory;
		delete paramsNew.referenceId;
		delete paramsNew.requestId;
		delete paramsNew.signature;
		delete paramsNew.status;
		return SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
	}

	getPaymentGatewayInformation() {
		return {
			code: placetopay,
			name: 'PlaceToPay',
			description: 'Método de pago PlaceToPay',
		};
	}

	async getPaymentLink(credentials) {
		const {
			number, commerce, ipAddress, uri, userAgent,
		} = this.order;
		const expiration = new Date();
		expiration.setMinutes(expiration.getMinutes() + 30);
		const {
			payboxBase0, payboxBase12, taxIva, shipping,
		} = this._getPayboxBase();
		const subtotal = payboxBase0 + payboxBase12;
		let gatewayResponse = {};
		const reference = `${this.order.id}-PE-${number}`;
		const { data } = await axios({
			url: `${this.getUrlApi()}/api/session`,
			method: 'POST',
			data: {
				auth: this.getAuthApi(credentials),
				locale: 'es_EC',
				buyer: this._getBuyerInfo(),
				payment: {
					reference,
					description: `${commerce.name}-PE: ${number}`,
					amount: {
						currency: this.getCurrency(),
						total: this.getTotalPayment(),
						taxes: [
							{
								kind: 'valueAddedTax',
								amount: taxIva.toFixed(2),
								base: subtotal.toFixed(2),
							},
						],
						details: [
							{
								kind: 'shipping',
								amount: shipping.toFixed(2),
							},
							{
								kind: 'subtotal',
								amount: subtotal.toFixed(2),
							},
						],
					},
					allowPartial: false,
				},
				expiration: expiration.toISOString(),
				returnUrl: `${commerce.urlDomain}/${uri}/${this.order.id}?gatewayCode=${placetopay}`,
				ipAddress,
				userAgent,
			},
			validateStatus: () => true,
		});
		gatewayResponse = data;
		gatewayResponse.data = {};
		const { status } = gatewayResponse.status || {};
		if (status && status === 'OK') {
			gatewayResponse.data.url = gatewayResponse.processUrl;
			if (isDevOrProd()) {
				gatewayResponse.data.urlQrImage = await this.genereteLinkCodeQr(
					gatewayResponse.processUrl,
					`link-pago-PE-${number}`,
				);
			}
		}
		const editOrder = {
			sessionGateway: gatewayResponse,
			flagStatusOrder: validated,
			dateExpiration: expiration,
			gatewayResponse,
			referenceId: reference,
			tokenGateway: gatewayResponse.requestId ? `${gatewayResponse.requestId}` : null,
		};
		await this.registerOrderGateway(editOrder, credentials);
		return gatewayResponse;
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
		const document = responsiblePickUp.dni || customer.dni;
		const arrayEmail = arraySplit((responsiblePickUp && responsiblePickUp.email) || customer.email);
		return {
			name: customer.dni ? nameBuyer : customer.rzSocial,
			surname: customer.dni ? surnameBuyer : undefined,
			email: showValue(arrayEmail, 0),
			mobile: responsiblePickUp ? responsiblePickUp.phone : customer.phone,
			company: customer.ruc ? customer.rzSocial : undefined,
			document: customer.dni ? document : customer.ruc,
			documentType: customer.dni ? 'CI' : 'RUC',
			address: deliveryAddress ? deliveryAddress.addressLine1 : '',
		};
	}

	_getPayboxBase() {
		const { details } = this.order;
		let payboxBase0 = 0;
		let payboxBase12 = 0;
		let taxIva = 0;
		let shipping = 0;
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
			shipping = this.order.costShipping - this.order.costShippingTaxAmount;
			taxIva += this.order.costShippingTaxAmount || 0;
		} else {
			shipping += this.order.costShipping;
		}
		return {
			payboxBase0,
			payboxBase12,
			taxIva,
			shipping,
		};
	}

	async validateTransaction(h, params) {
		const {
			status, requestId, signature, reference,
		} = params;
		const { gatewayTransactionId, companyId } = this.order;

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		if (gatewayTransaction && gatewayTransaction.tokenGateway === `${requestId}`) {
			const succeed = status.status === 'APPROVED';
			const { token } = gatewayTransaction.additionalInformation;
			const signatureKey = crypto
				.createHmac('sha1', reference)
				.update(`${requestId}${status.status}${status.date}${token}`)
				.digest('hex');
			if (signatureKey === signature) {
				const editOrder = {
					gatewayAuthorizationResponse: params,
					paymentStateId: succeed ? payOut : pending,
					flagStatusOrder: validated,
					flagApproval: succeed,
					status: status.status,
					requestId,
					signature,
				};
				await this.registerOrderGateway(editOrder);

				if (succeed && isDevOrProd()) {
					await SalOrders.handleNotification({
						order: this.order,
						dataStructure: this.order,
					});
				}
				return {};
			}
		}
		return false;
	}

	_structureAdditionalInformation(data) {
		const {
			additionalInformation: additionalInformationNew,
			gatewayResponse,
			referenceId,
			requestId,
			signature,
			status,
		} = data;

		let { additionalInformation } = this.order;
		additionalInformation = additionalInformation || {};
		let { paymentGateway } = additionalInformation;
		if (additionalInformationNew && additionalInformationNew.gatewayTransactionId) {
			additionalInformation.gatewayTransactionId = additionalInformationNew.gatewayTransactionId;
		}

		paymentGateway = paymentGateway || {};
		if (gatewayResponse && gatewayResponse.processUrl) {
			paymentGateway.url = gatewayResponse.processUrl;
			paymentGateway.urlQrImage = gatewayResponse.urlQrImage;
		}
		paymentGateway.requestId = requestId || paymentGateway.requestId;
		paymentGateway.authorizationCode = signature || paymentGateway.authorizationCode;
		paymentGateway.referenceId = referenceId || paymentGateway.referenceId;

		additionalInformation.gatewayCode = placetopay;
		paymentGateway.status = status ? this._getStatusValid(status) : paymentGateway.status;

		additionalInformation = Object.assign(additionalInformation || {}, {
			paymentGateway,
		});
		return additionalInformation;
	}

	_getStatusValid(status) {
		let name;
		if (status === 'OK' || status === 'APPROVED') {
			name = 'Aprobado';
		} else if (status === 'FAILED' || status === 'REJECTED') {
			name = 'Rechazado';
		} else if (status === 'PENDING') {
			name = 'Pendiente';
		} else if (status === 'REFUNDED') {
			name = 'Rembolso Procesado';
		} else if (status === 'MANUAL') {
			name = 'Rembolso Pendiente';
		}
		return name;
	}

	async getStatusTransaction() {
		const { gatewayTransactionId, gatewayAdditionalInformation, companyId } = this.order;
		const { payboxProduction } = gatewayAdditionalInformation;
		this.environment = payboxProduction ? 'prod' : 'dev';

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});
		gatewayAdditionalInformation.requestId = gatewayTransaction.tokenGateway;
		const validatedResource = await this.getRequestInformation(gatewayAdditionalInformation);
		if (!validatedResource) {
			throw new Error(placeToPayPaymentTransactionError);
		}

		const succeed = validatedResource.status.status === 'APPROVED';
		if (gatewayTransaction.status !== 2) {
			const editOrder = {
				gatewayAuthorizationResponse: validatedResource,
				paymentStateId: succeed ? payOut : pending,
				flagStatusOrder: validated,
				flagApproval: succeed,
				status: validatedResource.status.status,
				requestId: gatewayTransaction.tokenGateway,
			};
			await this.registerOrderGateway(editOrder);
		}
		return validatedResource;
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse, flagPending = false) {
		const data = {
			status: succeed ? 2 : 1,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		if (flagPending) {
			delete data.paymentStates;
		}
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	async getRequestInformation(session) {
		const credentials = {
			login: session.user,
			secretKey: session.token,
		};
		const { data: dataResource } = await axios({
			url: `${this.getUrlApi()}/api/session/${session.requestId}`,
			method: 'POST',
			data: {
				auth: this.getAuthApi(credentials),
			},
			validateStatus: () => true,
		});
		return dataResource;
	}

	async getAllTransaction(query) {
		const newQuery = query;
		const { companyId } = this.order;
		newQuery.codeGateway = placetopay;
		const data = await GatewayTransaction.getAllByCustomerId(newQuery, companyId);
		return data;
	}

	getAuthApi(credentials) {
		const seed = moment().format('YYYY-MM-DDTHH:mm:ssZ');
		let nonce = Math.random()
			.toString(36)
			.substring(7);
		const tranKey = this.encrypt(this.sha1(`${nonce}${seed}${credentials.secretKey}`));
		nonce = this.encrypt(nonce);
		return {
			login: credentials.login,
			tranKey,
			nonce,
			seed,
		};
	}

	encrypt(data) {
		const buff = Buffer.from(data);
		return buff.toString('base64');
	}

	sha1(data, key = placetopay) {
		const h = crypto.createHash('sha1', key);
		return h.update(data).digest('b64');
	}

	async saveTransaction(params) {
		const gatewayInfo = this.getPaymentGatewayInformation();
		this.hash = await buildAndGenerateTransactionHash(
			this.order.id,
			this.order.companyId,
			gatewayInfo.code,
		);
		const {
			additionalInformation,
			sessionGateway,
			dateExpiration,
			referenceId,
			tokenGateway,
		} = params;
		const data = {
			code: this.hash,
			codeGateway: gatewayInfo.code,
			codeApp: this.order.codeApp,
			dateTransaction: new Date(),
			status: 1,
			paymentStates: 1,
			additionalInformation,
			sessionGateway,
			dateExpiration,
			referenceId,
			tokenGateway,
			codeCategory: this.categoryCode,
			commerceId: this.order.commerce.id,
			moduleId: ModuleCode.ecommerce,
			orderId: this.order.id,
			amount: this.getTotalPayment(),
			currency: this.getCurrency(),
			companyId: this.order.companyId,
		};
		return GatewayTransaction.create(data);
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		const { subsidiary } = commerce;
		if (isDevOrProd() && auth) {
			const codeCredentials = this.findPaymentCredentials(subsidiary.subsidiaryAclCode);
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
			return gatewayConfiguration.find(item => item.code === placetopay);
		}
		return undefined;
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

			if (gatewayTransaction && gatewayTransaction.codeGateway === placetopay) {
				const {
					gatewayAuthorizationResponse,
					additionalInformation: additionalInformationTransaction,
				} = gatewayTransaction;
				if (gatewayTransaction.status === 3) {
					throw new Error(gatewayPreviouslyCanceledTransaction);
				}

				const { payment } = gatewayAuthorizationResponse;
				if (payment && payment.status.date) {
					if (!this._validCurentDate(payment.status.date, '23:59:00') && isDevOrProd()) {
						throw new Error(validTimeAutomaticRefundExceeded);
					}
					let gatewayResponse;
					if (isDevOrProd()) {
						const credentials = {
							login: additionalInformationTransaction.user,
							secretKey: additionalInformationTransaction.token,
						};
						const { data } = await axios({
							url: `${this.getUrlApi()}/api/reverse`,
							method: 'POST',
							data: {
								auth: this.getAuthApi(credentials),
								internalReference: payment.internalReference,
							},
							validateStatus: () => true,
						});
						gatewayResponse = data;
					} else {
						gatewayResponse = {};
					}
					const succeed = gatewayResponse.status === 'APPROVED';

					const data = {
						status: succeed ? 3 : gatewayTransaction.status,
					};
					await GatewayTransaction.edit(gatewayTransaction.id, data);
					gatewayResponse.paymentStateId = succeed ? refund : pendingRefund;
					await GatewayTransaction.create({
						codeGateway: placetopay,
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
		throw new Error(placeToPayGatewayIncorrectlyConfigured);
	}

	findPaymentCredentials(subsidiaryCode) {
		const params = {
			subsidiaryCode,
			categoryCode: this.categoryCode,
			integrationCode: 'placetopay',
		};
		return params;
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = PlaceToPay;
