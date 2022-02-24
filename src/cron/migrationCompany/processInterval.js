'use strict';

require('dotenv').config();
const migrationCompany = require('./MigrationCompany');
const dbConfig = require('../../config/objection');

dbConfig.initConnection();

async function processMigration() {
	await migrationCompany();
}

setInterval(processMigration, process.env.PROCESS_INTERVAL_MIGRATION);
