'use strict';

const syncPlatforms = [
	{
		id: 1,
		name: 'desktop',
		flagActive: false,
	},
	{
		id: 2,
		name: 'web',
		flagActive: true,
	},
	{
		id: 3,
		name: 'movil',
		flagActive: true,
	},
];

const servicesPath = [
	{
		method: 'post',
		path: '/sale-documents/{typeDocumentCode}/type-document',
		typeRegister: 'sales',
		exceptions: ['COT'],
	},
	{
		method: 'old-post',
		path: '/sale-documents/{typeDocumentCode}/type-document',
		typeRegister: 'old-sales',
		exceptions: ['COT'],
	},
	{
		method: 'post',
		path: '/sales-documents/{typeDocumentCode}/convert',
		typeRegister: 'sales',
	},
	{
		method: 'post',
		path: '/sale-documents/{typeDocumentCode}/type-note',
		typeRegister: 'sales',
	},
	{
		method: 'post',
		path: '/sale-documents/new-sale-documents/{saleDocumentId}',
		typeRegister: 'sales',
	},
	{
		method: 'post',
		path: '/orders',
		typeRegister: 'orders',
		conditions: {
			flagStatusOrder: 3,
		},
	},
	{
		method: 'post',
		path: '/orders-middleware',
		typeRegister: 'orders',
	},
	{
		method: 'post',
		path: '/orders/employee',
		typeRegister: 'orders',
	},
	{
		method: 'patch',
		path: '/orders/{id}',
		typeRegister: 'orders',
		conditions: {
			flagStatusOrder: 3,
		},
	},
	{
		method: 'patch',
		path: '/orders/{id}/update-state',
		typeRegister: 'orders',
		conditions: {
			flagStatusOrder: 3,
		},
	},
	{
		method: 'post',
		path: '/customers',
		typeRegister: 'customers',
	},
	{
		method: 'post',
		path: '/purchase-documents/{typeDocumentCode}/type-document',
		typeRegister: 'purchases',
	},
	{
		method: 'post',
		path: '/purchase-documents/{typeDocumentCode}/convert',
		typeRegister: 'purchases',
	},
	{
		method: 'post',
		path: '/amortizations-multiple/{salTypePaymentId}',
		typeRegister: 'transactions',
	},
];

function getStatusSync(platforms = []) {
	return platforms.reduce((a, i) => {
		const newA = { ...a };
		if (!i.flagActive) {
			newA[i.name] = 'pending';
		}
		return newA;
	}, {});
}

function getConfigProcessSync(process = {}) {
	if (process.config && process.config.length > 0) {
		const {
			config, subsidiaryAclCode, ruc, additionalInformation,
		} = process;
		const { syncPlatforms: processSyncPlatforms, integrationCode, categoryCode } =
			additionalInformation || {};
		const servicesPathAux = config.reduce((acum, item) => {
			const newAcum = [...acum];
			return newAcum.concat(item.services);
		}, []);
		return {
			servicesPath: servicesPathAux,
			syncPlatforms: processSyncPlatforms || syncPlatforms,
			subsidiaryAclCode,
			ruc,
			integrationCode: integrationCode || 'firebase_sync',
			categoryCode: categoryCode || 'APPLICATION_PERSISTENCE',
		};
	}
	return { servicesPath, syncPlatforms };
}

async function validServicesSync({
	path, method, rawPath, originPlatform, configSync, source,
}) {
	const syncData = getConfigProcessSync(configSync);
	let eurekaService = null;
	if (syncData.syncPlatforms.find(i => i.id === originPlatform && i.flagActive)) {
		eurekaService = syncData.servicesPath.find((service) => {
			if (service && service.path === path && service.method === method) {
				let response = service;
				if (service.exceptions && service.exceptions.length > 0) {
					response = service.exceptions.find(ex => rawPath.indexOf(ex) >= 0) ? null : service;
				}
				if (service.conditions) {
					const attributes = Object.keys(service.conditions);
					response =
						attributes.filter(i => source[i] === service.conditions[i]).length === attributes.length
							? service
							: null;
				}
				return response;
			}
			return null;
		});
	}
	const processSync = {
		eurekaService: !!eurekaService,
		serviceSync: eurekaService,
		statusSync: getStatusSync(syncData.syncPlatforms),
	};
	if (syncData.subsidiaryAclCode) {
		processSync.subsidiaryFilters = {
			subsidiaryCode: syncData.subsidiaryAclCode,
			categoryCode: syncData.categoryCode,
			integrationCode: syncData.integrationCode,
			ruc: syncData.ruc,
		};
	}
	return processSync;
}

module.exports = validServicesSync;
