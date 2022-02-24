/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const Aws = require('./../../models/Aws');
const axios = require('axios');
const qrcode = require('qrcode-generator');
const { store } = require('./../../models/PickUp');
const SalOrders = require('../../models/SalOrders');
const { isDevOrProd } = require('./../../shared/helper');
const { validated } = require('../../models/StatusOrders');
const { payOut, pending } = require('../../models/PaymentState');
const PaymentGatewayContract = require('./../PaymentGatewayContract');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { pagoplux } = require('./../payment-strategies/payment-strategies-codes');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { paymentLink, paymentButton } = require('../type-payment-gateway-enums');
const {
	pagoPluxGatewayIncorrectlyConfigured,
	pagoPluxValidationResponseNotProvided,
} = require('./../error-codes/payment-error-codes');
const ModuleCode = require('../../models/ModuleCode');

class PagoPlux extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.order = order;
		this.environment = 'dev';
		this.rucEstablecimiento = '';
		this.esQR = false;
		this.linkUnico = true;
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://apipre.pagoplux.com/transv1',
			prod: 'https://api.pagoplux.com/transv1',
		};
		return url[this.environment];
	}

	getSecretKey() {
		const token = {
			dev: 'UGFnb1BsdXhBZG1pblByZTIwMjAlXzpQYWdvUGx1eEFwaV9QcmUwNF8yMDIw',
			prod: 'UGFnb1BsdXhBZG1pblBybzIwMjAlXzpQYWdvUGx1eEFwaV9Qcm8wNF8yMDIw',
		};
		return token[this.environment];
	}

	getTokenApi() {
		const longitud = Math.random() * this.getSecretKey().length;
		let cadena = '';
		while (cadena.length < longitud) {
			cadena += this.getSecretKey().charAt(Math.random() * longitud);
		}
		const tiempo = new Date();
		const number = tiempo.getTime() * 30;
		return this.encrypt(`${cadena}PPX_${this.getSecretKey()}PPX_${number}AWS`);
	}

	encrypt(data) {
		const buff = Buffer.from(data);
		return buff.toString('base64');
	}

	async getPaymentLink() {
		const {
			number,
			customer,
			commerce,
			flagBill,
			dataBill,
			subsidiary,
			flagPickUp,
			deliveryAddress,
			warehouseAddress,
		} = this.order;
		const { payboxBase0, payboxBase12 } = this._getPayboxBase();
		const expiration = new Date();
		expiration.setDate(expiration.getDate() + 10);
		const shippingStreet = flagPickUp === store ? warehouseAddress : deliveryAddress.addressLine1;
		const billingStreet = flagBill && dataBill.address ? dataBill.address : shippingStreet;
		const { data: gatewayResponse } = await axios({
			url: `${this.getUrlApi()}/transaction/createLinkFacturaResource`,
			method: 'POST',
			headers: {
				authorization: `Basic ${this.getTokenApi()}`,
				origin: 'https://app.pagoplux.com',
			},
			data: {
				montoCero: payboxBase0,
				monto12: payboxBase12,
				rucEstablecimiento: this.encrypt(this.rucEstablecimiento),
				rucOrigen: this.encrypt(subsidiary.ruc),
				descripcion: `${commerce.name}-PE: ${number}`,
				ci: customer.dni || customer.ruc,
				direccion: billingStreet,
				linkUnico: this.linkUnico,
				esQR: this.esQR,
			},
			validateStatus: () => true,
		});
		gatewayResponse.data = gatewayResponse.detail;
		if (isDevOrProd()) {
			if (this.esQR && gatewayResponse.data.QR) {
				gatewayResponse.data.urlQrImage = await this.saveLinkCodeQr(
					gatewayResponse.data.QR,
					`link-pago-PE-${number}`,
				);
			} else if (gatewayResponse.data && gatewayResponse.data.url) {
				gatewayResponse.data.urlQrImage = await this.genereteLinkCodeQr(
					gatewayResponse.data.url,
					`link-pago-PE-${number}`,
				);
			} else {
				throw new Error(pagoPluxValidationResponseNotProvided);
			}
		}
		delete gatewayResponse.detail;
		const editOrder = {
			sessionGateway: gatewayResponse,
			dateExpiration: expiration,
			flagStatusOrder: validated,
			gatewayResponse,
		};
		await this.registerOrderGateway(editOrder);
		return gatewayResponse;
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
		if (gatewayResponse && gatewayResponse.detail) {
			paymentGateway.referenceId = gatewayResponse.detail.id_transaccion;
			paymentGateway.authorizationCode = gatewayResponse.detail.token;
			paymentGateway.status = gatewayResponse.status;
		}
		if (gatewayResponse && gatewayResponse.data) {
			paymentGateway.url = gatewayResponse.data.url || null;
			paymentGateway.urlQrImage = gatewayResponse.data.urlQrImage || null;
			paymentGateway.authorizationCode = gatewayResponse.data.parentId;
			paymentGateway.referenceId = gatewayResponse.data.localId;
			paymentGateway.status = gatewayResponse.status || gatewayResponse.description;
		}
		additionalInformation.gatewayCode = pagoplux;

		additionalInformation = Object.assign(additionalInformation || {}, {
			paymentGateway,
		});
		return additionalInformation;
	}

	async saveLinkCodeQr(codeQrBase64, fileName) {
		try {
			const codeQr = codeQrBase64.split(',');
			const strCode = codeQr.length > 1 ? codeQr[1] : codeQrBase64;
			const urlImage = await Aws(strCode, fileName, process.env.AWS_S3_BUCKET_MAKI, 'image/png');
			return urlImage.Location;
		} catch (error) {
			return Promise.reject(error);
		}
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
		// eslint-disable-next-line no-underscore-dangle
		const gateway = await this._getCredentials();
		if (gateway) {
			if (this.categoryCode === paymentLink) {
				return h.response(await this.getPaymentLink()).code(201);
			}
			const { payboxBase0, payboxBase12 } = this._getPayboxBase();
			const editOrder = {
				sessionGateway: {
					payboxBase0,
					payboxBase12,
				},
				dateExpiration: null,
			};
			await this.registerOrderGateway(editOrder);
			return h
				.response({
					/* Requerido. Email de la cuenta PagoPlux */
					payboxRemail: gateway.payboxRemail,

					/* Requerido. Nombre del usuario/cuenta PagoPlux */
					payboxRename: gateway.payboxRename,

					/* Tipo de Ejecución
					* Production: true (Modo Producción, Se procesarán cobros
						y se cargarán al sistema, afectará a la tdc)
					* Production: false (Modo Prueba, se realizarán cobros de prueba
						y no se guardará ni afectará al sistema)
					*/
					payboxProduction: gateway.payboxProduction === 'production' || false,

					/* Requerido. Ejemplo: 100.00, 10.00, 1.00 o Id/Class del elemento html
					que posee el valor de los productos sin impuestos */
					payboxBase0,

					/* Requerido. Ejemplo: 100.00, 10.00, 1.00 o Id/Class del elemento html
					que posee el valor de los productos con su impuesto incluido */
					payboxBase12,

					/* Requerido. Descripción del pago o Id/Class del elemento html que posee el valor */
					payboxDescription: '',

					/* Requerido. Lenguaje del Paybox
					* Español: es | (string) (Paybox en español)
					* Ingles: us | (string) (Paybox en Ingles)
					*/
					payboxLanguage: gateway.payboxLanguage || 'es',

					/* Valores HTML que son requeridos por la web que implementa el botón de pago.
				* Se permiten utilizar los identificadores de # y .
					que describen los Id y Class de los Elementos HTML
				* Array de identificadores de elementos HTML |
					Ejemplo: PayboxRequired: ["#nombre", "#correo", "#monto"]
				*/
					PayboxRequired: ['#nombre', '#correo', '#monto'],

					/* Opcional. Email del usuario que realiza el pago. */
					payboxSendmail: this.order.responsiblePickUp && this.order.responsiblePickUp.email,

					/* Opcional. Nombre del usuario que realiza el pago */
					payboxSendname:
						this.order.responsiblePickUp &&
						`${this.order.responsiblePickUp.name} ${this.order.responsiblePickUp.lastname}`,

					/*
				* Requerido. Representa el tipo de crédito seleccionado por el usuario 00
					Corriente, 01 Diferido Corriente, 02 Diferido con Interés
				* 03 Diferido sin Interés, 07    Diferido con Interés y  meses de gracia,
					09 Diferido sin Interés y meses de gracia,
				* 04 Monto Fijo
				*/
					payboxCreditType: '00',
					/*
				* Requerido. En caso de crédito diferido se debe especificar el número
					de coutas caso contrario 0
				*/
					payboxNumInstallments: '0',
					/*
				* Requerido. Meses de gracias para el pago.
				*/
					payboxGraceMonths: '0',
					/*
				* Requerido. Aplica interés o no 0= No aplica, 1= Si aplica
				*/
					payboxInteres: '0',

					/**
					 * Infomacion relacionada al core
					 */
					hash: this.hash,
					curency: this.getCurrency(),
				})
				.code(201);
		}
		throw new Error(pagoPluxGatewayIncorrectlyConfigured);
	}

	_getPayboxBase() {
		const { details } = this.order;
		let payboxBase0 = 0;
		let payboxBase12 = 0;
		details.forEach((item) => {
			if (item.taxes && item.taxes.length > 0) {
				const taxes = item.taxes.find(i => i.code === '2' && i.codePercentage === '2');
				if (taxes) {
					payboxBase12 += item.total;
				} else {
					payboxBase0 += item.total;
				}
			}
		});
		if (this.order.costShippingTax) {
			payboxBase12 += this.order.costShipping;
		} else {
			payboxBase0 += this.order.costShipping;
		}
		return { payboxBase0, payboxBase12 };
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		if (isDevOrProd() && auth) {
			const { subsidiary } = commerce;
			const codeCredentials = this.findPaymentCredentials(subsidiary.subsidiaryAclCode);
			const dataGateWay = await RedisCredential.getCredentials(auth, codeCredentials);
			if (dataGateWay && dataGateWay.credentials_key) {
				this.environment =
					dataGateWay.credentials_key.payboxProduction === 'production' ? 'prod' : 'dev';
				this.rucEstablecimiento = dataGateWay.credentials_key.rucEstablecimiento;
				return dataGateWay.credentials_key;
			}
		} else if (
			wayPaymentCommerce &&
			wayPaymentCommerce.gatewayConfiguration &&
			wayPaymentCommerce.gatewayConfiguration.length > 0
		) {
			const { gatewayConfiguration } = wayPaymentCommerce;
			return gatewayConfiguration.find(item => item.code === pagoplux);
		}
		return undefined;
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
		return SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
	}

	async saveTransaction(params) {
		const gatewayInfo = this.getPaymentGatewayInformation();
		this.hash = await buildAndGenerateTransactionHash(
			this.order.id,
			this.order.companyId,
			gatewayInfo.code,
		);
		const {
			sessionGateway, dateExpiration, tokenGateway, referenceId,
		} = params;
		const data = {
			code: this.hash,
			codeGateway: gatewayInfo.code,
			codeApp: this.order.codeApp,
			status: 1,
			paymentStates: 1,
			codeCategory: this.categoryCode,
			dateTransaction: new Date(),
			sessionGateway,
			dateExpiration,
			referenceId,
			tokenGateway,
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

	async validateTransaction(h, query) {
		const { gatewayAdditionalInformation } = this.order;
		let { gatewayResponse } = this.order;
		if (!gatewayResponse) {
			throw new Error(pagoPluxValidationResponseNotProvided);
		}
		let succeed = gatewayResponse.status === 'succeeded';
		if (succeed) {
			const { payboxProduction } = gatewayAdditionalInformation;
			this.environment = payboxProduction ? 'prod' : 'dev';
			const validatedResource = await this.validationTokenDateResource(gatewayResponse);
			succeed = validatedResource.status === 'succeeded';
			gatewayResponse.detail = Object.assign(gatewayResponse.detail, validatedResource.detail);
			delete validatedResource.detail;
			gatewayResponse = Object.assign(gatewayResponse, validatedResource);
		}

		await this.registerOrderGateway({
			gatewayAuthorizationResponse: gatewayResponse,
			gatewayResponse,
			paymentStateId: succeed ? payOut : pending,
			flagStatusOrder: validated,
			flagApproval: succeed,
		});

		if (succeed && isDevOrProd()) {
			await SalOrders.handleNotification({ order: this.order, wayPayment: this.order.wayPayment });
		}
		if (query.uri) {
			return h.redirect(`${this.order.commerce.urlDomain}/${query.uri}/${this.order.id}`);
		}
		return gatewayResponse;
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse = {}) {
		const data = {
			status: succeed ? 2 : 1,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	async validationTokenDateResource(response) {
		const { data: dataResource } = await axios({
			url: `${this.getUrlApi()}/transaction/validationTokenDateResource`,
			method: 'POST',
			headers: {
				authorization: `Basic ${this.getTokenApi()}`,
			},
			data: {
				date: response.detail.fecha,
				amount: response.detail.amount,
				token: response.detail.token,
			},
			validateStatus: () => true,
		});
		return dataResource;
	}

	getPaymentGatewayInformation() {
		return {
			code: pagoplux,
			name: 'PagoPlux',
			description: 'Método de pago PagoPlux',
		};
	}

	findPaymentCredentials(subsidiaryCode) {
		const params = {
			subsidiaryCode,
			categoryCode: this.categoryCode,
			integrationCode: 'pagoplux',
		};
		if (this.categoryCode === paymentLink) {
			params.integrationCode = 'pagoplux_link';
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

module.exports = PagoPlux;
