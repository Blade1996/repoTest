'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class CostCenter extends baseModel {
	static get tableName() {
		return 'com_cost_center';
	}

	static get relationMappings() {
		return {
			costCenter: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CostCenter.js`,
				join: {
					from: 'com_cost_center.cost_center_id',
					to: 'com_cost_center.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_cost_center.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: ['string', 'null'],
				},
				costCenterId: {
					type: ['integer', 'null'],
				},
				account: {
					type: ['string', 'null'],
				},
				level: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
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
		const columns = [
			'id',
			'name',
			'code',
			'cost_center_id',
			'account',
			'level',
			'subsidiary_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('costCenter(selectColumns)')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('cost_center_id', filter.costCenterId)
			.skipUndefined()
			.where('level', filter.level)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId, filter = {}) {
		const { subsidiaryEager = 'selectColumns' } = filter;
		return this.query()
			.eager(`[costCenter(selectColumns), subsidiary(${subsidiaryEager})]`)
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patchAndFetchById(id, data)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getBasic(id, companyId) {
		return this.query()
			.select('id', 'name', 'code')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getByOnlyId(id) {
		return this.query()
			.select(this.defaultColumns(['company_id']))
			.where('id', id)
			.first();
	}

	static validCode(code, subsidiaryId, companyId, id) {
		return this.query()
			.select('id')
			.where('code', code)
			.where('subsidiary_id', subsidiaryId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}
}

module.exports = CostCenter;
