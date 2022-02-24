'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');
const { raw } = require('objection');
const Consumer = require('sqs-consumer');
const sqsTypes = require('./sqsTypes');
const objection = require('../config/objection');
const Sales = require('./../models/Sales');
const StatusTaxEcu = require('./../models/StatusTaxEcu');
const PurDocumentsAnnex = require('./../models/PurDocumentsAnnex');
const PurchaseAnnex = require('./../models/enums/purchase-annex-enum.js');
const simpleAxios = require('./../api/shared/simple-axios');
const TemplateOrderAnnex = require('./../models/TemplateOrderAnnex');
const SalOrdersAnnex = require('./../models/SalOrdersAnnex');
const TemplateSales = require('./../models/TemplateSales');
const TemplateEcu = require('./../models/TemplateEcu');

let newconst = null;

objection.initConnection();

AWS.config.update({
	accessKeyId: process.env.AWS_SQS_ACCESS_KEY,
	region: process.env.AWS_REGION,
	secretAccessKey: process.env.AWS_SQS_SECRET_KEY,
});

/* eslint-disable no-console */
function updateStatusSales(idSale, idCompany, status, messageError, authorizationDate = null) {
	return Sales.updateStatusTax(idSale, idCompany, { status, messageError, authorizationDate });
}

async function connectToSriByPurchaseAnnex(data) {
	const payload = {
		claveAcceso: data.data.additionalFields.secretCode,
	};
	return simpleAxios
		.post(`${process.env.FAC_SRI_URL}/api/v1/sri/autorizar/?environment=2`, payload)
		.then((response) => {
			console.log('CARGA INFORMACION DE COMPROBANTE DE SRI', response.data, JSON.stringify(data));
			newconst = response;
			return Promise.resolve();
		})
		.catch((error) => {
			console.log('ERROR DESCARGA COMPROBANTE DE SRI', error.response.data);
			return Promise.reject(error.response.data.msgError);
		});
}

function handleMessage(message, done) {
	const { type, payload } = JSON.parse(message.Body);
	if (type === sqsTypes.sendSri) {
		return TemplateEcu.connectToTaxesBiller(payload)
			.then(done)
			.catch(err => done(new Error(err)));
	} else if (type === sqsTypes.purchaseAnnex) {
		return connectToSriByPurchaseAnnex(payload)
			.then(done)
			.catch(err => done(new Error(err)));
	} else if (type === sqsTypes.orderAnnex) {
		return TemplateOrderAnnex.geneteStructureOrders(payload.data, payload.idCompany, type)
			.then(done)
			.catch((err) => {
				console.log('Error geneteStructureOrders', err);
				return done(new Error(err));
			});
	} else if (type === sqsTypes.sunat || type === sqsTypes.signature) {
		return TemplateSales.connectToTaxesBiller(payload, true, type)
			.then(done)
			.catch(err => done(new Error(err)));
	}
	return done();
}

const app = Consumer.create({
	queueUrl: process.env.SQS_FACT_URL,
	handleMessage,
});

app.on('error', (err) => {
	console.log('SQS CONSUMER ERROR', err);
	throw new Error(err);
});

app.on('processing_error', (err, message) => {
	const { type, payload } = JSON.parse(message.Body);
	if (type === sqsTypes.sunat || type === sqsTypes.signature) {
		TemplateSales.processingTaxesError(err, payload, type);
	} else if (type === sqsTypes.signatureSrI) {
		console.log('DOCUMENTO NO AUTORIZADO', payload.idSale, err);
		let messageError = 'Error';
		let listError = [];
		if (err && err.apierror) {
			listError = err.apierror.subErrors || [];
			messageError = listError.reduce(
				(acum, item) =>
					(item ? `${acum} ${item.object} ${item.field} ${item.rejectedValue} ${item.message}` : ''),
				'',
			);
			messageError = `${err.apierror.message} - ${messageError}`;
		}
		updateStatusSales(payload.idSale, payload.idCompany, StatusTaxEcu.validationError, messageError)
			.then(console.log)
			.catch(console.log);
	} else if (type === sqsTypes.purchaseAnnex) {
		const { annexId, id } = payload.data;
		let messageError = 'Error';
		let listError = [];
		if (err && err.apierror) {
			listError = err.apierror.subErrors || [];
			messageError = listError.reduce(
				(acum, item) =>
					(item ? `${acum} ${item.object} ${item.field} ${item.rejectedValue} ${item.message}` : ''),
				'',
			);
			messageError = `${err.apierror.message} - ${messageError}`;
		}
		const documentsRelated = {
			relatedId: id,
			detailsErrors: messageError,
		};
		const dataRaw = {
			totalProcessed: raw('total_processed+??', [1]),
			totalError: raw('total_error+??', [1]),
		};
		PurDocumentsAnnex.updateDocumentAnnex(annexId, dataRaw, payload.idCompany, documentsRelated)
			.then(console.log)
			.catch(console.log);
	} else if (type === sqsTypes.orderAnnex) {
		console.log('processing_error', type);
		const { annexId, orderIds } = payload.data;
		let messageError = 'Error';
		let listError = [];
		if (err && err.apierror) {
			listError = err.apierror.subErrors || [];
			messageError = listError.reduce(
				(acum, item) =>
					(item ? `${acum} ${item.object} ${item.field} ${item.rejectedValue} ${item.message}` : ''),
				'',
			);
			messageError = `${err.apierror.message} - ${messageError}`;
		}
		const documentsRelated = {
			orderIds,
			detailsErrors: messageError,
		};
		const dataRaw = {
			totalProcessed: raw('total_processed+??', [1]),
			totalError: raw('total_error+??', [1]),
		};
		TemplateOrderAnnex.updateDocumentAnnex(annexId, dataRaw, payload.idCompany, documentsRelated)
			.then(console.log)
			.catch(console.log);
	}
});

app.on('message_processed', (message) => {
	const { type, payload } = JSON.parse(message.Body);
	if (type === sqsTypes.sunat || type === sqsTypes.signature) {
		TemplateSales.processingTaxesSuccess(payload, type);
	} else if (type === sqsTypes.purchaseAnnex) {
		const { annexId, id } = payload.data;
		if (newconst.data.numeroComprobantes && Number(newconst.data.numeroComprobantes) > 0) {
			PurDocumentsAnnex.updateSqsPurchaseAnnex(newconst, payload.data)
				.then(console.log)
				.catch(console.log);
		} else {
			const dataRaw = {
				status: raw(`CASE WHEN total_documents-1 = total_processed THEN ${PurchaseAnnex.finalized} ELSE ${
					PurchaseAnnex.processing
				} END`),
				totalProcessed: raw('total_processed+??', [1]),
				totalError: raw('total_error+??', [1]),
			};
			const documentsRelated = {
				relatedId: id,
				detailsErrors: 'DOCUMENTO NO AUTORIZADO',
			};
			PurDocumentsAnnex.updateDocumentAnnex(annexId, dataRaw, payload.idCompany, documentsRelated)
				.then(console.log)
				.catch(console.log);
		}
	} else if (type === sqsTypes.orderAnnex) {
		console.log('message_processed', type);
		TemplateOrderAnnex.updateSqsOrderAnnex(payload.data, payload.idCompany)
			.then((responseRaw) => {
				const dataRaw = {
					...responseRaw,
				};
				return SalOrdersAnnex.query()
					.patchAndFetchById(payload.data.annexId, dataRaw)
					.where('company_id', payload.idCompany);
			})
			.then(console.log)
			.catch(console.log);
	}
});

process.on('unhandledRejection', (err) => {
	console.log('ZOMG', err);
	process.exit(1);
});

app.start();
