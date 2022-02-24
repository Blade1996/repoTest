'use strict';

require('dotenv').config();
const Podium = require('podium');
const dbConfig = require('../../config/objection');
const GatewayTransaction = require('../../models/GatewayTransaction');
const PaymentGateway = require('./../../payment-gateway/PaymentGatewayStrategy');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('getGatewayStatus');

async function processSaleKardex({ lotRecords }) {
	try {
		const data = await GatewayTransaction.getAllPendingByCode({ lotRecords });
		if (data.length === 0) {
			return data;
		}
		data.forEach((gatewayTransaction) => {
			const { order } = gatewayTransaction;
			order.codeGateway = gatewayTransaction.codeGateway;
			order.commerce = gatewayTransaction.commerce;
			order.gatewayTransactionId = gatewayTransaction.id;
			order.gatewayAdditionalInformation = gatewayTransaction.additionalInformation;
			podiumObject.emit('getGatewayStatus', order);
		});
		return data;
	} catch (error) {
		return error;
	}
}

podiumObject.on('getGatewayStatus', async (order) => {
	try {
		const paymentGatewayInstance = new PaymentGateway(order, order.codeGateway);
		const response = await paymentGatewayInstance.getStatusTransaction();
		return Promise.resolve(response);
	} catch (error) {
		return error;
	}
});

module.exports = processSaleKardex;
