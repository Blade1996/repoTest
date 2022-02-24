'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');

class DisecQuotations extends baseModel {
	static get tableName() {
		return 'disec_quotations';
	}

	static get relationMappings() {
		return {
			requirement: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/DisecQuotations.js`,
				join: {
					from: 'disec_quotations.requirements_id',
					to: 'disec_requirements.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [
				'companyId',
				'requirementsId',
				'estimatedHours',
				'estimatedAmount',
				'staffQuantity',
				'status',
			],
			properties: {
				companyId: {
					type: 'integer',
				},
				requirementsId: {
					type: 'string',
				},
				estimatedHours: {
					type: 'integer',
				},
				estimatedAmount: {
					type: 'integer',
				},
				staffQuantity: {
					type: 'string',
				},
				materials: {
					type: 'string',
				},
				tools: {
					type: 'integer',
				},
				observations: {
					type: 'date',
				},
				status: {
					type: 'string',
				},
				...defaultsPropiertes,
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
		let columns = [
			'id',
			'requirements_id',
			'estimatedHours',
			'estimatedAmount',
			'staffQuantity',
			'materials',
			'tools',
			'observations',
			'status',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('requirement(selectColumns)')
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('requirement(selectColumns)')
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = DisecQuotations;
