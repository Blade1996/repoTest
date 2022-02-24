'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PurMsState extends baseModel {
	static get tableName() {
		return 'pur_ms_states';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'companyId'],
			properties: {
				companyId: {
					type: 'integer',
				},
				name: {
					type: 'string',
				},
				description: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static moveKardex(code) {
		return ['ING', 'NIN'].indexOf(code) > -1;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = ['id', 'name', 'code', 'description'].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
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

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
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

module.exports = PurMsState;
