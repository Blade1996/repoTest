'use strict';

require('dotenv').config();
const billingProcessControl = require('./process');
const dbConfig = require('../../config/objection');

dbConfig.initConnection();

async function processControl() {
	await billingProcessControl({
		lotRecords: process.env.PROCESS_LOT_BILLING_CONTROL,
	});
}

setInterval(processControl, process.env.PROCESS_INTERVAL_BILLING);
