'use strict';

/* istanbul ignore next */
const ComEcommerceCompany = require('./../models/ComEcommerceCompany');
const Redis = require('./redis/redis-connection');
const Token = require('./validate-token');

async function authenticate(request, tokenStore) {
	try {
		let isValid = false;
		const artifacts = {};
		if (tokenStore) {
			const currentKey = `${process.env.REDIS_DB}${tokenStore}`;
			const data = await Redis.getDataKey(currentKey);
			let credentials = {};
			if (!data) {
				const commerce = await ComEcommerceCompany.getByTokenStore(tokenStore);
				if (commerce) {
					credentials = commerce;
					credentials.com_subsidiaries_id = commerce.subsidiary.id;
					credentials.company = commerce.company;
					credentials.subsidiary = commerce.subsidiary;
					credentials.authorization = `Bearer ${tokenStore}`;
					credentials.tokenStore = tokenStore;
					const commerceNew = { ...commerce };
					delete commerceNew.company;
					delete commerceNew.subsidiary;
					delete commerceNew.wayPaymentCommerce;
					credentials.commerce = commerceNew;
					const company = await Token.getCompanyByAclCode(credentials.company.aclCode, Redis);
					credentials.cms_companies_id = company.id;
					delete credentials.commerce.company;
					// Eliminar luego de replicar la informacion en los demas repositorios
					delete company.item;
					delete company.currencies;
					delete company.currencyDefault;
					delete company.salPriceListDefault;
					credentials.com_item_id = company.comItemId;
					credentials.commerce.company = company;
					//
					await Redis.setDataKey(tokenStore, JSON.stringify(credentials));
					await Redis.expireKey(tokenStore);
					isValid = true;
				}
			} else {
				credentials = JSON.parse(data);
				credentials.com_subsidiaries_id = credentials.subsidiary.id;
				credentials.authorization = `Bearer ${credentials.tokenStore}`;
				isValid = true;
			}
			// Actualizar informacion de compa-ia si el token es valido
			if (isValid) {
				const company = await Token.getCompanyByAclCode(credentials.company.aclCode, Redis);
				delete company.item;
				delete company.currencies;
				delete company.currencyDefault;
				delete company.salPriceListDefault;
				credentials.com_item_id = company.comItemId;
				credentials.cms_companies_id = company.id;
				credentials.commerce.company = company;
				credentials.company = company;
			}
			return { isValid, credentials, artifacts };
		}
	} catch (error) {
		/* eslint-disable no-console */
		console.log(`Error to validate store-token ${error}`);
	}
	return { isValid: false, credentials: {} };
}

module.exports = authenticate;
