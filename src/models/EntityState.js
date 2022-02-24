'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class EntityState extends baseModel {
	static get tableName() {
		return 'ms_entity_states';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
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
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = ['name', 'code', 'description'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('flag_active', true);
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

module.exports = EntityState;
