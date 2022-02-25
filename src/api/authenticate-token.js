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
	return { isValid: false, credentials: {} };
}

module.exports = authenticate;
