'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class SalTaxes extends baseModel {
	static get tableName() {
		return 'sal_taxes';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['code', 'name', 'taxPercent'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				taxPercent: {
					type: 'decimal',
				},
				description: {
					type: 'string',
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

module.exports = SalTaxes;
