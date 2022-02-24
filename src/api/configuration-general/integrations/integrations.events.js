'use strict';

const DistributionCompanies = require('./../../../process-integration/replicate-integration');

async function updateConfIntegration({ companies, data }) {
	await DistributionCompanies({ companies, data });
}

const events = {
	updateConfIntegration,
};

module.exports = events;
