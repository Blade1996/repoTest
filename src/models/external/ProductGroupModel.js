'use strict';

const SaleDocumentsDetail = require('../SaleDocumentsDetail');
const { ungrouped } = require('../enums/product-group-enum');
const { getBdProducts } = require('../../shared/helper');
const { getWhereInString } = require('./helperModel');

const tableName = 'war_products_groups';
const tableAlias = 'wpg';

function defaultColumns(otherColumns = [], alias = tableName) {
	let columns = [
		'id',
		'parent_product_id',
		'product_id',
		'price',
		'unit_id',
		'quantity',
		'company_id',
		'created_at',
		'updated_at',
	];
	columns = columns.map(c => `${alias}.${c}`).concat(otherColumns);
	return columns.reduce((a, e, i) => {
		const newA = columns.length === i + 1 ? a.concat(e) : a.concat(`${e}, `);
		return newA;
	}, '');
}

function isNormalType(record) {
	return !record.groupType || record.groupType === ungrouped;
}

async function getAllByParents(parentIds, companyId) {
	try {
		const knex = SaleDocumentsDetail.knex();
		const productsGroup = await knex.schema.raw(
			`select ${defaultColumns(
				[],
				tableAlias,
			)} from ${getBdProducts()}.${tableName} ${tableAlias} where ${tableAlias}.parent_product_id in ${getWhereInString(parentIds)} and ${tableAlias}.company_id = ? and ${tableAlias}.deleted_at is null`,
			[companyId],
		);
		return productsGroup[0];
	} catch (error) {
		return Promise.reject(error);
	}
}

async function updateKardexDataNotMixed({ kardex, companyId }) {
	const groupRecords = kardex.reduce(
		(acum, item) => (isNormalType(item) ? acum : [...acum, item]),
		[],
	);
	if (groupRecords.length === 0) {
		const response = kardex.map((item) => {
			const newItem = { ...item };
			delete newItem.groupType;
			return newItem;
		});
		return response;
	}
	const ids = groupRecords.map(i => i.productId);
	const productGroupsByParent = await getAllByParents(ids, companyId);
	const { newRecords } = kardex.reduce(
		(acum, record) => {
			const newAcum = { ...acum };
			const newRecord = { ...record };
			delete newRecord.groupType;
			if (this.isNormalType(record)) {
				newAcum.newRecords.push(newRecord);
			} else {
				newAcum.productGroups = newAcum.productGroups.reduce((acc, group) => {
					if (record.productId === group.parentProductId) {
						newAcum.newRecords.push({
							...newRecord,
							quantity: group.quantity * newRecord.quantity,
							productId: group.productId,
							price: group.price,
						});
					} else {
						acc.push(group);
					}
					return acc;
				}, []);
			}
			return newAcum;
		},
		{ newRecords: [], productGroups: productGroupsByParent },
	);
	return newRecords;
}

module.exports = { updateKardexDataNotMixed };
