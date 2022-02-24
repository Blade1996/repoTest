'use strict';

const Boom = require('boom');
const ComEmployee = require('../../../models/ComEmployee');
const Company = require('../../../models/Company');
const ComSubsidiaries = require('../../../models/ComSubsidiaries');
const Transaction = require('../../../models/Transaction');
const Sales = require('../../../models/Sales');
const { validFilterMaxDays } = require('../../../models/helper');

async function handler(request) {
	try {
		const { aclCode, startDate, endDate } = request.query;
		if (validFilterMaxDays(request.query)) {
			return Boom.badRequest('FILTER_RANGE_DAYS_MAX_30');
		}
		const company = await Company.getByAclCode(aclCode);
		const [
			quantityEmployee,
			quantitySubsidiary,
			quantityTransactions,
			quantityElectronicDocuments,
		] = await Promise.all([
			ComEmployee.getQuantityOfEmployee(company.companyId),
			ComSubsidiaries.getQuantityOfSubsidiaries(company.companyId),
			Transaction.getQuantityOfTransactions(company.companyId, startDate, endDate),
			Sales.getQuantityOfElectrinicDocuments(company.companyId, startDate, endDate),
		]);

		const data = {
			numEmployees: quantityEmployee.count,
			numSubsidiaries: quantitySubsidiary.count,
			numTransactions: quantityTransactions.count,
			numElectronicDocuments: quantityElectronicDocuments.count,
		};

		return data;
	} catch (error) {
		return Boom.badImplementation(null, error);
	}
}

module.exports = handler;
