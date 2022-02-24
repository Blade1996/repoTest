'use strict';

const ModuleCode = require('./../models/ModuleCode');

async function afterDelete({ httpNewProducts, companyId, id }) {
	return httpNewProducts.post('/kardex/recalculate', {
		companyId,
		documentId: id,
		moduleId: ModuleCode.purchases,
	});
}

module.exports = { afterDelete };
