'use strict';

const { isDevOrProd } = require('../shared/helper');
const { isNullOrUndefined } = require('util');
const bluebird = require('bluebird');
const redis = require('redis');

const codeProject = 'maki_project';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

/** @type {RedisClient} */
let client = null;

if (isDevOrProd()) {
	client = redis.createClient({
		host: process.env.REDIS_LICESES_HOST,
		port: process.env.REDIS_LICESES_PORT,
	});
	client.on('error', (err) => {
		/* eslint-disable no-console */
		console.log(`Error Redis Credetials ${err}`);
	});
}

const notificationType = {
	MAIL: ['GMAIL', 'AWS', 'SMTP', 'OUTLOOK'],
	MESSENGER: ['WTSAPP', 'FBMSG', 'WMAKI'],
	SMS: ['SMS'],
	PUSH: ['FBNOT', 'SNS'],
};

async function setDataKey(key, data) {
	try {
		return client.setAsync(key, JSON.stringify(data));
	} finally {
		console.log('Key created');
	}
}

async function getDataKey(key) {
	try {
		const data = client.getAsync(key);
		return data;
	} finally {
		console.log('Key found');
	}
}

function getAccountKey(credentials) {
	let credentialCert = '';
	let credentialCertFather;
	const codeProjectValid =
		(credentials.project && credentials.project.code_project) ||
		(credentials.company && credentials.company.codeProject) ||
		codeProject;
	const baseCredentils = `credential-${codeProjectValid}`;
	const { company_parent_id: companyFatherId, company: companyFather } = credentials.company;
	if (companyFather && !isNullOrUndefined(companyFatherId)) {
		credentialCertFather = `${baseCredentils}-${companyFather.code_company}`;
	}
	credentialCert = `${baseCredentils}-${credentials.company.code_company ||
		credentials.company.code}`;
	return {
		credentialCert,
		credentialCertFather,
	};
}

async function getAllCredentials(credentialCert, categoryCode, integrationCode = undefined) {
	let currentKey;
	const replies = await client.keysAsync(`${process.env.REDIS_LICESES_DB}${credentialCert}*`);
	replies.forEach((item) => {
		if (integrationCode && integrationCode === item.slice(-integrationCode.length)) {
			currentKey = item;
		} else if (
			!integrationCode &&
			notificationType[categoryCode].indexOf(item.slice(credentialCert.length + 1)) > -1
		) {
			currentKey = item;
		}
	});
	return currentKey;
}

async function findCredentialRedis(auth, { subsidiaryCode, categoryCode, integrationCode }) {
	try {
		let data;
		let currentKey;
		const accountKey = getAccountKey(auth);
		if (subsidiaryCode) {
			accountKey.credentialCert += `-${subsidiaryCode}`;
		}
		accountKey.credentialCert += `-${categoryCode}`;
		currentKey = await getAllCredentials(accountKey.credentialCert, categoryCode, integrationCode);
		if (isNullOrUndefined(currentKey) && accountKey.credentialCertFather) {
			accountKey.credentialCertFather += `-${categoryCode}`;
			currentKey = await getAllCredentials(accountKey.credentialCertFather, integrationCode);
		}
		if (!isNullOrUndefined(currentKey)) {
			data = await client.getAsync(`${process.env.REDIS_LICESES_DB}${currentKey}`);
			data = JSON.parse(data);
		}
		return data;
	} catch (error) {
		throw new Error(error, 'CREDELTIAL_NOT_FOUND');
	}
}

async function getCredentials(auth, filters = {}) {
	try {
		const data = await findCredentialRedis(auth, filters);
		if (data) {
			const { credentials_key: credentials } = data;
			data.credentials_key = JSON.parse(credentials);
		}
		return data;
	} catch (error) {
		console.log('ERROR DATA', error);
		throw new Error(error, 'CREDELTIAL_NOT_FOUND');
	}
}

const methods = {
	getAllCredentials,
	getCredentials,
	getAccountKey,
	setDataKey,
	getDataKey,
};

module.exports = methods;
