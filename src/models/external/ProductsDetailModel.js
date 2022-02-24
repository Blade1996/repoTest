'use strict';

const SaleDocumentsDetail = require('../SaleDocumentsDetail');
const { getBdProducts } = require('../../shared/helper');
const { getColumnsSet, getWhereInString } = require('./helperModel');

const tableName = 'war_products_details';
const tableAlias = 'wpd';

function updateProductDetail(data, ids) {
	try {
		const knex = SaleDocumentsDetail.knex();
		return knex.schema.raw(
			`update ${getBdProducts()}.${tableName} ${tableAlias} set ${getColumnsSet(
				data,
				tableAlias,
			)} from where ${tableAlias}.id in ${getWhereInString(ids)}`,
			Object.values(data),
		);
	} catch (error) {
		return Promise.reject(error);
	}
}

module.exports = { updateProductDetail };
