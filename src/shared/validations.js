'use strict';

const Boom = require('boom');
const { isNullOrUndefined } = require('util');
const { superAdmin, admin, support } = require('./../models/enums/code-type-rol-enum');
const { aclUserError, userNoAccess, saleNotAllowed } = require('./../api/shared/error-codes');

function valideDevice(request) {
	const { roleConfig } = request.auth.credentials;
	const deviceValidation =
		roleConfig && roleConfig.validations && roleConfig.validations.skipDeviceValidation;
	return !!deviceValidation;
}

function validSalePermission(request, h) {
	const { roleConfig } = request.auth.credentials;
	const allowSales = roleConfig && roleConfig.validations && roleConfig.validations.allowSales;
	if (!isNullOrUndefined(allowSales) && !allowSales) {
		return Boom.badRequest(saleNotAllowed);
	}
	return h.response();
}

function isAdminRole(request, h) {
	const { roleCode } = request.auth.credentials;
	if (roleCode) {
		const isAdmin = [superAdmin, admin].find(i => i === roleCode);
		return isAdmin || h.response(false);
	}
	return h.response(false);
}

function defaultCode(id) {
	let q = 1000000012300000 + id;
	const alfabet = '4agf2hkve3prq7stu9jmnyzwx5b6d8c';
	const l = alfabet.length;
	const splitAlfabet = alfabet.split('');
	const dataResult = [];
	while (q !== 0) {
		const r = q % l;
		q = parseInt(q / l, 10);
		dataResult.push(splitAlfabet[r]);
	}
	dataResult.sort((a, b) => a - b);
	return dataResult.join('');
}

function validImplementation(error, h, errorCode = aclUserError) {
	if (error.response) {
		let { status } = error.response;
		if ([400, 401, 500, 404, 405, 403].indexOf(status) > -1) {
			status = [400, 500, 404, 405, 403].indexOf(status) > -1 ? 400 : status;
			const errorMsg = {
				statusCode: status,
				code: (error.response.data && error.response.data.code) || errorCode,
				message: (error.response.data && error.response.data.message) || errorCode,
				error: error.response.statusText || 'Bad Request',
				messageError: error.response.data ? error.response.data : {},
			};
			return h.response(errorMsg).code(status);
		}
	}
	return Boom.badImplementation(error, error);
}

function configFilterDefault(allWarehouses = [], allSubsidiaries = [], allCommerces = []) {
	const data = {
		sales: {
			warehouses: {
				values: allWarehouses,
				fieldName: 'warehouse_id',
				tableName: 'sal_documents',
			},
			subsidiaries: {
				values: allSubsidiaries,
				fieldName: 'com_subsidiary_id',
				tableName: 'sal_documents',
			},
		},
		products: {
			warehouses: {
				values: allWarehouses,
				fieldName: 'warehouse_id',
			},
		},
		transfers: {
			warehouses: {
				values: allWarehouses,
				fieldName: 'id',
				tableName: 'war_warehouses',
			},
		},
		warehouses: {
			warehouses: {
				values: allWarehouses,
				fieldName: 'id',
			},
			subsidiaries: {
				values: allSubsidiaries,
				fieldName: 'subsidiary_id',
			},
		},
		subsidiaries: {
			subsidiaries: {
				values: allSubsidiaries,
				fieldName: 'id',
			},
		},
		commerces: {
			commerces: {
				values: allCommerces,
				fieldName: 'id',
			},
			subsidiaries: {
				values: allSubsidiaries,
				fieldName: 'subsidiary_id',
			},
		},
		actions: {
			sales: {
				name: '',
				value: false,
			},
			quotation: {
				name: '',
				value: false,
			},
			orders: {
				name: '',
				value: false,
			},
			request: {
				name: '',
				value: false,
			},
		},
	};
	return data;
}

function validSupportRole(request, h) {
	const { roleCode } = request.auth.credentials;
	if (roleCode === support) {
		return h.response();
	}
	return Boom.badRequest(userNoAccess);
}

function generateBasicPassword(name, lastname, documentNumber) {
	const first = name.toUpperCase().substring(0, 1);
	const second = lastname.toUpperCase().substring(0, 1);
	return `${first}${second}${documentNumber}`;
}

const methods = {
	valideDevice,
	validImplementation,
	validSalePermission,
	isAdminRole,
	defaultCode,
	configFilterDefault,
	validSupportRole,
	generateBasicPassword,
};

module.exports = methods;
