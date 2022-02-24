'use strict';

const PurchaseDocumentsDetail = require('../models/PurchaseDocumentsDetail');
const ComSubsidiaries = require('../models/ComSubsidiaries');
const Supplier = require('../models/Supplier');
const WithholdingTax = require('../models/WithholdingTax');
const CountryCode = require('../models/CountryCode');
const format = require('date-fns/format');
const Boom = require('boom');

async function generateReportPdf(companyId, payload, query, company) {
	try {
		const flagEcu = !(company.country && company.country.countryCode === CountryCode.peru);
		let report = null;
		let saleTotal = null;
		let subsidiaryRegister = null;
		const totalGeneralFac = 0;
		let typeInformation = null;
		let wayToBase = null;
		if (query.comSubsidiaryId) {
			subsidiaryRegister = await ComSubsidiaries.getByIdSimple(query.comSubsidiaryId, companyId);
		}
		if (payload.code === 'purchases-details') {
			report = await PurchaseDocumentsDetail.getPurchasesPdf(
				companyId,
				query,
				payload.warehouseIds,
			);
			saleTotal = await PurchaseDocumentsDetail.getPurchasesPdfTotal(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'General';
		}
		if (payload.code === 'purchases-suppliers-totals') {
			report = await Supplier.getSupplierReportPdf(companyId, query, payload.warehouseIds);
			saleTotal = await Supplier.getSupplierReportPdfTotals(companyId, query, payload.warehouseIds);
			typeInformation = 'Agrupado (Totales)';
		}
		if (payload.code === 'purchase-retention') {
			report = await WithholdingTax.getPurchasesRetentionPdf(
				companyId,
				query,
				payload.warehouseIds,
			);
			wayToBase = await WithholdingTax.getPurchasesRetentionPdfTotals(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'Retenciones';
			if (report && report.length > 0) {
				report = report.map((item) => {
					const newItem = item;
					let data1 = {};
					let data2 = {};
					item.detailsAmout.forEach((i) => {
						const newI = i;
						const reportData1 = {};
						if (newI.nameTax === 'IVA') {
							data1 = {
								nameTaxIva: newI.nameTax,
								baseRecordeIva: newI.baseRecorded,
								amountTaxIva: newI.amountTax,
								baseExemptIva: newI.baseExempt,
								baseTaxIva: newI.baseTax,
								baseZeroIva: newI.baseZero,
								baseSubtotalIva: newI.baseSubtotal,
								baseIvaIva: newI.baseIva,
							};
						}
						if (newI.nameTax === 'RENTA') {
							data2 = {
								nameTaxRent: newI.nameTax,
								baseRecordeRent: newI.baseRecorded,
								amountTaxRent: newI.amountTax,
								baseExemptRent: newI.baseExempt,
								baseTaxRent: newI.baseTax,
								baseZeroRent: newI.baseZero,
								baseSubtotalRent: newI.baseSubtotal,
								baseIvaRent: newI.baseIva,
							};
						}
						return reportData1;
					});
					const objectData = { ...data1, ...data2 };
					newItem.detailsAmountPdf = objectData;
					return newItem;
				});
			}
		}
		const [newTotalAmount] = saleTotal || []; // Mejorar por si no viene data que se debe hacer
		const allRegisterPdf = {
			...newTotalAmount,
			startDate: query.startDate,
			endDate: query.endDate,
			nowDate: format(new Date(), 'DD-MM-YYYY HH:mm:ss'),
			totalGeneralFac,
			typeInformation,
		};
		const data = {
			subsidiary: subsidiaryRegister || {},
			reportData: report || [],
			allTotalAmoung: allRegisterPdf || {},
			wayToBaseData: wayToBase || [],
			flagEcu,
		};
		return data;
	} catch (error) {
		/* eslint-disable no-console */
		return Boom.badImplementation(error, error);
	}
}

const methods = {
	generateReportPdf,
};

module.exports = methods;
