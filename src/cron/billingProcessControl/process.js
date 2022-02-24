'use strict';

require('dotenv').config();
const Podium = require('podium');
const dbConfig = require('../../config/objection');
const Sales = require('../../models/Sales');
const TemplateSales = require('../../models/TemplateSales');
const TemplateEcu = require('../../models/TemplateEcu');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('billingProcessControl');

async function billingProcessControl({ lotRecords }) {
	try {
		const data = await Sales.processBillingControl({ lotRecords });
		if (data.length === 0) {
			return data;
		}
		const sales = await Sales.structureSalesToBilling(data);
		sales.forEach((dataSale) => {
			const dataFound = data.find(it => it.id === dataSale.id) || {};
			switch (dataFound.comCountryId) {
			case 1:
				TemplateSales.facturacionByCron(dataSale, dataFound.companyId);
				break;
			case 2:
				// TODO Implement ecuatorian billing flow
				TemplateEcu.facturacion(dataSale, dataFound.companyId);
				break;
			default:
				// TODO Implement not-managed-error
				Sales.updateCronCounter(dataSale.id, dataSale.comCompanyId).then(it => it);
				break;
			}
		});
		return data;
	} catch (error) {
		return error;
	}
}

module.exports = billingProcessControl;
