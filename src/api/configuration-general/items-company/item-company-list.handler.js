'use strict';

const Boom = require('boom');
const Item = require('./../../../models/Item');
const { commerce } = require('./../../../models/enums/type-item-enum');

async function handler(request, h) {
	try {
		const { query } = request;
		query.companyId = request.auth.credentials.cms_companies_id;
		query.type = commerce;
		const list = await Item.getAll(query);
		return h.paginate(list, request.query);
	} catch (error) {
		return Boom.badImplementation(null, error);
	}
}

module.exports = handler;
