'use strict';

const SaleDocumentsDetail = require('../SaleDocumentsDetail');
const { getBdProducts } = require('../../shared/helper');
const { formatColumns } = require('./helperModel');

const tableName = 'war_ms_type_documents';
const tableAlias = 'wmtd';

function defaultColumns(otherColumns = [], alias = tableName) {
	let columns = [
		'id',
		'name',
		'code',
		'description',
		'accounting_account',
		'external_code',
		'flag_avg_cost',
		'order_avg_cost',
		'flag_apply_cost_avg',
		'type_operation',
		'type_document_id',
	];
	columns = columns.map(c => `${alias}.${c}`).concat(otherColumns);
	return columns.reduce((a, e, i) => {
		const newA = columns.length === i + 1 ? a.concat(e) : a.concat(`${e}, `);
		return newA;
	}, '');
}

async function getByCode(code, companyId) {
	try {
		const knex = SaleDocumentsDetail.knex();
		const resultQuery = await knex.schema.raw(
			`select ${defaultColumns(
				[],
				tableAlias,
			)} from ${getBdProducts()}.${tableName} ${tableAlias} where ${tableAlias}.code = ? and ${tableAlias}.flag_active = 1 and ${tableAlias}.company_id = ? limit 1`,
			[code, companyId],
		);
		const registerRepeat = resultQuery[0];
		return registerRepeat.length > 0 ? formatColumns(registerRepeat[0]) : undefined;
	} catch (error) {
		return Promise.reject(error);
	}
}

async function updateTypeDocument({ flagKardexValued, companyId }) {
	try {
		const knex = SaleDocumentsDetail.knex();
		await knex.schema.raw(
			`update ${getBdProducts()}.${tableName} ${tableAlias} set ${tableAlias}.flag_apply_cost_avg = if(${flagKardexValued} = 1, 1, 0), ${tableAlias}.flag_avg_cost = if(${flagKardexValued} = 1, if(${tableAlias}.code = 'IMI' or ${tableAlias}.code = 'IM' or ${tableAlias}.code = 'SMD', 1, 0), ${tableAlias}.flag_avg_cost) where ${tableAlias}.deleted_at is null and ${tableAlias}.flag_active = 1 and ${tableAlias}.company_id = ?`,
			[companyId],
		);
		return companyId;
	} catch (error) {
		return Promise.reject(error);
	}
}

module.exports = { getByCode, updateTypeDocument };
