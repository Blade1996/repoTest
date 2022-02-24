/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const { isNullOrUndefined } = require('util');
const RedisCredential = require('../../process-integration/redis-credential');
const SalOrders = require('../../models/SalOrders');
const Integration = require('../../models/Integration');
const GatewayTransaction = require('../../models/GatewayTransaction');
const PaymentGatewayContract = require('./../PaymentGatewayContract');
const helper = require('../../models/helper');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { payOut, pending } = require('../../models/PaymentState');
const { validated } = require('../../models/StatusOrders');
const {
	leadgodsPaymentTransactionError,
	leadgodsGatewayCommerceNotConfig,
} = require('./../error-codes/payment-error-codes');
const integrationTypeEntity = require('../../models/enums/integration-type-entity-enum');
const ModuleCode = require('../../models/ModuleCode');

class LeadGods extends PaymentGatewayContract {
	constructor(order) {
		super();
		this.order = order;
		this.gatewayCode = 'leadgods';
	}

	getUrlApi(env = 'prod') {
		const url = {
			dev: 'https://dev.dashboard.api.leadgods.com/es',
			prod: 'https://dashboard.api.leadgods.com/es',
		};
		return url[env];
	}

	getTokenApi(env = 'prod') {
		const token = {
			dev: '356a192b7913b04c54574d18c28d46e6395428ab',
			prod: '356a192b7913b04c54574d18c28d46e6395428ab',
		};
		return token[env];
	}

	async createCommerce({ env }) {
		const { data: newCommerce } = await axios({
			url: `${this.getUrlApi(env)}/api-reseller/partner`,
			method: 'POST',
			headers: {
				authorization: this.getTokenApi(env),
			},
			data: {
				name: this.order.name,
				lastName: this.order.lastName,
				email: this.order.email,
				password: this.order.password,
			},
			validateStatus: () => true,
		});
		return newCommerce;
	}

	async getPaymentLink({
		env = 'prod',
		categoryCode = 'PRODUCT',
		type = 3,
		subType = 104,
		tokenCommerce,
		dataGateWay,
	}) {
		const newItems = this.order.details.map(item => ({
			code: item.productCode,
			name: item.productName,
			quantity: item.quantity,
			amount: item.salePrice,
			currency: this.order.currency || 'PEN',
			edit: false,
		}));
		if (this.order.costShipping) {
			newItems.push({
				code: 'costShipping',
				name: 'Costo de envío',
				quantity: 1,
				amount: this.order.costShipping,
				currency: this.order.currency || 'PEN',
				edit: false,
			});
		}
		const { data: dataLink, status } = await axios({
			url: `${this.getUrlApi(env)}/checkout/link`,
			method: 'POST',
			headers: {
				authorization: tokenCommerce,
			},
			data: {
				sesionDirect: true,
				product: {
					code: categoryCode,
					type,
					subType,
					details: {
						detail: 'Detalle de tu orden',
					},
				},
				items: newItems,
				resellerCode: this.getTokenApi(env),
				billing: this._getBillingInfo(),
				shipping: this._getShippingInfo(),
				reference: this.order.id,
				currency: this.order.currency,
				redirectUri: `${process.env.MY_URL}/payment-gateway/validation`,
			},
			validateStatus: () => true,
		});
		if (status === 200 && dataLink.success) {
			dataLink.data.url = `${dataLink.data.url}/single`;
		}
		const editOrder = {
			sessionGateway: dataLink,
			tokenGateway: dataLink.data.token,
		};
		await this.registerOrderGateway(editOrder, dataGateWay);
		return dataLink;
	}

	async getCheckoutInformation({ auth, h }) {
		const integration = await Integration.getByCode(
			{ code: this.gatewayCode, typeEntity: integrationTypeEntity.integration },
			this.order.companyId,
		);
		const dataGateWay = await RedisCredential.getCredentials(auth, {
			subsidiaryCode: this.order.subsidiary.subsidiaryAclCode,
			categoryCode: integration.codeCategory,
			integrationCode: integration.code,
		});
		if (!dataGateWay) {
			throw new Error(leadgodsGatewayCommerceNotConfig);
		}
		return h
			.response(await this.getPaymentLink({
				tokenCommerce: dataGateWay.credentials_key.token,
				dataGateWay,
			}))
			.code(201);
	}

	async validateTransaction(h, query) {
		if (!query.status) {
			throw new Error(leadgodsPaymentTransactionError);
		}
		const editOrder = {
			gatewayAuthorizationResponse: query,
			gatewayErrorCode: query.status === 'Error' ? query.status : '',
			paymentStateId: query.status === 'Completed' ? payOut : pending,
			flagStatusOrder: validated,
			tokenGateway: query.reference,
			flagApproval: query.status === 'Completed',
		};
		await this.registerOrderGateway(editOrder);

		await SalOrders.handleNotification({ order: this.order, wayPayment: this.order.wayPayment });
		if (!query.test) {
			return h.redirect(this.getUrlRedirect({ query }));
		}
		return { urlRedirect: this.getUrlRedirect({ query }) };
	}

	async registerOrderGateway(params, dataGateWay) {
		const newParams = { ...params };
		let gatewayTransaction = {};
		let newGatewayTransaction = {};
		if (params.sessionGateway) {
			gatewayTransaction = {
				code: await buildAndGenerateTransactionHash(
					this.order.id,
					this.order.companyId,
					this.gatewayCode,
				),
				codeGateway: this.gatewayCode,
				codeApp: this.order.codeApp,
				dateTransaction: helper.localDate(new Date(), 'DD-MM-YYYY HH:mm:ss'),
				moduleId: ModuleCode.ecommerce,
				companyId: this.order.companyId,
				commerceId: this.order.commerceId,
				orderId: this.order.id,
				...params,
				merchandId: dataGateWay.credentials_key.id,
				amount: this.order.total,
				currency: this.order.currency,
				paymentStates: 1,
			};
			newGatewayTransaction = await GatewayTransaction.create(gatewayTransaction);
			newParams.additionalInformation = {
				gatewayTransactionId: newGatewayTransaction.id,
				gatewayCode: this.gatewayCode,
			};
		} else {
			gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayAuthorizationResponse,
				gatewayErrorCode: params.gatewayAuthorizationResponse.status,
				status: 2,
				paymentStates: params.paymentStateId === payOut ? 2 : 3,
			};
			await GatewayTransaction.edit(
				this.order.additionalInformation.gatewayTransactionId,
				gatewayTransaction,
			);
		}

		return SalOrders.editSimple(
			this.order.id,
			{
				...newParams,
				flagStatusOrder: 3,
			},
			this.order.companyId,
		);
	}

	_getShippingInfo() {
		const { responsiblePickUp, deliveryAddress, customer } = this.order;
		const arraySplit = (str, sep = ' ') => (str || '').split(sep);
		const showValue = (array, pos) => (array.length > pos && array[pos]) || '';
		const arrayNames = arraySplit(responsiblePickUp && responsiblePickUp.name);
		const arrayEmail = arraySplit((responsiblePickUp && responsiblePickUp.email) || customer.email);
		return {
			name: showValue(arrayNames, 0),
			lastName: showValue(arrayNames, 1),
			email: showValue(arrayEmail, 0),
			phone: responsiblePickUp ? responsiblePickUp.phone : '',
			city: deliveryAddress && deliveryAddress.city ? deliveryAddress.city.name : '',
			address: deliveryAddress ? deliveryAddress.addressLine1 : '',
			countryCode: 'PE',
			documentNumber: deliveryAddress ? deliveryAddress.documentNumber : '',
		};
	}

	_getBillingInfo() {
		const { customer } = this.order;
		const phones = customer.phoneNumbers;
		const phoneNumbers = Array.isArray(phones) && phones.length > 0 && phones[0];
		return {
			name: customer.name ? customer.name : customer.rzSocial,
			lastName: customer.lastname ? customer.lastname : customer.rzSocial,
			email: customer.email,
			phone: customer.phone || phoneNumbers,
			city: customer.city ? customer.city.name : '',
			address: customer.address,
			countryCode: 'PE',
			documentNumber: customer.dni || customer.ruc,
		};
	}

	getPaymentGatewayInformation() {
		return {
			code: this.gatewayCode,
			name: 'MarketPagos',
			description: 'Método de pago MarketPagos',
		};
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}

	getUrlRedirect({ query = {} }) {
		const { urlDomain, settings } = this.order.commerce;
		if (!isNullOrUndefined(settings) && !isNullOrUndefined(settings.urlRedirect)) {
			return settings.urlRedirect;
		}
		if (!isNullOrUndefined(urlDomain) && urlDomain.indexOf('pagoexitoso') >= 0) {
			return urlDomain;
		}
		return `${this.order.commerce.urlDomain}/pedido/${this.order.id}?status=${
			query.status
		}&reference=${query.reference}`;
	}
}

module.exports = LeadGods;
