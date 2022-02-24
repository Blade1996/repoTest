'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PurMsTaxes extends baseModel {
	static get tableName() {
		return 'pur_ms_taxes';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'companyId', 'taxPercent'],
			properties: {
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
				taxPercent: {
					type: 'decimal',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static getAll(filter = {}) {
		let query = this.query().select('name', 'code', 'description', 'tax_percent');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = PurMsTaxes;
