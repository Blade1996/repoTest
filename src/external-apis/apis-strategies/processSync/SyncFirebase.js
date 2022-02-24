'use strict';

const format = require('date-fns/format');
const FirebaseSync = require('../../../firebaseSync');
const { isNullOrUndefined, PromiseAll } = require('../../../shared/helper');

function generateUrlRefBase(
	baseUrl = 'makidesktop/companies',
	{
		companyId, status, type, typeUrl, firebaseId, newStructure, code,
	},
) {
	if (typeUrl === 'create' || typeUrl === 'get' || typeUrl === 'delete') {
		if (newStructure) {
			const { integrationCode, ruc } = newStructure;
			let url = `companies/${companyId}/${ruc}/${integrationCode}/${type}/${status}`;
			if (code) {
				url = `${url}/${code}`;
			}
			return url;
		}
		return `${baseUrl}/${companyId}/${status}/${type}`;
	}
	if (typeUrl === 'update') {
		return `${baseUrl}/${companyId}/${status}/${type}/${firebaseId}`;
	}
	if (typeUrl === 'getFree') {
		return code;
	}
	return `${baseUrl}`;
}

function generateCode(data) {
	let code = data.id;
	if (data.creationGeneratedAt) {
		code = data.documentNumberComplete;
	} else if (data.documentNumber) {
		code = data.documentNumber;
	} else if (data.operationNumber) {
		code = data.operationNumber;
	}
	return code;
}

function registerItemSycn(data, companyId, serviceData) {
	const urlRef = generateUrlRefBase(undefined, {
		companyId,
		status: 'pending',
		type: serviceData.typeRegister,
		typeUrl: 'create',
		dateOnline: data.dateOnline,
		newStructure: serviceData.subsidiaryFilters,
		code: generateCode(data),
	});
	let newRegister = {
		...serviceData,
		createdAt: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		updatedAt: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		data,
	};
	if (newRegister.statusSync) {
		newRegister = { ...newRegister, ...newRegister.statusSync };
		delete newRegister.statusSync;
	}
	newRegister = JSON.parse(JSON.stringify(newRegister));
	return { urlRef, newRegister };
}

function setDataFirebase(urlRef, newRegister, db) {
	const ref = db.ref(urlRef);
	return ref.set(newRegister);
}

async function create(companyId, serviceData, request) {
	try {
		const { credentials } = request.auth;
		credentials.subsidiaryFilters = serviceData.subsidiaryFilters;
		const conex = new FirebaseSync();
		const db = await conex.initConnection(credentials);
		if (!isNullOrUndefined(db)) {
			let result;
			const data = request.response.source ? request.response.source : {};
			if (data.order && Array.isArray(data.order)) {
				const { promises, ids } = data.order.reduce(
					(acum, item) => {
						const newData = {
							item,
							companyId: data.companyId,
							originPlatform: data.originPlatform,
							subsidiaryId: data.subsidiaryId,
						};
						const { urlRef, newRegister } = registerItemSycn(newData, companyId, serviceData);
						acum.promises.push(setDataFirebase(urlRef, newRegister, db));
						acum.ids.push(item.id);
						return acum;
					},
					{ promises: [], ids: [] },
				);
				await PromiseAll(promises, 4);
				result = ids;
			} else {
				const { urlRef, newRegister } = registerItemSycn(data, companyId, serviceData);

				if (db.flagRest) {
					if (serviceData.subsidiaryFilters) {
						result = await conex.syncApiRestFb(db, urlRef, newRegister, 'PUT');
					} else {
						result = await conex.syncApiRestFb(db, urlRef, newRegister);
					}
				} else {
					const ref = db.ref(urlRef);
					if (serviceData.subsidiaryFilters) {
						result = await ref.set(newRegister);
					} else {
						result = await ref.push().set(newRegister);
					}
					conex.closeConnection();
				}
			}
			return result;
		}
		return null;
	} catch (error) {
		return Promise.reject(error);
	}
}

// utilizar un create
async function createMultiple(companyId, serviceData, request) {
	try {
		const { credentials } = request.auth;
		credentials.subsidiaryFilters = serviceData.subsidiaryFilters;
		const conex = new FirebaseSync();
		const db = await conex.initConnection(credentials);
		if (!isNullOrUndefined(db)) {
			const data = request.response.source ? request.response.source : {};
			const urlRef = generateUrlRefBase(undefined, {
				companyId,
				status: 'pending',
				type: serviceData.typeRegister,
				typeUrl: 'create',
				dateOnline: data.dateOnline,
				newStructure: serviceData.subsidiaryFilters,
			});
			const ref = db.ref(urlRef);
			const newRegister = JSON.parse(JSON.stringify(data));
			const result = await ref.set(newRegister);
			conex.closeConnection();
			return result;
		}
		return null;
	} catch (error) {
		return Promise.reject(error);
	}
}

// reemplazar de un nodo a otro la data
function syncByEntity(conexDb, companyId, entityCode, firebaseId) {
	const unseenUrlRef = generateUrlRefBase(undefined, {
		companyId,
		status: 'pending',
		type: entityCode,
		typeUrl: 'update',
		firebaseId,
	});
	const seenUrlRef = generateUrlRefBase(undefined, {
		companyId,
		status: 'sent',
		type: entityCode,
		typeUrl: 'update',
		firebaseId,
	});
	const unseenRef = conexDb.ref(unseenUrlRef);
	return unseenRef
		.once('value', (snaphot) => {
			const registerData = snaphot.val();
			const seenRef = conexDb.ref(seenUrlRef);
			seenRef.push().set(registerData);
		})
		.then(() => unseenRef.remove());
}

async function getByEntity(companyId, { subsidiaryFilters, typeRegister, credentials }) {
	const newCredentials = { ...credentials };
	newCredentials.subsidiaryFilters = subsidiaryFilters;
	const conex = new FirebaseSync();
	const conexDb = await conex.initConnection(newCredentials);
	const urlRef = generateUrlRefBase(undefined, {
		companyId,
		type: typeRegister,
		typeUrl: 'get',
		newStructure: subsidiaryFilters,
	});
	const dataEntity = conexDb.ref(urlRef);
	return dataEntity.once('value', (snaphot) => {
		const registerData = snaphot.val();
		return registerData;
	});
}

async function getEstructureFree({ subsidiaryFilters, credentials }) {
	const newCredentials = { ...credentials };
	newCredentials.subsidiaryFilters = subsidiaryFilters;
	const conex = new FirebaseSync();
	const conexDb = await conex.initConnection(newCredentials);
	const { employee } = credentials || {};
	const urlRef = generateUrlRefBase(undefined, {
		typeUrl: 'getFree',
		code: `${(employee && employee.company.code) || subsidiaryFilters.code}`,
	});
	if (conexDb.flagRest) {
		const { data } = await conex.syncApiRestFb(conexDb, urlRef, undefined, 'GET');
		return data;
	}
	const dataEntity = conexDb.ref(urlRef);
	return dataEntity.once('value', (snaphot) => {
		const registerData = snaphot.val();
		return registerData;
	});
}

async function getBySubsidiary(companyId, request) {
	const conex = new FirebaseSync();
	const db = await conex.initConnection(request.auth.credentials);
	if (!isNullOrUndefined(db)) {
		const subsidiariesUrlRef = generateUrlRefBase('dashboard/companies', { companyId });
		const result = await db
			.ref(`${subsidiariesUrlRef}/${companyId}`)
			.once('value')
			.then(snapshot => snapshot);
		conex.closeConnection();
		return result;
	}
	return null;
}

function formatArray(data = {}) {
	const array = Object.values(data);
	return array;
}

async function deleteKey(companyId, serviceData, request) {
	try {
		const { credentials } = request.auth;
		credentials.subsidiaryFilters = serviceData.subsidiaryFilters;
		const conex = new FirebaseSync();
		const db = await conex.initConnection(credentials);
		if (!isNullOrUndefined(db)) {
			const urlRef = generateUrlRefBase(undefined, {
				companyId,
				type: serviceData.typeRegister,
				typeUrl: 'delete',
				newStructure: serviceData.subsidiaryFilters,
			});
			await db.ref(urlRef).remove();
			conex.closeConnection();
			return 0;
		}
		return null;
	} catch (error) {
		return Promise.reject(error);
	}
}

module.exports = {
	create,
	getBySubsidiary,
	syncByEntity,
	getByEntity,
	formatArray,
	createMultiple,
	deleteKey,
	getEstructureFree,
};
