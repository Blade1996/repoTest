'use strict';

require('dotenv').config();
const Podium = require('podium');
const dbConfig = require('../../config/objection');
const Sales = require('../../models/Sales');
const MovementKardex = require('../../models/MovementKardex');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('sendSaleKardex');

async function processSaleKardex({ lotRecords }) {
	try {
		const data = await Sales.getCompanyProcess({
			lotRecords,
		});
		const processRegisterPromise = [];

		if (data.length > 0) {
			data.forEach((item) => {
				processRegisterPromise.push(Sales.processRegister(item.companyId, {
					lotRecords,
				}));
			});
			const processRegisters = await Promise.all(processRegisterPromise);
			data.forEach((item, index) => {
				const itemRegisters = processRegisters[index];
				podiumObject.emit('sendSaleKardex', {
					companyId: item.companyId,
					itemsRegister: itemRegisters,
					country: { id: item.comCountryId },
				});
			});
			return data;
		}
		return data;
	} catch (error) {
		return error;
	}
}

podiumObject.on('sendSaleKardex', async (objResponse) => {
	try {
		const { companyId, itemsRegister, country } = objResponse;
		const data = await MovementKardex(
			{},
			companyId,
			country,
			MovementKardex.OUT_OPERATION,
			itemsRegister,
			undefined,
		);
		return Promise.resolve(data);
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

module.exports = processSaleKardex;
