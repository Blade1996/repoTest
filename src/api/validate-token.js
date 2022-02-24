'use strict';

const { isNullOrUndefined } = require('util');
const Company = require('./../models/Company');
const { defaultAxios } = require('./shared/pre');
const { isDevOrProd } = require('./../shared/helper');

async function parserToken(request, token = '') {
	if (isDevOrProd()) {
		const [head, payload, signature] = token.split('.');
		if (isNullOrUndefined(payload) && isNullOrUndefined(signature)) {
			const hapiAxios = defaultAxios('httpAcl', request, { version: 2 });
			const { data } = await hapiAxios.get('/authorization');
			return `${data.token}`;
		}
		return `${head}.${payload}.${signature}`;
	}
	return null;
}

async function getCompanyByAclCode(codeCompany, RedisTx) {
	let credentials = {};
	try {
		const data = await RedisTx.getDataKey(codeCompany);
		if (data && data !== '') {
			credentials = JSON.parse(data);
		} else {
			const company = await Company.getByAclCode(codeCompany);
			await RedisTx.setDataKey(codeCompany, JSON.stringify(company));
			await RedisTx.expireKey(codeCompany);
			credentials = company;
		}
	} catch (error) {
		/* eslint-disable no-console */
		console.log(`Error to validate token ${error}`);
	}
	return credentials;
}

module.exports = {
	parserToken,
	getCompanyByAclCode,
};
