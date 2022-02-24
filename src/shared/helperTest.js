'use strict';

const configServer = require('./../api/server');
const { admin } = require('./../models/enums/code-type-rol-enum');

function fakeCredentials(data = {
	cms_companies_id: 101,
	id: 1,
	sal_terminals_id: 1,
	war_warehouses_id: 1,
	product: {
		priceSaleMin: 100,
	},
	com_subsidiaries_id: 1,
	filters: {
		sales: {
			subsidiaries: {
				values: [1],
				fieldName: 'com_subsidiary_id',
			},
			warehouses: {
				values: [1],
				fieldName: 'warehouse_id',
			},
		},
		subsidiaries: {},
		commerces: {
			commerces: {
				values: [],
				fieldName: 'id',
			},
			subsidiaries: {
				values: [1],
				fieldName: 'subsidiary_id',
			},
		},
	},
	app: {
		code_app: 'japiadmin',
	},
	employee: {
		id: 1,
		companyId: 101,
		warWarehousesId: 1,
		salTerminalsId: 1,
		flagAdmin: 1,
		cashId: 1,
		cash: {
			id: 1,
			name: 'CASH PRUEBA',
			flagControl: false,
			balance: {
				PEN: 123,
			},
		},
		terminal: {
			id: 1,
			code: 'LQC',
			name: 'TERMINAL PRUEBA',
		},
		company: {
			id: 101,
			comCountryId: 1,
			currency: 'PEN',
			comItemId: 1,
			flagLoyalti: true,
			country: {
				id: 1,
				countryCode: 'PER',
				configTaxes: { countryCodeISO3166: 'PE', digitCorrelativeSale: 9 },
				currency: 'PEN',
			},
			settings: {
				allowOrderStockNegative: true,
				orderMoveKardex: true,
				bankReconcilementForDay: 1,
				digitCorrelativeSale: 8,
				freeCourierSettings: {
					freeOrderPercentage: 10,
					showFlagCollectForYou: true,
					courierOrderPercentage: 10,
					deliveryOrderPercentage: 10,
					additionalCostPercentage: 0,
					showFlagImmediateDelivery: true,
				},
				flagNotGenericNtc: false,
				autoDispatch: true,
				flagTypeIntegrationGrouper: true,
				mailSender: 'iesus10@hotmail.com',
				assignEmployee: true,
				useOrderCredits: true,
				domainCatalog: 'https://maki.la',
			},
			aclCode: 'ACL.CODE',
		},
		name: 'Japi',
		lastname: 'Sale',
		subsidiary: {
			ruc: '234534953432',
			sucursalName: 'sucursal de token',
			rzSocial: 'Razon social de sucursal de token',
		},
		roleCode: admin,
		customer: {
			id: 1,
			discount: 10,
			name: 'Japi',
			lastname: 'Sale',
			email: 'japi@mail.com',
			comCompaniesId: 1,
			commerceId: 1,
		},
	},
	company: {
		country: {
			id: 1,
		},
		flagLoyalti: true,
		codeCompany: '1234',
		hash: '$erwefsdvfdwdfdvsfsdf',
		settings: {
			freeCourierSettings: {
				freeOrderPercentage: 10,
				showFlagCollectForYou: true,
				courierOrderPercentage: 10,
				deliveryOrderPercentage: 10,
				additionalCostPercentage: 0,
				showFlagImmediateDelivery: true,
				flagTransportAgency: true,
			},
		},
	},
	info_device: {
		name:
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
		clienteIp: '190.239.191.25:41053',
	},
	commerce: {
		id: 1,
		code: 'mistore',
		bankAccountsRelated: [1, 2],
		wayPaymentRelated: [1, 2],
	},
	roleCode: admin,
	role: {
		code: 'DISTRIBUIDOR',
		typeRole: {
			code: 'DISTRIBUIDOR',
		},
	},
}) {
	return data;
}

function fakeStoreCredentials(data = {
	filters: {},
	cms_companies_id: 101,
	id: 1,
	com_subsidiaries_id: 1,
	subsidiary: {
		id: 1,
		warWarehousesId: 1,
		flagAdmin: 1,
		cashId: 1,
		name: 'Japi',
		lastname: 'Sale',
	},
	company: {
		id: 101,
		comCountryId: 1,
		currency: 'PEN',
		country: {
			id: 1,
			countryCode: 'PER',
		},
		settings: {
			allowOrderStockNegative: true,
			orderMoveKardex: true,
			autoDispatch: true,
		},
		aclCode: 'ACL.CODE',
		hash: '$2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
		plans: {
			plans: {
				gratuito: {
					upselling: ['billing', 'more-products', 'domain', 'store-v2'],
					lengthPlan: 365,
				},
			},
		},
		companyId: 102,
	},
	commerce: {
		id: 1,
		code: 'mistore',
		settings: {
			hash: '$2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
			salPriceListId: 1,
		},
		tokenStore: '$2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
	},
	settings: {
		hash: '$2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
		salPriceListId: 1,
	},
	tokenStore: '$2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
	authorization: 'Bearer $2a$10$LyBxxoKJMuRL4Iq0XqvSy.pVpNm2houkPcUntZMGebX28uN5omHqe',
}) {
	return data;
}

function mockServer() {
	return configServer;
}

const methods = {
	fakeCredentials,
	fakeStoreCredentials,
	mockServer,
};

module.exports = methods;
