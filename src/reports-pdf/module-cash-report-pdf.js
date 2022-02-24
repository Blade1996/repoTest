'use strict';

const Cash = require('../models/Cash');
const ComSubsidiaries = require('../models/ComSubsidiaries');
const Transaction = require('../models/Transaction');
const CountryCode = require('../models/CountryCode');
const ComBankAccounts = require('../models/ComBankAccounts');

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
		if (query.comSubsidiaryId) {
			subsidiaryRegister = await ComSubsidiaries.getByIdSimple(query.comSubsidiaryId, companyId);
		}
		if (payload.code === 'list-cash-pdf') {
			report = await Cash.getCashPdf(companyId, query, payload.warehouseIds);
			typeInformation = 'Codigo';
		}
		if (payload.code === 'cash-movement-pdf') {
			report = await Cash.getMovementCashiers(companyId, query, payload.warehouseIds);
			saleTotal = await Transaction.getMovementCashiersTotal(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'DETALLE DEL REPORTE';
		}
		if (payload.code === 'cash-movement-details-pdf') {
			report = await Cash.getMovementCashiersDetails(companyId, query, payload.warehouseIds);
			saleTotal = await Transaction.getMovementCashiersDetailsTotal(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'DETALLE DEL REPORTE';
		}
		if (payload.code === 'movement-transaction-bank-pdf') {
			report = await ComBankAccounts.getTransactionBankPdf(companyId, query, payload.warehouseIds);
			saleTotal = await ComBankAccounts.getTransactionBankTotalPdf(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'DETALLE DEL REPORTE';
		}
		const [newTotalAmount] = saleTotal || [];
		const allRegisterPdf = {
			...newTotalAmount,
			startDate: query.startDate,
			endDate: query.endDate,
			nowDate: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
			totalGeneralFac,
			typeInformation,
		};
		const data = {
			subsidiary: subsidiaryRegister || {},
			reportData: report || [],
			allTotalAmoung: allRegisterPdf || {},
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
