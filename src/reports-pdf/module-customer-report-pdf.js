'use strict';

const ComSubsidiaries = require('../models/ComSubsidiaries');
const Customer = require('../models/Customer');
const CountryCode = require('../models/CountryCode');
const format = require('date-fns/format');
const Boom = require('boom');

async function generateReportPdf(companyId, payload, query, company) {
	try {
		const flagEcu = !(company.country && company.country.countryCode === CountryCode.peru);
		let report = null;
		let saleTotal = null;
		let subsidiaryRegister = null;
		let typeInformation = null;
		if (query.comSubsidiaryId) {
			subsidiaryRegister = await ComSubsidiaries.getByIdSimple(query.comSubsidiaryId, companyId);
		}
		if (payload.code === 'list-customer-pdf') {
			report = await Customer.getAllCustomerPdf(query, companyId);
			typeInformation = 'Groupo de Clientes';
		}
		if (payload.code === 'customer-account-statement-pdf') {
			report = await Customer.getcustomerAccountStatementPdf(
				companyId,
				query,
				payload.warehouseIds,
			);
			saleTotal = await Customer.getcustomerAccountStatementTotalPdf(
				companyId,
				query,
				payload.warehouseIds,
			);
			typeInformation = 'General';
		}
		const [newTotalAmount] = saleTotal || [];
		const allRegisterPdf = {
			...newTotalAmount,
			startDate: query.startDate,
			endDate: query.endDate,
			nowDate: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
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
