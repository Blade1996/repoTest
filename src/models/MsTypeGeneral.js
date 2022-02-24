'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class MsTypeGeneral extends baseModel {
	static get tableName() {
		return 'ms_type_general';
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
				countryId: {
					type: ['integer', 'null'],
				},
				flagCompany: {
					type: 'string',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}

	static defaultColumns() {
		return ['id', 'name', 'code', 'country_id', 'flag_company'];
	}
}

module.exports = MsTypeGeneral;
