'use strict';

const Company = require('../models/Company');
const { defaultAxios } = require('./shared/pre');

async function authenticate(request, token) {
	let isValid = false;
	let credentials = {};
	try {
		const artifacts = {};
		if (token) {
			const hapiAxios = defaultAxios('httpAcl', request);
			const { data: aclCompany } = await hapiAxios.get(`/hash-company?hashCode=${token}`);
			const company = await Company.getByAclCode(aclCompany.data.codeCompany);
			credentials = {
				...company,
				acl: aclCompany.data,
			};
			isValid = true;
			return { isValid, credentials, artifacts };
		}
	} catch (error) {
		isValid = false;
		/* eslint-disable no-console */
		console.log(`Error to validate token ${error}`);
	}
	return { isValid, credentials: {} };
}

module.exports = authenticate;
