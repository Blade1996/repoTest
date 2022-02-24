/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const helper = require('./../../models/helper');
const SalOrders = require('../../models/SalOrders');
const ComSubsidiaries = require('../../models/ComSubsidiaries');
const { isDevOrProd, roundTo } = require('./../../shared/helper');
const { validated, inProcess } = require('../../models/StatusOrders');
const PaymentGatewayContract = require('./../PaymentGatewayContract');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const { mercadopago, mercadopagoMp } = require('./../payment-strategies/payment-strategies-codes');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { paymentButton } = require('../type-payment-gateway-enums');
const {
	mercadoPagoPaymentTransactionError,
	mercadoPagoGatewayIncorrectlyConfigured,
	mercadoPagoValidationResponseNotProvided,
	incompleteInformationCanNotCarryOutTransaction,
} = require('./../error-codes/payment-error-codes');
const { payOut, pending } = require('../../models/PaymentState');
const ModuleCode = require('../../models/ModuleCode');

class MercadoPago extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton, paymentStrategyCode) {
		super();
		this.iva = 12;
		this.order = order;
		this.environment = 'dev';
		this.paymentStrategyCode = paymentStrategyCode;
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://api.mercadopago.com',
			prod: 'https://api.mercadopago.com',
		};
		return url[this.environment];
	}

	async createCommerce({ additionalInformation, company }) {
		const { settings } = company;
		const { authorizationMercadopago, refreshTokenMercadopago } = additionalInformation;
		const data = {
			client_secret: settings.accessToken,
			grant_type: 'authorization_code',
		};
		if (refreshTokenMercadopago) {
			data.refresh_token = refreshTokenMercadopago;
		} else {
			data.code = authorizationMercadopago;
			data.redirect_uri = `${process.env.MY_URL}/payment-gateway/notifications`;
		}

		const newCommerce = await axios({
			url: 'https://api.mercadopago.com/oauth/token',
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/x-www-form-urlencoded',
			},
			data,
			validateStatus: () => true,
		});
		if (newCommerce && newCommerce.status !== 200) {
			throw new Error(mercadoPagoGatewayIncorrectlyConfigured);
		}
		newCommerce.grouper = true;
		newCommerce.success = true;
		return newCommerce;
	}

	getPaymentLink() {
		// TODO implement payment link generator method
		return 'link_pago';
	}

	getPaymentGatewayInformation() {
		return {
			code: this.paymentStrategyCode || mercadopago,
			name: 'Mercadopago',
			description: 'Método de pago Mercadopago Marketplace',
		};
	}

	async saveTransaction(params) {
		const gatewayInfo = this.getPaymentGatewayInformation();
		const { orderIds } = this.order;
		const { totalPayment } = params.sessionGateway;
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
			commerceId: orderIds ? undefined : this.order.commerce.id,
			moduleId: ModuleCode.ecommerce,
			orderId: orderIds ? undefined : this.order.id,
			amount: totalPayment || this.getTotalPayment(),
			currency: this.getCurrency(),
			companyId: this.order.companyId,
		};
		return GatewayTransaction.create(data);
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse) {
		const { status, status_detail: statusDetail } = gatewayResponse.gatewayAuthorizationResponse;
		const data = {
			status: succeed ? 2 : 1,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		if (status && status === 'authorized' && statusDetail === 'pending_capture') {
			data.status = 1;
			data.paymentStates = 4; // Pago pendiente por liberar
		}
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	_getPayerInfo() {
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
			firstName: customer.dni ? nameBuyer : customer.rzSocial,
			lastName: customer.dni ? surnameBuyer : undefined,
			email: showValue(arrayEmail, 0),
			city: deliveryAddress && deliveryAddress.city ? deliveryAddress.city.name : '',
			stateName: deliveryAddress && deliveryAddress.city ? deliveryAddress.city.name : '',
			phone: responsiblePickUp ? responsiblePickUp.phone : '',
			address: deliveryAddress ? deliveryAddress.addressLine1 : '',
			documentNumber: deliveryAddress ? deliveryAddress.documentNumber : '',
			zipCode: deliveryAddress ? deliveryAddress.zipcode : '',
			streetNumber: deliveryAddress ? deliveryAddress.number : '',
			identification: {
				number: document,
				type: 'CPF',
			},
		};
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const gatewayInfo = this.getPaymentGatewayInformation();
			let gatewayResponse = {};
			if (gatewayInfo.code === mercadopagoMp) {
				const { commerces, orders } = this.order;
				if (!commerces || !orders) {
					throw new Error(incompleteInformationCanNotCarryOutTransaction);
				}
				gatewayResponse = this._getInfoPaymentsSplit(gateway);
				const editOrder = {
					sessionGateway: gatewayResponse,
					tokenGateway: 'dataToken',
					status: 1,
					paymentStates: 1,
					gatewayResponse,
					gateway,
				};
				const response = await this.registerOrderGateway(editOrder);
				response.amount = gatewayResponse.totalPayment;
				response.payboxProduction = gateway.payboxProduction;
				response.publicKey = gateway.public_key || gateway.publicKey;
				response.hash = this.hash;
				return h.response(response).code(201);
			}

			gatewayResponse = this._getInfoPaymentsV1();
			const editOrder = {
				sessionGateway: gatewayResponse,
				tokenGateway: 'dataToken',
				status: 1,
				paymentStates: 1,
				gatewayResponse,
				gateway,
			};
			const response = await this.registerOrderGateway(editOrder);
			response.amount = this.getTotalPayment();
			response.payboxProduction = gateway.payboxProduction;
			response.publicKey = gateway.public_key || gateway.publicKey;
			response.hash = this.hash;
			response.notification_url = '';
			return h.response(response).code(201);
		}
		throw new Error(mercadoPagoGatewayIncorrectlyConfigured);
	}

	_getDisbursementsData(gateway) {
		const { orders, auth } = this.order;
		const { employee } = auth;
		const { settings } = employee.company;
		const disbursements = [];
		const orderIds = [];
		let totalPayment = 0;
		let reference = '';
		let percentageApplication = Math.round(settings.percentageApplication * 100) / 10000;
		if (Number(process.env.AMOUT_APPLICATION_FEE_EDIT) > 0) {
			percentageApplication = Math.round(process.env.AMOUT_APPLICATION_FEE_EDIT * 100) / 10000;
		}
		percentageApplication = percentageApplication || 0;
		orders.forEach((item) => {
			const { number } = item;
			totalPayment += item.total;
			const subtotal = item.total - item.costShipping;
			let applicationFee = roundTo(subtotal * percentageApplication);
			applicationFee += roundTo(item.costShipping);
			const credentials = gateway.credentials.find(c => c.commerceCode === item.commerce.code);
			reference = `${reference}-${item.id}-PE-${number}`;
			const items = {
				amount: roundTo(item.total),
				external_reference: `${item.id}-PE-${number}`,
				collector_id: credentials.user_id,
				application_fee: roundTo(applicationFee),
				money_release_days: Number(process.env.MONEY_RELEASE_DAYS) || 1,
			};
			disbursements.push({ ...items });
			orderIds.push(item.id);
		});
		return {
			disbursements,
			totalPayment,
			reference,
			orderIds,
			capture: settings.captureSplit || false,
		};
	}

	_getInfoPaymentsSplit(gateway) {
		const {
			firstName, lastName, email, identification,
		} = this._getPayerInfo();
		const {
			disbursements,
			totalPayment,
			reference,
			orderIds,
			capture,
		} = this._getDisbursementsData(gateway);
		return {
			orderIds,
			totalPayment,
			transaction_amount: totalPayment,
			payer: {
				first_name: firstName,
				last_name: lastName,
				email,
				identification,
			},
			binary_mode: true,
			payments: [
				{
					payment_method_id: '',
					payment_type_id: '',
					token: '',
					transaction_amount: totalPayment,
					installments: 1,
					processing_mode: 'aggregator',
					capture,
				},
			],
			disbursements,
			// eslint-disable-next-line max-len
			// notification_url: `${process.env.MY_URL}/payment-gateway/notifications?source_news=webhooks`,
			external_reference: `TR${reference}`,
		};
	}

	_getInfoPaymentsV1() {
		const { number } = this.order;
		const {
			city,
			stateName,
			firstName,
			lastName,
			email,
			identification,
			type,
			zipCode,
			address,
			streetNumber,
		} = this._getPayerInfo();
		const { items } = this._getPayboxBase();
		return {
			action: 'authorize',
			transaction_amount: this.getTotalPayment(),
			description: `${this.order.commerce.name}-PE: ${this.order.number}`,
			payer: {
				first_name: firstName,
				last_name: lastName,
				email,
				identification,
				type,
			},
			notification_url: `${process.env.MY_URL}/payment-gateway/notifications?source_news=webhooks`,
			// eslint-disable-next-line max-len
			binary_mode: true, // Cuando está activado el pago solo puede resultar aprobado o rechazado. De no estar activado, además de este estado el pago puede resultar pendiente (in_process).
			external_reference: `${this.order.id}-PE-${number}`,
			statement_descriptor: 'MercadoPago',
			additional_info: {
				items,
				payer: {
					first_name: firstName,
					last_name: lastName,
					address: {
						zip_code: zipCode,
						street_name: address,
						street_number: streetNumber,
					},
					registration_date: helper.localDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					phone: {
						area_code: '011',
						number: '987654321',
					},
				},
				shipments: {
					receiver_address: {
						street_name: address,
						street_number: streetNumber,
						zip_code: zipCode,
						city_name: city,
						state_name: stateName,
					},
				},
			},
		};
	}

	_getPayboxBase() {
		const { details } = this.order;
		let payboxBase0 = 0;
		let payboxBase12 = 0;
		let taxIva = 0;
		let percentageIva = this.iva / 100;
		percentageIva += 1;
		const items = [];
		details.forEach((item) => {
			const descriptionProduct = item.description ? item.description.slice(0, 255) : '';
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
			items.push({
				id: item.productCode || item.id,
				title: item.productName,
				description: descriptionProduct,
				picture_url: item.productImage,
				category_id: item.categoryName,
				quantity: item.quantity,
				unit_price: item.salePrice.toFixed(2),
			});
		});
		if (this.order.costShippingTax) {
			payboxBase12 += this.order.costShipping - this.order.costShippingTaxAmount;
			taxIva += this.order.costShippingTaxAmount || 0;
		} else {
			payboxBase0 += this.order.costShipping;
		}
		return {
			payboxBase0,
			payboxBase12,
			taxIva,
			items,
		};
	}

	async _validEcommerceDefault(settings) {
		const { commerce, companyId } = this.order;
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

	async _getCredentials() {
		const gatewayInfo = this.getPaymentGatewayInformation();
		const {
			wayPaymentCommerce, auth, commerces, orders,
		} = this.order;
		if (isDevOrProd() && auth) {
			const { employee } = auth;
			const { settings } = employee.company;
			if (gatewayInfo.code === mercadopagoMp) {
				if (!commerces || !orders) {
					throw new Error(incompleteInformationCanNotCarryOutTransaction);
				}
				const promises = [];
				commerces.forEach((comm) => {
					const params = {
						subsidiaryCode: comm.subsidiary.subsidiaryAclCode,
						categoryCode: this.categoryCode,
						integrationCode: gatewayInfo.code,
					};
					promises.push(RedisCredential.getCredentials(auth, { ...params }));
				});
				this.environment = 'prod';
				const resultCredentials = await Promise.all(promises);
				const dataGateWay = resultCredentials.reduce((acum, item, index) => {
					const newItem = { ...item };
					const newAcum = acum;
					this.environment =
						item.credentials_key.payboxProduction === 'production' ? 'prod' : 'dev';
					newItem.credentials_key.commerceCode = commerces[index].code;
					newAcum.push(newItem.credentials_key);
					return newAcum;
				}, []);
				if (commerces.length === dataGateWay.length) {
					return {
						payboxProduction: this.environment === 'prod' ? 'production' : 'dev',
						publicKey: settings.publicKey,
						accessToken: settings.accessToken,
						credentials: dataGateWay,
					};
				}
				return undefined;
			}
			const subsidiary = await this._validEcommerceDefault(settings);
			const params = {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				categoryCode: this.categoryCode,
				integrationCode: gatewayInfo.code,
			};
			if (settings && settings.flagTypeIntegrationGrouper) {
				delete params.subsidiaryCode;
			}
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
			return gatewayConfiguration.find(item => item.code === gatewayInfo.code);
		}
		return undefined;
	}

	async validateTransaction(h, payload) {
		const { gatewayResponse } = payload;
		if (!gatewayResponse) {
			throw new Error(mercadoPagoValidationResponseNotProvided);
		}
		const { action, transactionAmount, token } = gatewayResponse;
		if (!token || !action || action !== 'authorize') {
			throw new Error(mercadoPagoValidationResponseNotProvided);
		}

		const { gatewayTransactionId, companyId } = this.order;
		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		const { sessionGateway, additionalInformation } = gatewayTransaction;

		if (
			!transactionAmount ||
			Number(sessionGateway.transaction_amount) !== Number(transactionAmount)
		) {
			throw new Error(incompleteInformationCanNotCarryOutTransaction);
		}

		if (additionalInformation) {
			const { payboxProduction, token: accessToken, orderIds } = additionalInformation;
			this.environment = payboxProduction ? 'prod' : 'dev';
			let dataResponse;
			if (orderIds && !gatewayTransaction.orderId) {
				this.order.orderIds = orderIds;
				dataResponse = await this.createApiPaymentsSplit({
					sessionGateway,
					accessToken,
					...gatewayResponse,
				});
			} else {
				dataResponse = await this.createApiPayments({
					sessionGateway,
					accessToken,
					...gatewayResponse,
				});
			}
			let codeMercadopago = '';
			if (dataResponse && dataResponse.status !== 200) {
				codeMercadopago =
					dataResponse.data.cause && dataResponse.data.cause[0]
						? dataResponse.data.cause[0].code
						: dataResponse.data.message;
			}
			const succeed =
				dataResponse && (dataResponse.status === 200 || dataResponse.status === 201)
					? ['approved', 'authorized'].indexOf(dataResponse.data.status) > -1
					: false;
			const gatewayErrorCode = succeed
				? ''
				: `${this.errorCodesPaymentTransaction(codeMercadopago) || codeMercadopago}`;
			const informationResponse = await this.registerOrderGateway({
				gatewayAuthorizationResponse: dataResponse.data,
				paymentStateId: succeed ? payOut : pending,
				flagStatusOrder: succeed ? validated : inProcess,
				flagApproval: succeed,
				gatewayErrorCode,
				gatewayResponse: dataResponse.data,
			});
			if (succeed && isDevOrProd()) {
				return h.response(informationResponse).code(200);
			}
			return h.response(informationResponse).code(400);
		}
		return gatewayResponse;
	}

	async getRequestInformation(session, merchandId) {
		const url = this.order.codeGateway === mercadopagoMp ? '/v1/advanced_payments' : '/v1/payments';
		const { data: dataResource } = await axios({
			url: `${this.getUrlApi()}${url}/${merchandId}`,
			method: 'GET',
			headers: {
				authorization: `Bearer ${session.token}`,
			},
			validateStatus: () => true,
		});
		return dataResource;
	}

	async getStatusTransaction() {
		const { gatewayTransactionId, gatewayAdditionalInformation, companyId } = this.order;
		const { payboxProduction } = gatewayAdditionalInformation;
		this.environment = payboxProduction ? 'prod' : 'dev';

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});
		gatewayAdditionalInformation.requestId = gatewayTransaction.tokenGateway;
		const validatedResource = await this.getRequestInformation(
			gatewayAdditionalInformation,
			gatewayTransaction.merchandId,
		);
		if (!validatedResource) {
			throw new Error(mercadoPagoPaymentTransactionError);
		}

		const succeed = ['approved', 'authorized'].indexOf(validatedResource.status) > -1;
		await GatewayTransaction.create({
			codeGateway: gatewayTransaction.codeGateway,
			codeApp: gatewayTransaction.codeApp,
			status: 2,
			typeTransaction: 2,
			dateTransaction: new Date(),
			paymentStates: succeed ? 2 : 3,
			codeCategory: gatewayTransaction.codeCategory,
			referenceId: validatedResource.id,
			amount: gatewayTransaction.amount,
			currency: gatewayTransaction.currency,
			companyId: gatewayTransaction.companyId,
			transactionId: gatewayTransaction.id,
			gatewayAuthorizationResponse: validatedResource,
		});
		if (succeed && isDevOrProd()) {
			validatedResource.gatewayTransaction = gatewayTransaction;
		}
		return validatedResource;
	}

	async getAllTransaction(query) {
		const newQuery = query;
		const { companyId } = this.order;
		const data = await GatewayTransaction.getAllByCustomerId(newQuery, companyId);
		return data;
	}

	async authorizeTransaction(h, payload) {
		const {
			hash, captured, transactionAmount, status,
		} = payload;

		if (!hash || !captured) {
			throw new Error(mercadoPagoValidationResponseNotProvided);
		}

		const { gatewayTransactionId, companyId } = this.order;
		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		const dataPayload = {
			captured,
		};
		const { amount, codeGateway } = gatewayTransaction;
		if (amount !== transactionAmount) {
			dataPayload.transaction_amount = transactionAmount;
		}
		if (status === 'cancelled') {
			dataPayload.status = status;
		}

		if (codeGateway === mercadopagoMp) {
			const gatewayResponse = await this.updateTransactionSplit(dataPayload, gatewayTransaction);
			if (
				gatewayResponse.status &&
				(gatewayResponse.status !== 200 && gatewayResponse.status !== 201)
			) {
				const codeErrorMercadopago =
					gatewayResponse.data.cause && gatewayResponse.data.cause[0]
						? gatewayResponse.data.cause[0].code
						: gatewayResponse.data.message;
				throw new Error(codeErrorMercadopago);
			}
			const succeed = gatewayResponse.data.status === 'approved';
			const data = {
				paymentStates: succeed && gatewayResponse.data.status !== 'cancelled' ? 2 : 3,
				status: 2,
			};
			await GatewayTransaction.edit(gatewayTransaction.id, data);
			if (status === 'cancelled') {
				gatewayResponse.paymentStateId = succeed ? 2 : 3;
				await GatewayTransaction.create({
					codeGateway: mercadopagoMp,
					codeApp: gatewayTransaction.codeApp,
					status: 2,
					typeTransaction: 2,
					dateTransaction: new Date(),
					paymentStates: succeed ? 5 : 3,
					codeCategory: gatewayTransaction.codeCategory,
					referenceId: gatewayResponse.id,
					tokenGateway: gatewayResponse.authorization_code,
					amount: gatewayTransaction.amount,
					currency: gatewayTransaction.currency,
					companyId: gatewayTransaction.companyId,
					transactionId: gatewayTransaction.id,
					gatewayAuthorizationResponse: gatewayResponse.data,
				});
			}
		}
		return true;
	}

	async createApiPayments(params) {
		const {
			accessToken,
			sessionGateway,
			email,
			docType,
			docNumber,
			issuer,
			paymentMethodId,
			installments,
			token,
		} = params;
		const data = sessionGateway;
		data.token = token;
		data.issuer_id = parseInt(issuer, 10);
		data.payment_method_id = paymentMethodId;
		data.installments = parseInt(installments, 10);
		delete data.action;
		delete data.payer.type;
		data.payer.email = email;
		data.payer.identification.type = docType;
		data.payer.identification.number = docNumber;
		const dataResource = await axios({
			url: `${this.getUrlApi()}/v1/payments`,
			method: 'POST',
			headers: {
				authorization: `Bearer ${accessToken}`,
			},
			data,
			validateStatus: () => true,
		});
		return dataResource;
	}

	async createApiPaymentsSplit(params) {
		const {
			accessToken,
			sessionGateway,
			email,
			docType,
			docNumber,
			paymentMethodId,
			paymentTypeId,
			installments,
			token,
		} = params;
		const data = sessionGateway;
		data.payments[0].token = token;
		data.payments[0].payment_type_id = paymentTypeId || 'credit_card';
		data.payments[0].payment_method_id = paymentMethodId;
		data.payments[0].installments = parseInt(installments, 10);
		delete data.orderIds;
		delete data.totalPayment;
		delete data.transaction_amount;
		data.payer.email = email;
		data.payer.identification.type = docType || 'CPF';
		data.payer.identification.number = docNumber;
		const dataResource = await axios({
			url: `${this.getUrlApi()}/v1/advanced_payments`,
			method: 'POST',
			headers: {
				authorization: `Bearer ${accessToken}`,
			},
			data,
			validateStatus: () => true,
		});
		return dataResource;
	}

	async updateTransactionSplit(payload, dataGateWay) {
		const { additionalInformation } = dataGateWay;
		this.environment = !additionalInformation.payboxProduction ? 'dev' : 'prod';
		const dataResource = await axios({
			url: `${this.getUrlApi()}/v1/advanced_payments/${dataGateWay.merchandId}`,
			method: 'PUT',
			headers: {
				authorization: `Bearer ${additionalInformation.token}`,
			},
			data: payload,
			validateStatus: () => true,
		});
		return dataResource;
	}

	errorCodesPaymentTransaction(codeError) {
		const codeMercadopago = {
			1: 'Error de parámetros.',
			3: 'El token debe ser para test.',
			4: 'El usuario no esta autorizado a acceder a este recurso.',
			3002: 'El usuario no está autorizado a realizar esta acción.',
			2000: 'No se ha encontrado el pago.',
			5: 'Debes proveer tu access_token para proceder.',
			23: 'El siguiente parámetro debe ser una fecha válida en formato (yyyy-MM-dd T HH:mm:ssz) date_of_expiration.',
			1000: 'El número de filas excede los límites.',
			1001: 'El formato de fecha debe ser yyyy-MM-dd T HH:mm:ss.SSSZ.',
			2001: 'Ya se posteó el mismo request en el último minuto.',
			2004: 'Falló el POST a Gateway Transactions API.',
			2002: 'Cliente no encontrado.',
			2006: 'Card Token no encontrado.',
			2007: 'Falló la conexión a Card Token API.',
			2009: 'Card token issuer no puede ser nulo.',
			2060: 'El cliente no puede ser igual al vendedor.',
			3000: 'Debes proveer el parámetro cardholder_name en card data.',
			3001: 'Debes proveer el parámetro cardholder_name en card data.',
			3003: 'card_token_id inválido.',
			3004: 'parameter site_id inválido.',
			3005: 'Acción inválida, el recurso esta en un estado que no permite esta operación. Para más información consulta el estado del recurso.',
			3006: 'cardtoken_id inválido.',
			3007: 'El parámetro client_id no puede ser nulo ni vacío.',
			3008: 'Cardtoken no encontrado.',
			3009: 'client_id no autorizado.',
			3010: 'La tarjeta no se encuentra en la lista blanca.',
			3011: 'payment_method no encontrado.',
			3012: 'security_code_length inválido.',
			3013: 'El parámetro security_code es requerido y no puede ser nulo ni vacío.',
			3014: 'payment_method inválido.',
			3015: 'card_number_length inválido.',
			3016: 'card_number inválido.',
			3017: 'El parámetro card_number_id no puede ser nulo ni vacío.',
			3018: 'El parámetro expiration_month no puede ser nulo ni vacío.',
			3019: 'El parámetro expiration_year no puede ser nulo ni vacío.',
			3020: 'El parámetro cardholder.name no puede ser nulo ni vacío.',
			3021: 'El parámetro cardholder.document.number no puede ser nulo ni vacío.',
			3022: 'El parámetro cardholder.document.type no puede ser nulo ni vacío.',
			3023: 'El parámetro cardholder.document.subtype no puede ser nulo ni vacío.',
			3024: 'Acción inválida, reembolsos parciales no soportados para esta transacción.',
			3025: 'Código de autorización inválido.',
			3026: 'card_id inválido para este payment_method_id.',
			3027: 'payment_type_id inválido.',
			3028: 'payment_method_id inválido.',
			3029: 'Mes de expiración de tarjeta inválido.',
			3030: 'Año de expiración de tarjeta inválido.',
			4000: 'El parámetro card no puede ser nulo.',
			4001: 'payment_method_id no puede ser nulo.',
			4002: 'transaction_amount no puede ser nulo.',
			4003: 'transaction_amount debe ser numérico.',
			4004: 'installments no puede ser nulo.',
			4005: 'installments debe ser numérico.',
			4006: 'payer está mal formado.',
			4007: 'site_id no puede ser nulo.',
			4012: 'payer.id no puede ser nulo.',
			4013: 'payer.type no puede ser nulo.',
			4015: 'payment_method_reference_id no puede ser nulo.',
			4016: 'payment_method_reference_id debe ser numérico.',
			4017: 'status no puede ser nulo.',
			4018: 'payment_id no puede ser nulo.',
			4019: 'payment_id debe ser numérico.',
			4020: 'notificaction_url debe ser una url válida.',
			4021: 'notificaction_url debe tener una longitud menor a 500 caracteres.',
			4022: 'metadata debe ser un JSON válido.',
			4023: 'transaction_amount no puede ser nulo.',
			4024: 'transaction_amount debe ser numérico.',
			4025: 'refund_id no puede ser nulo.',
			4026: 'coupon_amount inválido.',
			4027: 'campaign_id debe ser numérico.',
			4028: 'coupon_amount atributte debe ser numérico.',
			4029: 'Tipo de payer inválido.',
			4037: 'transaction_amount inválido.',
			4038: 'application_fee no puede ser mayor que transaction_amount.',
			4039: 'application_fee no puede ser un valor negativo.',
			4050: 'payer.email debe ser un email válido.',
			4051: 'La longitud de payer.email debe ser menor que 254 caracteres.',
			7523: 'Fecha de expiración inválida.',
			400004: 'Aplicación inválida.',
			400005: 'Se requiere la aplicación.',
			400006: 'Fecha de liberación no válida para el desembolso.',
			400007: 'Fecha de liberación no válida para el desembolso.',
			400013: 'Dirección de correo electrónico inválida.',
			400014: 'Número de pagos no válido.',
			400015: 'Se requiere payer id para pagos con dinero en la cuenta.',
			400016: 'Tipo de pago no válido.',
			400017: 'Se requiere el monto de la transacción.',
			400018: 'Monto invalido.',
			400019: 'Se requiere el método de pago.',
			400020: 'Se requiere el tipo de pago.',
			400021: 'El formato de la cantidad no es válido.',
			400022: 'Método de procesamiento no válido.',
			400023: 'Se requiere el tipo de pagador.',
			400024: 'Se requiere el nombre del pagador.',
			400025: 'Se requiere el apellido del pagador.',
			400026: 'Se requiere el tipo de identificación del pagador.',
			400027: 'Se requiere el número de identificación del pagador.',
			400028: 'Se requiere la fecha de vencimiento.',
			400029: 'Se requiere el token de pago.',
			400030: 'Las cuotas son obligatorias.',
			400031: 'Se requiere el monto de los desembolsos.',
			400032: 'Se requiere la identificación del recolector.',
			400033: 'Comisión de Marketplace no válida.',
			400034: 'Monto de desembolso no válido.',
			400035: 'El campo money_release_date no es válido.',
			400036: 'Marketplace no tiene permisos sobre el pagador.',
			400037: 'El recaudador no fue encontrado.',
			400039: 'Solicitud no válida.',
			400040: 'Estado inválido.',
			400041: 'Fecha de inicio no válida.',
			400042: 'Fecha de finalización no válida.',
			400043: 'Dirección de correo electrónico inválida.',
			400044: 'ID de pagador no válido.',
			400045: 'ID de recaudador no válido.',
			400046: 'El campo external_reference no es válido.',
			400047: 'Algunos parámetros de la búsqueda no son válidos.',
			400048: 'Identificación invalida.',
			400049: 'Fecha de última modificación no válida.',
			400051: 'El campo money_release_date es obligatorio.',
			400052: 'El modo de procesamiento es obligatorio.',
			400053: 'Contenido no válido',
			400054: 'Marketplace no tiene permisos sobre el recopilador.',
			400055: 'El campo external_reference es obligatorio.',
			400056: 'El campo money_release_days no es válido.',
			400057: 'Los campos collector_id y external_reference están duplicados.',
			400058: 'Clave de idempotencia no válida.',
			401000: 'Token de acceso no válido.',
			401002: 'Token de acceso no válido.',
			401003: 'Token de dispositivo no válido.',
			404001: 'No se encontró el desembolso.',
			404002: 'No se encontró el pago por adelantado.',
			404003: 'El Pagador no fue encontrado.',
			406001: 'Error en la API de pagos.',
		};
		const errorKeys = Object.keys(codeMercadopago);
		const errorEureka = errorKeys.filter(item => item === `${codeError}`);
		return errorEureka.length > 0 ? `${codeMercadopago[errorEureka[0]]}` : '';
	}

	async registerOrderGateway(params) {
		const {
			commerceId, commerce, wayPaymentCommerce, orderIds,
		} = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
			const {
				sessionGateway: session, status, paymentStates, gateway,
			} = paramsNew;
			const referenceId = session.external_reference || null;
			const newGatewayTransaction = await this.saveTransaction({
				sessionGateway: session,
				status,
				paymentStates,
				referenceId,
				tokenGateway: params.sessionGateway.id,
				gatewayErrorCode: paramsNew.status === 2 ? session.result.code : null,
				additionalInformation: {
					payboxProduction: this.environment === 'prod' || false,
					token: gateway.access_token || gateway.accessToken,
					orderIds: session.orderIds,
				},
			});
			paramsNew.additionalInformation = { gatewayTransactionId: newGatewayTransaction.id };
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			paramsNew.wayPaymentId = wayPaymentCommerce ? wayPaymentCommerce.wayPaymentId : undefined;
		} else {
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			const { gatewayTransactionId, paymentGateway } = paramsNew.additionalInformation;
			const gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayResponse,
				tokenGateway: `${paymentGateway.authorizationCode}`,
				referenceId: paymentGateway.referenceId,
				merchandId: paymentGateway.merchandId,
			};
			paramsNew.tokenGateway = `${paymentGateway.authorizationCode}`;
			paramsNew.referenceId = paymentGateway.referenceId;
			if (!params.flagApproval) {
				if (paramsNew.gatewayErrorCode) {
					paramsNew.gatewayErrorCode = paymentGateway.statusDetails;
				}
				gatewayTransaction.gatewayErrorCode = `code: ${paramsNew.gatewayErrorCode}`;
			}
			await this._updateTransaction(gatewayTransactionId, params.flagApproval, gatewayTransaction);
		}
		if (!commerceId) {
			paramsNew.commerceId = commerce.id;
		}
		delete paramsNew.gatewayResponse;
		delete paramsNew.paymentStates;
		delete paramsNew.codeCategory;
		delete paramsNew.referenceId;
		delete paramsNew.gateway;
		delete paramsNew.status;
		if (orderIds) {
			await SalOrders.editMultiple(
				orderIds,
				{
					...paramsNew,
				},
				this.order.companyId,
			);
			return paramsNew.additionalInformation;
		}
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
		const {
			status, id, external_reference: externalReference, payments, message,
		} =
			gatewayResponse || {};
		let { status_detail: statusDetails, authorization_code: authorizationCode } =
			gatewayResponse || {};
		if (payments && Array.isArray(payments) && payments.length > 0) {
			statusDetails = payments[0].status_detail;
			authorizationCode = authorizationCode || payments[0].authorization_code;
			paymentGateway.merchandId = id;
		}
		paymentGateway.requestId = statusDetails && id ? id : paymentGateway.requestId;
		paymentGateway.referenceId =
			externalReference && id ? externalReference : paymentGateway.referenceId;

		paymentGateway.status = id && status ? this._getStatusValid(status) : paymentGateway.status;
		paymentGateway.statusDetails = id && status ? statusDetails : paymentGateway.status;
		paymentGateway.statusDetailsMessage = statusDetails
			? this._getStatusDetailMessage(statusDetails)
			: paymentGateway.statusDetailsMessage;
		if (!paymentGateway.statusDetailsMessage && message) {
			paymentGateway.statusDetailsMessage = message;
		}
		paymentGateway.authorizationCode = authorizationCode || paymentGateway.authorizationCode;
		additionalInformation.gatewayCode = mercadopago;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	_getStatusDetailMessage(statusDetail) {
		let message;
		if (statusDetail === 'accredited') {
			message = '¡Listo! Se acreditó tu pago.';
		} else if (statusDetail === 'pending_contingency') {
			message =
				'Estamos procesando tu pago. No te preocupes, menos de 2 días hábiles te avisaremos por e-mail si se acreditó.';
		} else if (statusDetail === 'pending_review_manual') {
			message =
				'Estamos procesando tu pago. No te preocupes, menos de 2 días hábiles te avisaremos por e-mail si se acreditó o si necesitamos más información.';
		} else if (statusDetail === 'cc_rejected_bad_filled_card_number') {
			message = 'Revisa el número de tarjeta.';
		} else if (statusDetail === 'cc_rejected_bad_filled_date') {
			message = 'Revisa la fecha de vencimiento.';
		} else if (statusDetail === 'cc_rejected_bad_filled_other') {
			message = 'Revisa los datos.';
		} else if (statusDetail === 'cc_rejected_bad_filled_security_code') {
			message = 'Revisa el código de seguridad de la tarjeta.';
		} else if (statusDetail === 'cc_rejected_blacklist') {
			message = 'No pudimos procesar tu pago.';
		} else if (statusDetail === 'cc_rejected_call_for_authorize') {
			message = 'Debes autorizar ante entidad el pago.';
		} else if (statusDetail === 'cc_rejected_card_disabled') {
			message =
				'Llama a la entidad para activar tu tarjeta o usa otro medio de pago. El teléfono está al dorso de tu tarjeta.';
		} else if (statusDetail === 'cc_rejected_card_error') {
			message = 'No pudimos procesar tu pago.';
		} else if (statusDetail === 'cc_rejected_duplicated_payment') {
			message =
				'Ya hiciste un pago por ese valor. Si necesitas volver a pagar usa otra tarjeta u otro medio de pago.';
		} else if (statusDetail === 'cc_rejected_high_risk') {
			message =
				'Tu pago fue rechazado. Elige otro de los medios de pago, te recomendamos con medios en efectivo.';
		} else if (statusDetail === 'cc_rejected_insufficient_amount') {
			message = 'Tu metodo de pago no tiene fondos suficientes.';
		} else if (statusDetail === 'cc_rejected_invalid_installments') {
			message = 'El metodo de pago no procesa pagos en cuotas.';
		} else if (statusDetail === 'cc_rejected_max_attempts') {
			message =
				'Llegaste al límite de intentos permitidos. Elige otra tarjeta u otro medio de pago.';
		} else if (statusDetail === 'cc_rejected_other_reason') {
			message = 'El metodo de pago no procesó el pago.';
		}
		return message;
	}

	_getStatusValid(status) {
		let name;
		if (status === 'approved') {
			name = 'Aprobado';
		} else if (status === 'failed' || status === 'rejected') {
			name = 'Rechazado';
		} else if (status === 'in_process') {
			name = 'Pendiente';
		} else if (status === 'authorized') {
			name = 'Captura pendiente';
		}
		return name;
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = MercadoPago;
