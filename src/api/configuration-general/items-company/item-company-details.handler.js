'use strict';

const Boom = require('boom');
const Item = require('./../../../models/Item');
const { commerce } = require('./../../../models/enums/type-item-enum');
const { itemNotFound } = require('../../shared/error-codes');

async function handler(request) {
	try {
		const query = {};
		query.type = commerce;
		const data = await Item.getById(request.params.id, query);
		return data || Boom.badRequest(itemNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
