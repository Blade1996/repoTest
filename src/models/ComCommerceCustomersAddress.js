'use strict';

const { raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComCommerceCustomersAddress extends baseModel {
	static get tableName() {
		return 'com_commerce_customers_address';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['customer_address_id', 'commerce_customer_id'],
			properties: {
				customerAddressId: {
					type: 'integer',
				},
				commerceCustomerId: {
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
		return ['id', 'customer_address_id', 'commerce_customer_id', 'created_at', 'distance'];
	}

	static getAll(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
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

	static async getByCustomerAddressAndCommerce(
		commerceCustomerId,
		customerAddressId,
		companyId,
		distance,
	) {
		const response = await this.query()
			.select(this.defaultColumns())
			.where('commerce_customer_id', commerceCustomerId)
			.where('customer_address_id', customerAddressId)
			.where('company_id', companyId)
			.first();
		if (response && distance) {
			await this.query()
				.patch({ distance })
				.where('commerce_customer_id', commerceCustomerId)
				.where('customer_address_id', customerAddressId)
				.where('company_id', companyId)
				.first();
			response.distance = distance;
		}
		return response;
	}

	static calculateDistanceBetweenTwoPoints(originLocation, destinationLocation) {
		return this.query()
			.select(raw(
				'( 6371 * acos(cos(radians(?)) * cos(radians(?)) * cos(radians(?) - radians(?)) + sin(radians(?)) * sin(radians(?)))) AS distance',
				destinationLocation.x,
				originLocation.x,
				originLocation.y,
				destinationLocation.y,
				destinationLocation.x,
				originLocation.x,
			))
			.first();
	}
}

module.exports = ComCommerceCustomersAddress;
