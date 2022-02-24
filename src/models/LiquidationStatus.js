'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class LiquidationStatus extends baseModel {
	static get tableName() {
		return 'liquidation_status';
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			properties: {
				code: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				colorCode: {
					type: 'string',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'code', 'description', 'color_code'];
	}

	static getAll() {
		return this.query().select(this.defaultColumns());
	}

	static getBycode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}
}

module.exports = LiquidationStatus;
