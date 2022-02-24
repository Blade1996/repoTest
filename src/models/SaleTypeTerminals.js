'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class SaleTypeTerminal extends baseModel {
	static get tableName() {
		return 'sal_type_terminals';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
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

	static getAll(filter = {}) {
		let query = this.query().select('name', 'description');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static create(data) {
		return this.query().insert(data);
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
module.exports = SaleTypeTerminal;
