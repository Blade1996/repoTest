/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const simpleAxios = require('../../api/shared/simple-axios');
const PaymentGatewayContract = require('./../PaymentGatewayContract');
const ComEcommerceCompany = require('./../../models/ComEcommerceCompany');

class MiddEcommerce extends PaymentGatewayContract {
	constructor(order, gatewayCode = 'shopify') {
		super();
		this.order = order;
		this.gatewayCode = gatewayCode;
	}

	getUrlApi(env = 'prod') {
		const url = {
			dev: 'https://midd-ecommerce.makipos.la',
			prod: 'https://ecommerce-midd.makipos.la',
		};
		return url[env];
	}

	async createCommerce({ company, subsidiary }) {
		const commerce = await ComEcommerceCompany.getBySubsidiary(company.id, subsidiary.id, true);
		const { data: newCommerce } = await simpleAxios({
			url: `${this.getUrlApi()}/${this.gatewayCode}/commercecreate?token=${commerce.tokenStore}`,
			method: 'POST',
			headers: {
				authorization: `Bearer ${commerce.tokenStore}`,
			},
			data: {
				ruc: subsidiary.ruc,
				hash: commerce.tokenStore,
			},
			validateStatus: () => true,
		});
		return newCommerce;
	}
}

module.exports = MiddEcommerce;
