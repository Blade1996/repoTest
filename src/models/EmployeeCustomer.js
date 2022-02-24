'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class EmployeeCustomer extends baseModel {
	static get tableName() {
		return 'com_employee_customers';
	}

	static defaultColumns() {
		return ['id', 'employee_id', 'customer_id', 'flag_active', 'created_at', 'updated_at'];
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
			required: ['employeeId', 'customerId', 'companyId'],
			properties: {
				employeeId: {
					type: ['integer', 'null'],
				},
				customerId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
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

module.exports = EmployeeCustomer;
