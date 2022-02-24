'use strict';

const Sales = require('./Sales');
const Purchases = require('./Purchases');
const MsTypeDocument = require('./MsTypeDocument');
const Kardex = require('./Kardex');
const simpleAxios = require('./../api/shared/simple-axios');
const { isDevOrProd } = require('../shared/helper');
const { exiMerchandise, merchandiseIntake } = require('./enums/type-document-external-enum');
const typeModule = require('./enums/type-module-enum');

const IN_OPERATION = 1;
const OUT_OPERATION = 2;

async function getDocuments({
	moduleCode, query, companyId, ids, countryId,
}) {
	let data = [];
	const querys = { ...query };
	querys.saleWithoutMovement = true;
	if (moduleCode === typeModule.sales) {
		const typeDocument = await MsTypeDocument.getById(undefined, 'COT', {
			comCountryId: countryId,
		});
		querys.ids = ids;
		querys.kardex = true;
		const notIds = typeDocument ? [typeDocument.id] : undefined;
		data = await Sales.getListFacturacion(notIds, companyId, undefined, querys);
	} else if (moduleCode === typeModule.purchases) {
		data = await Purchases.getListKardex(ids, companyId, querys);
	}
	return data;
}

async function movementKardex({
	query,
	companyId,
	country,
	typeOperation,
	ids,
	authorization,
	moduleCode,
}) {
	try {
		const { id: countryId } = country;
		const documents = await getDocuments({
			query,
			companyId,
			countryId,
			ids,
			moduleCode,
		});

		const newDocuments = JSON.parse(JSON.stringify(documents));
		let responseKardex = false;
		let kardexRecords = [];
		if (isDevOrProd()) {
			const newKardexPromise = newDocuments.map((doc) => {
				const dataDoc = { ...doc };
				dataDoc.countryId = countryId;
				dataDoc.companyId = companyId;
				dataDoc.documentTypeCode =
					query.documentTypeCode || typeOperation === IN_OPERATION
						? merchandiseIntake
						: exiMerchandise;
				dataDoc.kardexRepair = true;
				if (moduleCode === typeModule.purchases) {
					return Kardex.sendKardexPurchase(dataDoc, companyId, typeOperation);
				}
				return Kardex.sendKardexToQueue(dataDoc, typeOperation, companyId);
			});

			const dataKardex = await Promise.all(newKardexPromise);

			kardexRecords = dataKardex.reduce((acum, kardexInfo) => {
				if (kardexInfo && kardexInfo.kardex.length > 0) {
					return acum.concat(kardexInfo.kardex);
				}
				return acum;
			}, []);

			if (kardexRecords.length > 0) {
				const response = await simpleAxios({
					url: `${process.env.PRODUCTS_NEW_URL}/kardex`,
					method: 'POST',
					headers: {
						authorization,
					},
					data: {
						companyId,
						typeOperation,
						kardex: kardexRecords,
						documentTypeCode:
							query.documentTypeCode || typeOperation === IN_OPERATION
								? merchandiseIntake
								: exiMerchandise,
					},
					validateStatus: () => true,
				});
				responseKardex = response.data;
			}
			const movementKadex = {
				processedSales: newDocuments.length,
				kardexResponse: responseKardex || 'OK',
				kardexSent: kardexRecords,
			};
			return movementKadex;
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

const methods = {
	IN_OPERATION,
	OUT_OPERATION,
	movementKardex,
};

module.exports = methods;
