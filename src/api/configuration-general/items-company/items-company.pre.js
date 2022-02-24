'use strict';

const Boom = require('boom');
const ComEcommerceCompany = require('./../../../models/ComEcommerceCompany');

async function validateCommerce(request) {
	try {
		const companyId = request.auth.credentials.cms_companies_id;
		const itemId = request.params.id;
		const data = await ComEcommerceCompany.getByCommerceCompanyItem(companyId, itemId);
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	validateCommerce,
};

module.exports = methods;
