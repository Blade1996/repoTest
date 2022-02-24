'use strict';

const Boom = require('boom');
const Item = require('./../../../models/Item');
const { commerce } = require('./../../../models/enums/type-item-enum');
const { deleteItemNotAllowed } = require('../../shared/error-codes');

async function handler(request) {
	try {
		if (request.pre.integrationType.length === 0) {
			const query = {};
			query.companyId = request.auth.credentials.cms_companies_id;
			query.type = commerce;
			const data = await Item.remove(request.params.id, query);
			return data;
		}
		return Boom.badRequest(deleteItemNotAllowed);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
