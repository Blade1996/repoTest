'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class PurTypeExpense extends baseModel {
	static get tableName() {
		return 'pur_type_expenses';
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
				description: {
					type: 'text',
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

	static defaultColumns(otherColumns = []) {
		let columns = ['id', 'name', 'code', 'description'].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static getByCode(code, companyId, id = undefined) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('company_id', companyId)
			.skipUndefined()
			.whereNot('id', id)
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

	static isIn(id, companyId) {
		return this.query()
			.select('id', 'company_id')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = PurTypeExpense;
