'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PurMsTypeDocument extends baseModel {
	static get tableName() {
		return 'pur_ms_type_documents';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'companyId'],
			properties: {
				comCountriesId: {
					type: 'integer',
				},
				taxId: {
					type: 'int',
				},
				companyId: {
					type: 'integer',
				},
				code: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				...defaultProperties,
			},
		};
		return schema;
	}
}

module.exports = PurMsTypeDocument;
