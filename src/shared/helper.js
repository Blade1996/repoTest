/* eslint-disable no-nested-ternary */
/* eslint-disable no-mixed-operators */

'use strict';

const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const password = '26ae5cc854e36b6bdfca366848dea6bb';

function isNullOrUndefined(object) {
	return object === null || object === undefined;
}

function isDevOrProd() {
	return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production';
}

function isDataValid(data) {
	return [1].indexOf(data) > -1;
}

function getDeviceInfo(info) {
	const userAgent = (info && info.name) || '';
	const ipClient = (info && info.clienteIp) || '';
	const isAndroid = userAgent.includes('Android');
	const isIphone = userAgent.includes('iPhone');
	const isWindows = userAgent.includes('Windows');
	const isLinux = userAgent.includes('Linux');
	const isMac = userAgent.includes('Macintosh');

	const agentArray = userAgent
		.replace(/[();]/g, ',')
		.split(',')
		.map(el => el.trim());

	const os =
		isAndroid || isIphone || isMac || isLinux
			? agentArray[2]
			: isWindows
				? agentArray[1]
				: 'No tiene Os';
	const device = isAndroid
		? agentArray[3]
		: isMac || isIphone
			? agentArray[1]
			: isWindows
				? agentArray[2]
				: 'No tiene Nombre';
	const browser = agentArray[agentArray.length - 1] || 'No existe Navegador';

	return {
		os,
		device,
		browser,
		ipClient,
	};
}

function configCompanySerie0(data) {
	return (
		[
			364,
			350,
			395,
			382,
			397,
			405,
			416,
			451,
			454,
			458,
			468,
			471,
			487,
			491,
			497,
			508,
			509,
			516,
			524,
			562,
			577,
			597,
			604,
		].indexOf(data) > -1
	);
}

function configCompanySerieP(data) {
	return [363].indexOf(data) > -1;
}

function configCompanySerieA(data) {
	return [534].indexOf(data) > -1;
}

function getBdProducts() {
	let bdName = process.env.BD_NAME_PRODUCTS_TEST;
	if (process.env.NODE_ENV === 'development') {
		bdName = process.env.BD_NAME_PRODUCTS_DEV;
	} else if (process.env.NODE_ENV === 'production') {
		bdName = process.env.BD_NAME_PRODUCTS_PROD;
	}
	return bdName;
}

function sortData(arr, filed = 'salesAmount', sort = 'desc') {
	const auxReport = arr.filter(item => item[filed] > 0);
	if (sort === 'asc') {
		return auxReport.sort((a, b) => {
			if (a[filed] > b[filed]) {
				return 1;
			}
			if (a[filed] < b[filed]) {
				return -1;
			}
			return 0;
		});
	}
	return auxReport.sort((a, b) => {
		if (a[filed] < b[filed]) {
			return 1;
		}
		if (a[filed] > b[filed]) {
			return -1;
		}
		return 0;
	});
}

function uniqueValues(arr) {
	return [...new Set(arr)];
}

function validObject(arg) {
	const data = arg || {};
	return !Array.isArray(data) ? data : {};
}

function validCurrentArray(arg, current, isObject = false, code = 'code') {
	let data = arg || [];
	if (current && Array.isArray(current)) {
		const merge = (a, b, p) => a.filter(aa => !b.find(bb => aa[p] === bb[p])).concat(b);
		data = isObject
			? merge(data, current, code)
			: current.concat(data.filter(item => current.indexOf(item) < 0));
	}
	return Array.isArray(data) ? data : [];
}

function removeDuplicates(originalArray, nameDelete) {
	let newArray = [...originalArray];
	if (nameDelete) {
		newArray = newArray.map((i) => {
			const newItem = { ...i };
			delete newItem[`${nameDelete}`];
			return newItem;
		});
	}
	const uniqueObjectsOneLiner = [...new Set(newArray.map(o => JSON.stringify(o)))].map(string =>
		JSON.parse(string));
	return [...uniqueObjectsOneLiner];
}

function encrypt(texto) {
	const iv = Buffer.from(password, 'hex');
	const cipher = crypto.createCipheriv(algorithm, password, iv);
	let crypted = cipher.update(texto, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

function roundTo(number) {
	return Math.round(number * 100) / 100;
}

function toRad(value) {
	return (value * Math.PI) / 180;
}

function getLinearDistanceKm(latitude, longitude, latitude2, longitude2) {
	const diffLat = toRad(latitude2 - latitude);
	const diffLon = toRad(longitude2 - longitude);

	const a =
		Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
		Math.cos(toRad(latitude)) *
			Math.cos(toRad(latitude2)) *
			Math.sin(diffLon / 2) *
			Math.sin(diffLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

	const earthRadiusKm = 6378.0;

	return c * earthRadiusKm;
}

function roundFixedToNumber(number = 0, decimal = 2) {
	return Number(number.toFixed(decimal));
}

function roundLimit(min = 1, max = 100) {
	let base = max + 1;
	base -= min;
	const sum = base + min;
	return Math.floor(Math.random() * sum);
}

function decrypt(texto) {
	const iv = Buffer.from(password, 'hex');
	const decipher = crypto.createDecipheriv(algorithm, password, iv);
	let decrypted = decipher.update(texto, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

function defaultCacheResource(expiresIn = 3600, generateTimeout = 5) {
	const cache = {
		cache: 'redisCache',
		expiresIn: isDevOrProd() ? expiresIn * 1000 : 1,
		generateTimeout: generateTimeout * 1000,
	};
	return cache;
}

async function PromiseAll(promisesToExecute, jump = 1) {
	let response = [];
	for (let i = 0; i < promisesToExecute.length; i += jump) {
		const promisesJump = promisesToExecute.slice(i, i + jump);
		// eslint-disable-next-line no-await-in-loop
		const partPromiseReponse = await Promise.all(promisesJump);
		response = [...response, ...partPromiseReponse];
	}
	return response;
}

function makeRandomString(numeric = false, length = 6) {
	let result = '';
	const characters = numeric ? '0123456789' : 'abcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i += 1) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function generateFormatSlug(title, skipNumbers = false) {
	const valueNormalize = `${title}`
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/(?!\w|\s)./g, '')
		.replace(/\s+/g, ' ')
		.replace(/^(\s*)([\W\w])(\b\s$)/g, '$2');
	if (!skipNumbers) {
		valueNormalize.replace(/[0-9]/g, '');
	}
	const valueFormatted = valueNormalize.replace(/ /g, '-');
	return valueFormatted.toLowerCase();
}

async function validPaymentOrderByNdc(
	ordersData,
	{
		companyId, countryId, MsTypeDocument, Sales, ModuleCode,
	},
) {
	const typeDocumentNtc = await MsTypeDocument.getById(undefined, 'NTC', {
		flagType: ModuleCode.sales,
		comCountryId: countryId,
	});

	const promiseNdc = ordersData.reduce((acum, order) => {
		const newAcum = [...acum];
		if (
			order.additionalInfo &&
			order.additionalInfo.paymentMethodNdc &&
			order.additionalInfo.paymentMethodNdc.total > 0
		) {
			const { documents } = order.additionalInfo.paymentMethodNdc;
			if (documents && documents.length > 0) {
				// si no existe no replicar y actualizar el pedido con el error de medio de pago
				// no corresponde al usuario o lo que corresponda.
				documents.forEach((k) => {
					const { serie, number } = k;
					newAcum.push(Sales.getBySerieNumberCustomerId(companyId, {
						serie,
						number,
						customerId: order.customerId,
						typeDocumentId: typeDocumentNtc.id,
					}));
				});
			}
		}
		return newAcum;
	}, []);
	if (promiseNdc && promiseNdc.length > 0) {
		return Promise.all(promiseNdc);
	}
	return false;
}

const methods = {
	validPaymentOrderByNdc,
	defaultCacheResource,
	configCompanySerie0,
	configCompanySerieA,
	configCompanySerieP,
	getLinearDistanceKm,
	roundFixedToNumber,
	isNullOrUndefined,
	isDevOrProd,
	uniqueValues,
	PromiseAll,
	sortData,
	encrypt,
	decrypt,
	roundTo,
	roundLimit,
	validObject,
	makeRandomString,
	validCurrentArray,
	removeDuplicates,
	generateFormatSlug,
	getBdProducts,
	isDataValid,
	getDeviceInfo,
};

module.exports = methods;
