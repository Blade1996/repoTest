'use strict';

const ProcessTypeIntegration = require('../../../models/ProcessTypeIntegration');

async function getConfigSync({ companyId, subsidiaryId }) {
	if (companyId && subsidiaryId) {
		return ProcessTypeIntegration.getConfigSync({ companyId, subsidiaryId });
	}
	return null;
}

function getConfigSyncKey({ companyId, subsidiaryId }) {
	return `${companyId}:${subsidiaryId}`;
}

const methods = {
	getConfigSync,
	getConfigSyncKey,
};

module.exports = methods;
