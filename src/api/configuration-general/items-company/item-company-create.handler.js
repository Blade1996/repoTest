'use strict';

const Boom = require('boom');
const Item = require('./../../../models/Item');
const { commerce } = require('./../../../models/enums/type-item-enum');

async function handler(request, h) {
	try {
		const data = request.payload;
		data.companyId = request.auth.credentials.cms_companies_id;
		data.type = commerce;
		const newRecord = await Item.create(data);
		return h.response(newRecord).code(201);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
