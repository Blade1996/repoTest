'use strict';

const Boom = require('boom');
const Item = require('./../../../models/Item');
const { commerce } = require('./../../../models/enums/type-item-enum');

async function handler(request) {
	try {
		const query = {};
		query.companyId = request.auth.credentials.cms_companies_id;
		query.type = commerce;
		const data = await Item.edit(request.params.id, request.payload, query);
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
