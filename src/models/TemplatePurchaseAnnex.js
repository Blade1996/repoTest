'use strict';

const sqs = require('./sqs');
const { raw } = require('objection');
const PurDocumentsAnnex = require('./PurDocumentsAnnex');
const PurchaseAnnex = require('./enums/purchase-annex-enum.js');

function facturacion(annexId, dataPurchase, authorization, companyId, type) {
	const taxesJson = { ...dataPurchase };
	taxesJson.annexId = annexId;

	const timeId = new Date().getTime();
	const id = `${taxesJson.id}-${companyId}-${type}-${timeId}`;

	const dataRaw = {
		status: PurchaseAnnex.pending,
		totalDocuments: raw('total_documents+??', [1]),
	};

	return PurDocumentsAnnex.updateSimple(annexId, dataRaw, companyId)
		.then(() => {
			taxesJson.authorization = authorization;
			sqs(
				{
					idCompany: companyId,
					data: taxesJson,
				},
				type,
				id,
				process.env.SQS_FACT_URL,
			);
		})
		.catch(error => Promise.reject(error));
}

module.exports = facturacion;
