'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class MsOrderPickState extends baseModel {
	static get tableName() {
		return 'ms_order_pick_state';
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
			required: ['name'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'code'];
	}
	static getAll() {
		return this.query().select(this.defaultColumns());
	}
}

module.exports = MsOrderPickState;
