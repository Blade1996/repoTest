'use strict';

const Sales = require('../Sales');
const SaleDocumentsDetail = require('../SaleDocumentsDetail');
const ProductGroupModel = require('./ProductGroupModel');
const TypeDocumentModel = require('./TypeDocumentModel');
const ProductsDetailModel = require('./ProductsDetailModel');
const { getBdProducts } = require('../../shared/helper');
const { exiMerchandise } = require('../enums/type-document-external-enum');
const { PromiseAll } = require('../../shared/helper');
const { getQueryInsert, nullableValues } = require('./helperModel');
const { IN_OPERATION, OUT_OPERATION } = require('../Kardex');

const tableName = 'war_kardex';
const tableAlias = 'wk';

async function getByDocumentId(
	{ documentId, tableName: tableNameParam, typeOperation },
	companyId,
) {
	try {
		const operation = typeOperation === IN_OPERATION ? 1 : 0;
		const knex = SaleDocumentsDetail.knex();
		const resultQuery = await knex.schema.raw(
			`select ${tableAlias}.id from ${getBdProducts()}.${tableName} ${tableAlias} where ${tableAlias}.document_id = ? and ${tableAlias}.table_name = ? and ${tableAlias}.company_id = ? and ${tableAlias}.operation = ? and ${tableAlias}.deleted_at is null order by ${tableAlias}.created_at desc limit 1`,
			[documentId, tableNameParam, companyId, operation],
		);
		const registerRepeat = resultQuery[0];
		return registerRepeat.length > 0 ? registerRepeat[0] : undefined;
	} catch (error) {
		return Promise.reject(error);
	}
}

function move(registers = []) {
	const { queryString, queryValues } = getQueryInsert(getBdProducts(), tableName, registers);
	const knex = SaleDocumentsDetail.knex();
	return knex.schema.raw(queryString, nullableValues(queryValues));
}

async function insertKardex(
	records,
	typeOperation,
	companyId,
	{
		documentTypeCode = exiMerchandise, tableNameJapi, moduleName, documentId,
	},
) {
	try {
		let movementExist = false;
		if (documentId && moduleName === 'VENTAS' && typeOperation) {
			movementExist = await getByDocumentId(
				{
					documentId,
					tableName: tableNameJapi,
					moduleName,
					typeOperation,
				},
				companyId,
			);
		}
		if (!movementExist) {
			const typeDocument = await TypeDocumentModel.getByCode(documentTypeCode, companyId);
			const promisesToExecute = [];
			const requests = records.map((currentKardex) => {
				const temp = Object.assign({}, currentKardex);
				temp.companyId = companyId;
				temp.documentTypeId = typeDocument && typeDocument.id;
				temp.orderAvgCost = typeDocument && typeDocument.orderAvgCost;
				if (typeOperation === IN_OPERATION) {
					temp.quantityIn = currentKardex.quantity;
					temp.quantityOut = 0;
					temp.operation = 1;
				}
				if (typeOperation === OUT_OPERATION) {
					temp.quantityOut = currentKardex.quantity;
					temp.quantityIn = 0;
					temp.operation = 0;
				}
				temp.total = temp.priceCost ? currentKardex.quantity * temp.priceCost : 0;
				const additional = {
					typeDocumentCode: typeDocument && typeDocument.code,
				};
				temp.dueDate =
					temp.dueDate || (temp.additionalInformation && temp.additionalInformation.dueDate);
				temp.additionalInformation = temp.additionalInformation || {};
				temp.additionalInformation = Object.assign(temp.additionalInformation, additional);
				const kardexToInsert = { ...temp };
				delete kardexToInsert.quantity;
				return kardexToInsert;
			});

			// Updating series
			const newKardex = requests.map((item) => {
				const newItem = { ...item };
				if (item.series && item.series.length > 0) {
					const newRecord = {
						reference: item.documentNumber,
						saleDocumentId: item.documentId,
						flagDispatch: true,
					};
					promisesToExecute.push(ProductsDetailModel.updateProductDetail(newRecord, item.series));
				}
				delete newItem.series;
				return newItem;
			});

			await PromiseAll(promisesToExecute, 2);

			return move(newKardex);
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

function registerKardex({ payload }) {
	return ProductGroupModel.updateKardexDataNotMixed({
		kardex: payload.kardex,
		companyId: payload.companyId,
	})
		.then(kardexData =>
			insertKardex(kardexData, payload.typeOperation, payload.companyId, {
				documentTypeCode: payload.documentTypeCode,
				tableNameJapi: payload.tableNameJapi,
				moduleName: payload.moduleName,
				documentId: payload.documentId,
			}))
		.then((records) => {
			if (records && records.length > 0 && !payload.flagCancel) {
				const dataPayload = {
					ids: [Number(payload.id.split('-')[0])],
					message: `Productos de la venta registrados correctamente en el Kardex desde apiSales. Codigo de proceso Nro ${
						payload.id
					}`,
					tableNameJapi: payload.tableNameJapi,
				};
				if (dataPayload.tableNameJapi === Sales.tableName) {
					return Sales.editSendKardexStatus(dataPayload.ids, dataPayload.message);
				}
			}
			return {};
		})
		.then(() => payload.kardex)
		.catch((err) => {
			console.log('DATA ERROR ', err);
			return err;
		});
}

module.exports = { registerKardex };
