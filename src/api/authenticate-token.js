'use strict';

/* istanbul ignore next */
// const { isNullOrUndefined } = require('util');
// const Employee = require('./../models/ComEmployee');
// const Customer = require('./../models/Customer');
// const { customerReseller } = require('./../models/enums/code-type-rol-enum');
// const Token = require('./validate-token');
// const Redis = require('./redis/redis-connection');

async function authenticate(request, token) {
/* 	try {
		let isValid = false;
		const artifacts = {};
		if (token) {
			const info = await Token.parserToken(request, token);
			const currentKey = `${process.env.REDIS_DB}${info}`;
			const data = await Redis.getDataKey(currentKey);
			let credentials = {};
			if (data) {
				isValid = true;
				credentials = JSON.parse(data);
				const { authorization } = credentials;
				const company = await Token.getCompanyByAclCode(credentials.company.code_company, Redis);
				if (isNullOrUndefined(authorization)) {
					let dataEmployee = null;
					if (
						credentials.role &&
						credentials.role.typeRole &&
						credentials.role.typeRole.code === customerReseller
					) {
						const companyCode = credentials.company.code_company;
						const customer = await Customer.getByAclCode(credentials.code_user, companyCode);
						if (customer) {
							dataEmployee = await Employee.getByFlagAdmin(customer.comCompaniesId);
							dataEmployee.customer = customer;
							credentials.commerce = customer.commerce;
							dataEmployee.commerce = customer.commerce;
						}
					} else {
						dataEmployee = await Employee.getByAclUserCode(credentials.code_user);
					}

					if (!isNullOrUndefined(dataEmployee)) {
						credentials.com_subsidiaries_id = dataEmployee.comSubsidiariesId;
						credentials.sal_terminals_id = dataEmployee.salTerminalsId;
						credentials.war_warehouses_id = dataEmployee.warWarehousesId;
						credentials.id = dataEmployee.id;
						credentials.aclUserCode = credentials.code_user;
						credentials.aclUserId = credentials.id;
						credentials.employee = dataEmployee;
						const configSubsidiary =
							(dataEmployee.configFilters && dataEmployee.configFilters.subsidiaries) || {};
						if (dataEmployee.configFilters) {
							dataEmployee.configFilters.cash = { ...configSubsidiary.cash };
							delete configSubsidiary.cash;
							dataEmployee.configFilters.subsidiaries = configSubsidiary;
						}
						credentials.filters = dataEmployee.configFilters || {};
						credentials.roleConfig =
							credentials.role && credentials.role.typeRole && credentials.role.typeRole.settings;
						credentials.roleCode =
							credentials.role && credentials.role.typeRole && credentials.role.typeRole.code;
						if (dataEmployee.dataSellers) {
							credentials.dataSellers = dataEmployee.dataSellers;
						}
						if (dataEmployee.delivery) {
							credentials.delivery = dataEmployee.delivery;
						}
						credentials.cms_companies_id = company.id;
					} else {
						isValid = false;
					}
					// Eliminar luego de replicar mejora en todos los repositorios
					if (!credentials.delivery && !credentials.dataSellers) {
						credentials.employee.salPriceList = company.salPriceListDefault;
					}
					credentials.com_item_id = company.comItemId;
					credentials.employee.company = company;
					//
					credentials.authorization = `Bearer ${info}`;
					await Redis.setDataKey(currentKey, JSON.stringify(credentials));
					const { codePermission: code } = credentials;
					credentials.servicesPath = code ? await Redis.getDataKey(code) : undefined;
				}
				if (!credentials.delivery && !credentials.dataSellers) {
					credentials.employee.salPriceList = company.salPriceListDefault;
				}
				credentials.com_item_id = company.comItemId;
				credentials.cms_companies_id = company.id;
				credentials.employee.company = company;
				if (credentials.employee && credentials.employee.customer) {
					credentials.employee.customer.company = company;
				}
			}
			return { isValid, credentials, artifacts };
		}
	} catch (error) {
		/* eslint-disable no-console */
	// console.log(`Error to validate token ${error}`);
	// } */
	return {
		isValid: true,
		credentials: {
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
			role: {
				code: 'DISTRIBUIDOR',
				typeRole: {
					code: 'DISTRIBUIDOR',
				},
			},
		},
	};
}

module.exports = authenticate;
