'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');

class DisecRequirements extends baseModel {
	static get tableName() {
		return 'disec_requirements';
	}

	static get relationMappings() {
		return {
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'disec_requirements.employee_id',
					to: 'com_employee.id',
				},
			},
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'disec_requirements.customer_id',
					to: 'com_customers.id',
				},
			},
			item: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Item.js`,
				join: {
					from: 'disec_requirements.com_item_id',
					to: 'com_item.id',
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
				'typeProject',
				'employeeId',
				'customerId',
				'address',
				'phone',
				'status',
				'comItemId',
			],
			properties: {
				companyId: {
					type: 'integer',
				},
				typeProject: {
					type: 'string',
				},
				employeeId: {
					type: 'integer',
				},
				customerId: {
					type: 'integer',
				},
				address: {
					type: 'string',
				},
				phone: {
					type: 'string',
				},
				status: {
					type: 'integer',
				},
				scheduledVisit: {
					type: 'date',
				},
				description: {
					type: 'string',
				},
				comItemId: {
					type: 'integer',
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
			'type_project',
			'com_item_id',
			'scheduled_visit',
			'phone',
			'employee_id',
			'customer_id',
			'address',
			'description',
			'status',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[employee(selectColumns), customer(selectColumns), item(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[employee(selectColumns), customer(selectColumns), item(selectColumns)]')
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

module.exports = DisecRequirements;
