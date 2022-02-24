'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class ComMsBank extends baseModel {
	static get tableName() {
		return 'com_ms_banks';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['code', 'name'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				countryId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns() {
		return ['id', 'name', 'code', 'description', 'country_id', 'additional_information'];
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('country_id', filter.countryId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
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

module.exports = ComMsBank;
