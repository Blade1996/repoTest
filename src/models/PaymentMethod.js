'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PaymentMethod extends baseModel {
	static get tableName() {
		return 'sal_method_payments';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code'],
			properties: {
				code: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = ['id', 'name', 'code', 'description'];
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}

	static getAll() {
		return this.query().select(this.defaultColumns());
	}

	static isIn(id) {
		return this.query()
			.select('id')
			.where('id', id)
			.first();
	}
}

module.exports = PaymentMethod;
