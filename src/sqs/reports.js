'use strict';

require('dotenv').config();
const simpleAxios = require('../api/shared/simple-axios');
const AWS = require('aws-sdk');
const { isNullOrUndefined } = require('util');
const Consumer = require('sqs-consumer');
const objection = require('../config/objection');
const Sales = require('../models/Sales');
const Transaction = require('../models/Transaction');
const PurchaseDocumentsDetail = require('../models/PurchaseDocumentsDetail');
const Purchases = require('../models/Purchases');
const WithholdingTax = require('../models/WithholdingTax');
const Customer = require('../models/Customer');
const AmortizationDetails = require('../models/AmortizationDetails');
const SalOrders = require('../models/SalOrders');
const TransactionBank = require('../models/TransactionBank');
const SaleDocumentsDetails = require('../models/SaleDocumentsDetail');
const ComEmployee = require('../models/ComEmployee');

const moment = require('moment');
const { freeCourier } = require('../models/enums/type-order-enum');

objection.initConnection();

AWS.config.update({
	accessKeyId: process.env.AWS_SQS_ACCESS_KEY,
	region: process.env.AWS_REGION,
	secretAccessKey: process.env.AWS_SQS_SECRET_KEY,
});

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_S3_ACCESS_KEY,
	endpoint: process.env.AWS_S3_BASE_URL,
	secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
	region: process.env.AWS_S3_REGION,
});

function uploadFile({
	extension, filename, bucket = 'reportes-trama', fileContent,
}) {
	const parameters = {
		Bucket: process.env.AWS_S3_BUCKET,
		Key: `${bucket}/${filename}.${extension}`,
		ContentType: 'application/json',
		Body: fileContent,
		ACL: 'public-read',
	};
	const promise = new Promise((resolve, reject) => {
		s3.upload(parameters, (err, data) => {
			if (err) {
				return reject(err);
			}
			return resolve(data);
		});
	});
	return promise;
}

function generateReport({
	columns, rows, authorization, documentId, s3Key,
}) {
	const url = `${process.env.API_REPORT}/documents/${documentId}/generate`;
	const payload = {};
	if (s3Key) {
		payload.s3Key = s3Key;
	} else {
		payload.data = { columns, rows };
	}
	return simpleAxios.patch(url, payload, {
		headers: {
			authorization,
		},
	});
}

async function processReportPdf({
	data, typeCurrency, typeSymbol, commission,
}, { payload, time }) {
	try {
		let objectData = {};
		if (data.reportSale) {
			let saleData;
			let saleTotal;
			if (data.sales) {
				saleData = await Sales.getReport(
					data.companyId,
					data.query,
					data.typeDocumentId,
					data.typePaymentId,
					data.salStatesId,
					data.aclFilters,
					data.countryCode,
				);
				saleTotal = await Sales.getTotalAmount(
					data.companyId,
					data.query,
					data.typeDocumentId,
					data.typePaymentId,
					data.salStatesId,
					data.aclFilters,
				);
			} else {
				saleData = await Customer.getAllAmountPdf(data.query, data.companyId);
				saleTotal = await Customer.getAllAmountTotal(data.query, data.companyId);
			}
			const [newTotalAmount] = saleTotal;
			objectData = {
				data: saleData || [],
				totalAmount: newTotalAmount.totalSales || 0,
				typeCurrency,
				typeSymbol,
			};
			if (commission) {
				objectData = {
					...objectData,
					totalCommission: newTotalAmount.totalCommission || 0,
					startDate: moment(data.query.startDate, 'DD-MM-YYYY'),
					endDate: moment(data.query.endDate, 'DD-MM-YYYY'),
					commission,
					warehouseName: saleData[0] ? saleData[0].warehouseName : '',
					employeeName: saleData[0] ? saleData[0].employeeName : '',
				};
			}
		}
		if (data.massiveTickets) {
			const arraySales = await Sales.getByIds(data.salDocumentsId, data.query, payload.companyId);
			objectData = {
				sales: arraySales,
			};
		}
		const { Location } = await uploadFile({
			extension: 'json',
			filename: `${payload.companyId}-${time}-document-account-status`,
			fileContent: JSON.stringify(objectData),
		});
		await generateReport({
			s3Key: Location,
			documentId: payload.document.id,
			authorization: payload.authorization,
		});
		// eslint-disable-next-line no-console
		console.log('Reporte Listo', payload);
		return true;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log('PROCESS-REPORT-ERR', error);
		throw error;
	}
}

async function processReportPdfv2({ data }, { payload, time }) {
	try {
		const filter = { ...data.query };
		let bandera = false;
		let fileName = '';
		let objectData;
		if (data.accountCustomer) {
			bandera = true;
			fileName = 'list-status-account-customers-pdf';
			const customerList = await Customer.getCustomersReportPdf(filter, data.companyId);
			objectData = {
				data: customerList,
			};
		}
		if (data.collection) {
			bandera = true;
			fileName = 'list-collection-pdf';
			const amortizationList = await AmortizationDetails.getCollectionReportpdf(
				filter,
				data.companyId,
			);
			objectData = {
				data: amortizationList,
			};
		}
		const { Location } = await uploadFile({
			extension: 'json',
			filename: `${payload.companyId}-${time}-${fileName}`,
			fileContent: JSON.stringify(objectData),
		});
		await generateReport({
			s3Key: Location,
			documentId: payload.document.id,
			authorization: payload.authorization,
		});
		// eslint-disable-next-line no-console
		console.log('Reporte Listo', payload);
		return bandera;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log('PROCESS-REPORT-ERR', error);
		throw error;
	}
}

async function processReport(queryDb, { columns, payload, time }) {
	try {
		// Get data from DB
		const rows = await queryDb;
		const payloadS3 = {
			columns,
			rows: rows || [],
		};
		// Instead sending the whole json via HTTP we upload the whole result
		// to s3 as a json file
		const { Location } = await uploadFile({
			extension: 'json',
			filename: `${payload.companyId}-${time}-list-purchases-details`,
			fileContent: JSON.stringify(payloadS3),
		});
		// eslint-disable-next-line no-console
		console.log('Location', Location);
		// Send the s3 url to the report api (https://reports2.japisale.com)
		// this api will generate an excel file and upload it to the s3.
		// Check your excel in the table rep_reports_documents
		await generateReport({
			s3Key: Location,
			documentId: payload.document.id,
			authorization: payload.authorization,
		});
		// eslint-disable-next-line no-console
		console.log('Reporte Listo', payload);
		return true;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log('PROCESS-REPORT-ERR', error);
		throw error;
	}
}

function handleMessage(message, done) {
	const { type, payload } = JSON.parse(message.Body);
	let { taxName } = payload.document.params;
	taxName = taxName && !isNullOrUndefined(taxName) ? taxName : 'IGV';
	const time = new Date().getTime();
	if (type === 'list-sales') {
		const columns = [
			{
				name: 'Razón Social',
				value: 'sucursalName',
			},
			{
				name: 'Empleado Nombre',
				value: 'employeeName',
			},
			{
				name: 'Tienda',
				value: 'warehouseName',
			},
			{
				name: 'Punto de Venta',
				value: 'terminalName',
			},
			{
				name: 'Cliente Nombre',
				value: 'customerName',
			},
			{
				name: 'Cliente Doc.',
				value: 'customerDocumentNumber',
			},
			{
				name: 'Correo',
				value: 'customerEmail',
			},
			{
				name: 'Dirección',
				value: 'customerAddress',
			},
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: '#-DOC',
				value: 'documentNumber',
			},
			{
				name: 'Fecha',
				value: 'date',
			},
			{
				name: 'Hora',
				value: 'time',
			},
			{
				name: '# Doc. Relacionado',
				value: 'relatedDocumentsNumber',
			},
			{
				name: 'E. Despacho',
				value: 'dispatchStatusName',
			},
			{
				name: 'E. Pago',
				value: 'statusPaymentName',
			},
			{
				name: 'M. Pago',
				value: 'paymentName',
			},
			{
				name: 'T. Pago',
				value: 'typePaymentCodesString',
			},
			{
				name: 'Monto deuda',
				value: 'debtAmount',
			},
			{
				name: 'Descuento',
				value: 'discount',
			},
			{
				name: 'Costo de Envio',
				value: 'tip',
			},
			{
				name: 'SubTotal',
				value: 'subtotal',
			},
			{
				name: taxName,
				value: 'taxes',
			},
			{
				name: 'Total',
				value: 'amount',
			},
			{
				name: 'Moneda',
				value: 'currency',
			},
			{
				name: 'Descuento Global',
				value: 'discountGlobal',
			},
			{
				name: 'Comentarios',
				value: 'commentary',
			},
			{
				name: 'Origen',
				value: 'referenceExternal',
			},
		];
		const queryDb = Sales.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-sales-details') {
		const columns = [
			{
				name: 'Razón Social',
				value: 'sucursalName',
			},
			{
				name: 'Empleado Nombre',
				value: 'employeeName',
			},
			{
				name: 'Cliente Nombre',
				value: 'customerName',
			},
			{
				name: 'Cliente Doc.',
				value: 'customerDocumentNumber',
			},
			{
				name: '#-DOC',
				value: 'documentNumber',
			},
			{
				name: 'Fecha',
				value: 'date',
			},
			{
				name: 'Hora',
				value: 'time',
			},
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: 'E. Despacho',
				value: 'dispatchStatusName',
			},
			{
				name: 'E. Pago',
				value: 'statusPaymentName',
			},
			{
				name: 'M. Pago',
				value: 'paymentName',
			},
			{
				name: 'T. Pago',
				value: 'typePaymentCodesString',
			},
			{
				name: 'Unidad',
				value: 'unitCode',
			},
			{
				name: 'Cantidad',
				value: 'quantity',
			},
			{
				name: 'Sub. Total',
				value: 'unitPrice',
			},
			{
				name: taxName,
				value: 'taxAmount',
			},
			{
				name: 'Total',
				value: 'detailTotal',
			},
			{
				name: 'Moneda',
				value: 'currency',
			},
			{
				name: 'Codigo SKU',
				value: 'productCode',
			},
			{
				name: 'Marca',
				value: 'productBrand',
			},
			{
				name: 'Categoría',
				value: 'productCategory',
			},
			{
				name: 'Nombre',
				value: 'productName',
			},
			{
				name: 'Descripción',
				value: 'productDescription',
			},
			{
				name: 'Descuento Global',
				value: 'discountGlobal',
			},
			{
				name: 'Origen',
				value: 'referenceExternal',
			},
		];
		const queryDb = Sales.exportSalesDetails({
			params: {
				companyId: payload.companyId,
				...payload.document.params,
			},
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-purchases-details') {
		const columns = [
			{
				name: '# Doc.',
				value: 'documentNumber',
			},
			{
				name: 'Proveedor',
				value: 'supplierName',
			},
			{
				name: 'Doc. Proveedor',
				value: 'supplierDocNumber',
			},
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: 'Producto',
				value: 'productName',
			},
			{
				name: 'Cod. Producto',
				value: 'productCode',
			},
			{
				name: 'Cantidad',
				value: 'quantity',
			},
			{
				name: 'Precio',
				value: 'price',
			},
			{
				name: 'Impuesto',
				value: 'taxAmount',
			},
			{
				name: 'Total',
				value: 'detailTotal',
			},
			{
				name: 'Fecha',
				value: 'purDate',
			},
		];
		const queryDb = PurchaseDocumentsDetail.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-sales-ple-sunat') {
		const columns = [
			{
				name: 'PERIODO',
				value: 'c1',
			},
			{
				name: 'NUMERO CORRELATIVO O CODIGO UNICO DE LA OPERACIÓN',
				value: 'c2',
			},
			{
				name: 'SECUENCIA',
				value: 'c3',
			},
			{
				name: 'FECHA DE EMISIÓN DEL COMPROBANTE DE PAGO O DOCUMENTO',
				value: 'c4',
			},
			{
				name: 'FECHA DE VENCIMIENTO O FECHA DE PAGO',
				value: 'c5',
			},
			{
				name: 'TIPO DE COMPROBANTE DE PAGO O DOCUMENTO',
				value: 'c6',
			},
			{
				name: 'SERIE DE COMPROBANTE DE PAGO O DOCUMENTO',
				value: 'c7',
			},
			{
				name: 'NUMERO DE COMPROBANTE DE PAGO O DOCUMENTO',
				value: 'c8',
			},
			{
				name: 'NUMERO DE COMPROBANTE DE PAGO O DOCUMENTO-FINAL (TICKETS)',
				value: 'c9',
			},
			{
				name: 'TIPO DOC. IDENTIDAD CLIENTE',
				value: 'c10',
			},
			{
				name: 'NUMERO DOC. IDENTIDAD CLIENTE',
				value: 'c11',
			},
			{
				name: 'APELLIDOS Y NOMBRES DENOMINACION O RAZÓN SOCIAL CLIENTE',
				value: 'c12',
			},
			{
				name: 'VALOR FACTURADO DE LA EXPORTACION',
				value: 'c13',
			},
			{
				name: 'BASE IMPONIBLE DE LA OPERACIÓN GRAVADA',
				value: 'c14',
			},
			{
				name: 'DESCUENTO BASE IMPONIBLE',
				value: 'c15',
			},
			{
				name: 'IGV Y/O IPM',
				value: 'c16',
			},
			{
				name: 'DESCUENTO IGV Y/O IPM ',
				value: 'c17',
			},
			{
				name: 'IMPORTE TOTAL DE LA OPERACION EXONERADA',
				value: 'c18',
			},
			{
				name: 'IMPORTE TOTAL DE LA OPERACION INAFECTA',
				value: 'c19',
			},
			{
				name: 'ISC',
				value: 'c20',
			},
			{
				name: 'BASE IMPONIBLE DE LA OPERACION GRAVADA VENTAS ARROZ PILADO',
				value: 'c21',
			},
			{
				name: 'IMPUESTO A LAS VENTAS ARROZ PILADO',
				value: 'c22',
			},
			{
				name: 'IMPUESTO AL CONSUMO DE BOLSAS PLÁSTICAS',
				value: 'c23',
			},
			{
				name: 'OTROS TRIBUTOS Y CARGOS QUE NO FORMAN PARTE DE LA BASE IMPONIBLE',
				value: 'c24',
			},
			{
				name: 'IMPORTE TOTAL DEL COMPROBANTE DE PAGO',
				value: 'c25',
			},
			{
				name: 'MONEDA',
				value: 'c26',
			},
			{
				name: 'TIPO DE CAMBIO',
				value: 'c27',
			},
			{
				name: 'FECHA DE REF. DEL COMPROBANTE DE PAGO O DOCUMENTO  MODIFICADO',
				value: 'c28',
			},
			{
				name: 'TIPO DE REF. DEL COMPROBANTE DE PAGO O DOCUMENTO MODIFICADO',
				value: 'c29',
			},
			{
				name: 'SERIE DE REF. DEL COMPROBANTE DE PAGO O DOCUMENTO MODIFICADO',
				value: 'c30',
			},
			{
				name: 'NUMERO DE REF. DEL COMPROBANTE DE PAGO O DOCUMENTO MODIFICADO',
				value: 'c31',
			},
			{
				name: 'IDENTIFICACION DEL CONTRATO O DEL PROYECYO, CONT. INDEPENDIENTE ',
				value: 'c32',
			},
			{
				name: 'ERROR 1: INCONSISTENCIA EN EL TIPO DE CAMBIO',
				value: 'c33',
			},
			{
				name: 'INDICADOR DE COMPROBANTE DE PAGO CANCELADO CON MEDIOS DE PAGO',
				value: 'c34',
			},
			{
				name: 'ESTADO',
				value: 'c35',
			},
		];
		const queryDb = Sales.exportExcelPleSunat({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-transfer-movements') {
		const columns = [
			{
				name: '# Num',
				value: 'c1',
			},
			{
				name: 'Origen',
				value: 'c2',
			},
			{
				name: 'Tipo',
				value: 'c3',
			},
			{
				name: 'T. Pago',
				value: 'c4',
			},
			{
				name: 'Documento',
				value: 'c5',
			},
			{
				name: 'Importe',
				value: 'c6',
			},
			{
				name: 'Concepto',
				value: 'c7',
			},
		];
		const queryDb = Transaction.exportExcelTransferMovements({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-purchases') {
		const columns = [
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: '# Doc.',
				value: 'documentNumber',
			},
			{
				name: 'Doc. Proveedor',
				value: 'supplierDocNumber',
			},
			{
				name: 'Proveedor',
				value: 'supplierName',
			},
			{
				name: 'Forma de Pago',
				value: 'paymentName',
			},
			{
				name: 'F. de Compra',
				value: 'dateDocument',
			},
			{
				name: 'F. de Creación',
				value: 'createdAt',
			},
			{
				name: 'Estado',
				value: 'statusName',
			},
			{
				name: 'CTB',
				value: 'accounted',
			},
			{
				name: 'Deuda',
				value: 'debtAmount',
			},
			{
				name: 'Total',
				value: 'amount',
			},
		];
		const queryDb = Purchases.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-withholding-tax') {
		const columns = [
			{
				name: '# Ret.',
				value: 'numberOperation',
			},
			{
				name: '# N. Compra.',
				value: 'documentNumber',
			},
			{
				name: 'Fec. Compra',
				value: 'datePurchase',
			},
			{
				name: 'Monto Compra',
				value: 'quantityAmount',
			},
			{
				name: 'T. Doc',
				value: 'documentName',
			},
			{
				name: 'Proveedor',
				value: 'supplierName',
			},
			{
				name: 'Doc. Proveedor',
				value: 'suppDocumentNumber',
			},
			{
				name: 'Fec. Ret',
				value: 'dateWithholding',
			},
		];
		const data = payload.document.params;
		data.companyId = payload.companyId;
		const queryDb = WithholdingTax.exportExcel(data);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-customers') {
		const columns = [
			{
				name: 'Tipo de documento',
				value: 'documentName',
			},
			{
				name: 'Numero de documento',
				value: 'documentData',
			},
			{
				name: 'Nombre/Razon Social.',
				value: 'fullname',
			},
			{
				name: 'Direccion',
				value: 'nameAddress',
			},
			{
				name: 'Correo',
				value: 'email',
			},
			{
				name: 'Numeros Telefonicos',
				value: 'phoneNumbers',
			},
			{
				name: 'Genero',
				value: 'genderName',
			},
			{
				name: 'Cantidad De Ventas',
				value: 'salesQuantity',
			},
			{
				name: 'Monto Consumido',
				value: 'amountCustomer',
			},
			{
				name: 'Deuda',
				value: 'debtsSales',
			},
			{
				name: 'Limite Dias Credito',
				value: 'creditLimitDays',
			},
			{
				name: 'Limite Saldo Credito',
				value: 'creditLimitationBalance',
			},
			{
				name: 'Credito Disponible',
				value: 'limitAmountCredit',
			},
			{
				name: 'Fecha Creacion',
				value: 'dateCustomers',
			},
		];
		const queryDb = Customer.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'documents-group-products-xlsx') {
		const columns = [
			{
				name: 'Nombre',
				value: 'description',
			},
			{
				name: 'Codigo',
				value: 'productCode',
			},
			{
				name: 'Cantidad',
				value: 'quantity',
			},
			{
				name: 'Costo Unitario',
				value: 'pUnit',
			},
			{
				name: 'PVP Tot',
				value: 'costUnit',
			},
			{
				name: 'Total',
				value: 'total',
			},
			{
				name: 'Utilidad',
				value: 'utilidad',
			},
		];
		const query = { ...payload.document.params };
		const queryDb = SaleDocumentsDetails.getGroupProduct(
			payload.companyId,
			query,
			query.warehouseIds,
		);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'subsidiary-sale-details-xlsx') {
		const columns = [
			{
				name: 'Fecha',
				value: 'formatCreatedAt',
			},
			{
				name: 'Codigo',
				value: 'typeDocumentCode',
			},
			{
				name: 'Description',
				value: 'description',
			},
			{
				name: 'Tipo - Nro. de Documento',
				value: 'documentNumber',
			},
			{
				name: 'Cant',
				value: 'quantity',
			},
			{
				name: 'Total Cost',
				value: 'priceCost',
			},
			{
				name: 'PVP Tot',
				value: 'total',
			},
			{
				name: 'Desc',
				value: 'discount',
			},
		];
		const query = { ...payload.document.params };
		const queryDb = SaleDocumentsDetails.getReportPdfSubsidiary(
			payload.companyId,
			query,
			query.warehouseIds,
		);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'category-sale-details-xlsx') {
		const columns = [
			{
				name: 'Categoria',
				value: 'categoryName',
			},
			{
				name: 'Fecha',
				value: 'formatCreatedAt',
			},
			{
				name: 'Description',
				value: 'productCode',
			},
			{
				name: 'Tipo - Nro. de Documento',
				value: 'documentNumber',
			},
			{
				name: 'Cant',
				value: 'quantity',
			},
			{
				name: 'Total Cost',
				value: 'priceCost',
			},
			{
				name: 'PVP Tot',
				value: 'total',
			},
			{
				name: 'Desc',
				value: 'discount',
			},
		];
		const query = { ...payload.document.params };
		const queryDb = SaleDocumentsDetails.getSalesByCategoryPdf(
			payload.companyId,
			query,
			query.warehouseIds,
		);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-document-account-status-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const { typeCurrency, typeSymbol } = query;
		const objectData = {
			data: {
				companyId,
				query,
				reportSales: true,
			},
			typeCurrency,
			typeSymbol,
		};
		return processReportPdf(objectData, { payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-document-sale-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const {
			typeCurrency,
			typeSymbol,
			salStatesId,
			aclFilters,
			typeDocumentId,
			typePaymentId,
			countryCode,
		} = query;
		const data = {
			companyId,
			query,
			typeDocumentId,
			typePaymentId,
			salStatesId,
			aclFilters,
			countryCode,
			sales: true,
			reportSale: true,
		};
		return processReportPdf(
			{
				data,
				typeCurrency,
				typeSymbol,
			},
			{ payload, time },
		)
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-commission-sale-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const data = {
			companyId,
			query,
			sales: true,
			reportSale: true,
		};
		return processReportPdf(
			{
				data,
				typeCurrency: query.typeCurrency,
				typeSymbol: query.typeSymbol,
				commission: query.commission,
			},
			{ payload, time },
		)
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-status-account-customers-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const data = {
			companyId,
			query,
			accountCustomer: true,
		};

		return processReportPdfv2({ data }, { payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-collection-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const data = {
			companyId,
			query,
			collection: true,
		};

		return processReportPdfv2({ data }, { payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-order-ubigeo') {
		const columns = [
			{
				name: 'F. Compra',
				value: 'buyDate',
			},
			{
				name: 'Nombre Cliente',
				value: 'customerName',
			},
			{
				name: 'Dni',
				value: 'customerDocument',
			},
			{
				name: 'Direccion Del Asignado',
				value: 'addressCustomer',
			},
			{
				name: 'Referencia',
				value: 'customerReference',
			},
			{
				name: 'origen de pedido',
				value: 'referenceExternal',
			},
			{
				name: 'Nombre de Distrito',
				value: 'nameCity',
			},
			{
				name: 'Nombre de Ciudad',
				value: 'nameParish',
			},
			{
				name: 'Nombre de Provincia',
				value: 'nameProvince',
			},
			{
				name: 'Telefono',
				value: 'phoneCustomer',
			},
			{
				name: 'Peso(KG)',
				value: 'weight',
			},
			{
				name: 'Valor Comercial',
				value: 'commercialValue',
			},
			{
				name: 'Cantidad',
				value: 'quantity',
			},
			{
				name: 'Productos',
				value: 'products',
			},
			{
				name: 'Comercio',
				value: 'nameCommerce',
			},
			{
				name: 'Contacto',
				value: 'lastNameCommerce',
			},
			{
				name: 'Telefono de Comercio',
				value: 'phoneCommerce',
			},
			{
				name: 'Direccion Comercio',
				value: 'addressCommerce',
			},
			{
				name: 'Provincia de Comercio',
				value: 'provinceNameCommerce',
			},
			{
				name: 'Departamento de Comercio',
				value: 'cityNameCommerce',
			},
			{
				name: 'Distrito de Comercio',
				value: 'parishNameCommerce',
			},
		];
		const { params } = payload.document;
		params.orderStateId = !Array.isArray(params.orderStateId) ? params.orderStateId : undefined;
		// eslint-disable-next-line max-len
		params.orderStateIds = Array.isArray(params.orderStateId)
			? params.orderStateId
			: params.orderStateIds;
		const queryDb = SalOrders.exportExcelOrdersUbigeo({
			companyId: payload.companyId,
			...params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-transaction-bank') {
		const columns = [
			{
				name: '# Cuenta',
				value: 'accountNumber',
			},
			{
				name: 'Fecha',
				value: 'createdAt',
			},
			{
				name: 'Fecha',
				value: 'createdAt',
			},
			{
				name: 'Origen',
				value: 'moduleName',
			},
			{
				name: 'Tipo',
				value: 'typeTransactionBankCode',
			},
			{
				name: 'Tipo Transaccion',
				value: 'typeTransactionBankName',
			},
			{
				name: '# Documento',
				value: 'documentNumber',
			},
			{
				name: 'Importe',
				value: 'amount',
			},
			{
				name: 'Concepto',
				value: 'concept',
			},
		];
		const queryDb = TransactionBank.exportExcelTransactionBank({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-purchases-expiration-date') {
		const columns = [
			{
				name: 'Nro Doc',
				value: 'documentNumber',
			},
			{
				name: 'Proveedor',
				value: 'supplierName',
			},
			{
				name: 'Producto',
				value: 'description',
			},
			{
				name: 'Costo',
				value: 'price',
			},
			{
				name: 'Cantidad',
				value: 'quantity',
			},
			{
				name: 'Fecha de Expiracion',
				value: 'expirationDateTwo',
			},
		];
		const queryDb = PurchaseDocumentsDetail.exportExcelPurchasesExpirateDate({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'documents-employee-sale-xlsx') {
		const columns = [
			{
				name: 'Empleado',
				value: 'nameEmployee',
			},
			{
				name: 'Telefono',
				value: 'phone',
			},
			{
				name: 'monto Total',
				value: 'amount',
			},
			{
				name: 'Porcentaje',
				value: 'percentage',
			},
			{
				name: 'Comision Total',
				value: 'amountPercentage',
			},
		];
		const query = { ...payload.document.params };
		const queryDb = ComEmployee.getSalesEmployeePdf(payload.companyId, query, query.warehouseIds);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-sales-by-route') {
		const columns = [
			{
				name: 'Razón Social',
				value: 'sucursalName',
			},
			{
				name: 'Empleado Nombre',
				value: 'employeeName',
			},
			{
				name: 'Tienda',
				value: 'warehouseName',
			},
			{
				name: 'Punto de Venta',
				value: 'terminalName',
			},
			{
				name: 'Cliente Nombre',
				value: 'customerName',
			},
			{
				name: 'Cliente Doc.',
				value: 'customerDocumentNumber',
			},
			{
				name: 'Correo',
				value: 'customerEmail',
			},
			{
				name: 'Dirección',
				value: 'customerAddress',
			},
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: '#-DOC',
				value: 'documentNumber',
			},
			{
				name: 'Fecha',
				value: 'date',
			},
			{
				name: 'Hora',
				value: 'time',
			},
			{
				name: '# Doc. Relacionado',
				value: 'relatedDocumentsNumber',
			},
			{
				name: 'E. Despacho',
				value: 'dispatchStatusName',
			},
			{
				name: 'E. Pago',
				value: 'statusPaymentName',
			},
			{
				name: 'M. Pago',
				value: 'paymentName',
			},
			{
				name: 'T. Pago',
				value: 'typePaymentCodesString',
			},
			{
				name: 'Monto deuda',
				value: 'debtAmount',
			},
			{
				name: 'Descuento',
				value: 'discount',
			},
			{
				name: 'Costo de Envio',
				value: 'tip',
			},
			{
				name: 'SubTotal',
				value: 'subtotal',
			},
			{
				name: taxName,
				value: 'taxes',
			},
			{
				name: 'Total',
				value: 'amount',
			},
			{
				name: 'Moneda',
				value: 'currency',
			},
			{
				name: 'Comentarios',
				value: 'commentary',
			},
		];
		const queryDb = SalOrders.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'list-sales-ntc') {
		const columns = [
			{
				name: 'Razón Social',
				value: 'sucursalName',
			},
			{
				name: 'Empleado Nombre',
				value: 'employeeName',
			},
			{
				name: 'Tienda',
				value: 'warehouseName',
			},
			{
				name: 'Punto de Venta',
				value: 'terminalName',
			},
			{
				name: 'Cliente Nombre',
				value: 'customerName',
			},
			{
				name: 'Cliente Doc.',
				value: 'customerDocumentNumber',
			},
			{
				name: 'Correo',
				value: 'customerEmail',
			},
			{
				name: 'Dirección',
				value: 'customerAddress',
			},
			{
				name: 'Tip. Doc.',
				value: 'typeDocumentName',
			},
			{
				name: '#-DOC',
				value: 'documentNumber',
			},
			{
				name: 'Fecha',
				value: 'date',
			},
			{
				name: 'Hora',
				value: 'time',
			},
			{
				name: '# Doc. Relacionado',
				value: 'relatedDocumentsNumber',
			},
			{
				name: 'E. Despacho',
				value: 'dispatchStatusName',
			},
			{
				name: 'E. Pago',
				value: 'statusPaymentName',
			},
			{
				name: 'M. Pago',
				value: 'paymentName',
			},
			{
				name: 'T. Pago',
				value: 'typePaymentCodesString',
			},
			{
				name: 'Monto deuda',
				value: 'debtAmount',
			},
			{
				name: 'Descuento',
				value: 'discount',
			},
			{
				name: 'Costo de Envio',
				value: 'tip',
			},
			{
				name: 'SubTotal',
				value: 'subtotal',
			},
			{
				name: taxName,
				value: 'taxes',
			},
			{
				name: 'Total',
				value: 'amount',
			},
			{
				name: 'Moneda',
				value: 'currency',
			},
			{
				name: 'Comentarios',
				value: 'commentary',
			},
		];
		const queryDb = SalOrders.exportExcel({ ...payload.document.params });
		return processReport(queryDb, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'documents-massive-tickets-pdf') {
		const { companyId } = payload;
		const query = { ...payload.document.params };
		const data = {
			companyId,
			query,
			salDocumentsId: payload.salDocumentsId,
			massiveTickets: true,
		};
		return processReportPdf(
			{
				data,
				typeCurrency: query.typeCurrency,
				typeSymbol: query.typeSymbol,
			},
			{ payload, time },
		)
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-transaction') {
		const columns = [
			{
				name: '# Cuenta',
				value: 'accountNumber',
			},
			{
				name: 'Fecha',
				value: 'createdAt',
			},
			{
				name: 'Fecha',
				value: 'createdAt',
			},
			{
				name: 'Origen',
				value: 'moduleName',
			},
			{
				name: 'Tipo',
				value: 'typeTransactionBankCode',
			},
			{
				name: 'Tipo Transaccion',
				value: 'typeTransactionBankName',
			},
			{
				name: '# Documento',
				value: 'documentNumber',
			},
			{
				name: 'Importe',
				value: 'amount',
			},
			{
				name: 'Concepto',
				value: 'concept',
			},
			{
				name: 'comentario',
				value: 'comment',
			},
		];
		const queryDb = Transaction.exportExcelTransaction({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'sellers-soles-boxes-xlsx') {
		const columns = [
			{
				name: 'Unidad',
				value: 'unitCode',
			},
			{
				name: 'CODIGO',
				value: 'productCode',
			},
			{
				name: 'PRODUCTO X ITEM',
				value: 'description',
			},
			{
				name: 'EMPLEADO',
				value: 'name',
			},
			{
				name: 'Cantidad',
				value: 'totalQuantity',
			},
			{
				name: 'Total',
				value: 'totalPrice',
			},
		];
		const queryDb = Sales.getReportExcelSale({
			companyId: payload.companyId,
			...payload.document.params,
		});
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	} else if (type === 'list-orders-free') {
		const columns = [
			{
				name: 'Numero de Pedido',
				value: 'number',
			},
			{
				name: 'Direccion de Origen',
				value: 'originAddress',
			},
			{
				name: 'Direccion de Destino',
				value: 'destinyAddress',
			},
			{
				name: 'Contacto de Origen',
				value: 'contactOrigin',
			},
			{
				name: 'Contacto de Destino',
				value: 'contactDestiny',
			},
			{
				name: 'Costo de Envio',
				value: 'costShipping',
			},
			{
				name: 'Monto',
				value: 'total',
			},
			{
				name: 'F.Creacion',
				value: 'createdAt',
			},
			{
				name: 'F. Entrega',
				value: 'deliveryDate',
			},
			{
				name: 'Comercio',
				value: 'commerceName',
			},
			{
				name: 'Estado del Pedido',
				value: 'orderStateName',
			},
			{
				name: 'Repartidor',
				value: 'deliveryName',
			},
			{
				name: 'Total Cobrado',
				value: 'amountCollectDriver',
			},
		];
		payload.document.params.typeOrder = freeCourier;
		const queryDb = SalOrders.exportExcel({
			companyId: payload.companyId,
			...payload.document.params,
		});
		const newOrders = SalOrders.structureOrderExcel(queryDb);
		return processReport(newOrders, { columns, payload, time })
			.then(() => done())
			.catch(err => done(err));
	} else if (type === 'movement-cash-xlsx') {
		const columns = [
			{
				name: '# Num',
				value: 'transactionId',
			},
			{
				name: 'Caja',
				value: 'cashName',
			},
			{
				name: 'Origen',
				value: 'moduleName',
			},
			{
				name: 'Tipo',
				value: 'typeMovementName',
			},
			{
				name: 'T. Pago',
				value: 'typePaymentRow',
			},
			{
				name: 'Documento',
				value: 'typeDocumentName',
			},
			{
				name: 'Importe',
				value: 'amount',
			},
			{
				name: 'F. Pago',
				value: 'paymentDate',
			},
			{
				name: 'Concepto',
				value: 'concept',
			},
			{
				name: 'Comentario',
				value: 'comment',
			},
		];
		const query = { ...payload.document.params };
		const queryDb = Transaction.getListCashClosingReportExcel(payload.companyId, query);
		return processReport(queryDb, { columns, payload, time })
			.then(done())
			.catch(err => done(err));
	}
	return done();
}
const app = Consumer.create({
	queueUrl: process.env.SQS_SALES_REPORT_URL,
	handleMessage,
});

app.on('error', (err) => {
	// eslint-disable-next-line no-console
	console.log('SQS CONSUMER ERROR', err);
	throw new Error(err);
});

app.on('processing_error', (err) => {
	// eslint-disable-next-line no-console
	console.log('ERROR', err);
});

process.on('unhandledRejection', (err) => {
	// eslint-disable-next-line no-console
	console.log('ZOMG', err);
	process.exit(1);
});

app.start();
