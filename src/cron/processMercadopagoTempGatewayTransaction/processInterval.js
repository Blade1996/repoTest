'use strict';

require('dotenv').config();
const processGatewayTransaction = require('./podium');
const dbConfig = require('../../config/objection');

dbConfig.initConnection();

async function processPendingGatewayTransactions() {
	await processGatewayTransaction({
		lotRecords: process.env.PROCESS_LOT_GATEWAY_TRANSACTION,
	});
}

setInterval(processPendingGatewayTransactions, process.env.PROCESS_INTERVAL_GATEWAY_TRANSACTION);
