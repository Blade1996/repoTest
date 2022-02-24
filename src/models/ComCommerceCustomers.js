'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class ComCommerceCustomers extends baseModel {
	static get tableName() {
		return 'com_commerce_customers';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['commerceId', 'customerId'],
			properties: {
				commerceId: {
					type: 'integer',
				},
				customerId: {
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

	static defaultColumns() {
		return ['id', 'commerce_id', 'customer_id', 'created_at'];
	}

	static getAll(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
	}

	static create(data) {
		return this.query().insert(data);
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

	static getByCustomerAndCommerce(customerId, commerceId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('customer_id', customerId)
			.where('commerce_id', commerceId)
			.where('company_id', companyId)
			.first();
	}

	static getByCustomersAndCommerce(customerIds, commerceId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('customer_id', customerIds)
			.where('commerce_id', commerceId)
			.where('company_id', companyId);
	}
}

module.exports = ComCommerceCustomers;
