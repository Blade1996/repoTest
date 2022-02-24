'use strict';

require('dotenv').config();
const conversionSaleNote = require('./processInterval');
const dbConfig = require('../../config/objection');

dbConfig.initConnection();
async function processConversion() {
	await conversionSaleNote({
		lotRecords: process.env.PROCESS_LOT_CONVERSION,
	});
}

setInterval(processConversion, process.env.PROCESS_INTERVAL_CONVERSION);
