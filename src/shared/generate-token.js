'use strict';

const bcryptjs = require('bcryptjs');
const Boom = require('boom');

async function generateToken(cryptrData) {
	try {
		let newCryptr;
		if (cryptrData) {
			const jumps = bcryptjs.genSaltSync(10);
			newCryptr = await bcryptjs.hash(cryptrData, jumps);
		}
		return newCryptr.replace(/\//gi, '_');
	} catch (error) {
		/* eslint-disable no-console */
		return Boom.badImplementation(error, error);
	}
}

async function buildAndGenerateToken(codeCompany, companyId, code, documentNumber) {
	const cryptr = `${codeCompany}-${companyId}-${code}-${documentNumber}`;
	const token = await generateToken(cryptr);
	return token;
}

async function buildAndGenerateTransactionHash(orderId, companyId, gatewayCode) {
	const cryptr = `${orderId}-${companyId}-${gatewayCode}`;
	const hash = await generateToken(cryptr);
	return hash;
}

const methods = {
	generateToken,
	buildAndGenerateToken,
	buildAndGenerateTransactionHash,
};

module.exports = methods;
