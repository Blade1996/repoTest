'use strict';

const { raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class OrderCredit extends baseModel {
	static get tableName() {
		return 'com_order_credits';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['subsidiaryId', 'companyId'],
			properties: {
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				currentCredits: {
					type: ['integer', 'null'],
				},
				companyId: {
					type: 'integer',
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

	static defaultColumns(columns = []) {
		return ['id', 'subsidiary_id', 'current_credits', 'company_id'].concat(columns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', filter.companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
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

	static useOneCredit(subsidiaryId, companyId) {
		return this.query()
			.patch({ currentCredits: raw('current_credits - ??', [1]) })
			.where('company_id', companyId)
			.where('subsidiary_id', subsidiaryId);
	}

	static getBySubsidiary(subsidiaryId, companyId) {
		return this.query()
			.where('subsidiary_id', subsidiaryId)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = OrderCredit;
