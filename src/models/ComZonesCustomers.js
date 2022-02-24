'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComZonesCustomers extends baseModel {
	static get tableName() {
		return 'com_zones_customers';
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
			required: [],
			properties: {
				zoneId: {
					type: ['integer', 'null'],
				},
				customerId: {
					type: ['integer', 'null'],
				},
				customersAddressId: {
					type: ['integer', 'null'],
				},
				sellerId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		const relation = {
			customer: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'com_zones_customers.customer_id',
					to: 'com_customers.id',
				},
			},
			zone: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComZones.js`,
				join: {
					from: 'com_zones_customers.zone_id',
					to: 'com_zones.id',
				},
			},
			seller: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				join: {
					from: 'com_zones_customers.seller_id',
					to: 'com_sellers.id',
				},
			},
			customersAddress: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/CustomersAddress.js`,
				join: {
					from: 'com_zones_customers.customers_address_id',
					to: 'com_customers_address.id',
				},
			},
		};
		return relation;
	}

	static defaultColumns() {
		return ['id', 'zone_id', 'customer_id', 'customers_address_id', 'seller_id', 'flag_active'].map(c => `${this.tableName}.${c}`);
	}

	static create(data) {
		return this.query().insertGraph(data);
	}

	static remove(id, customerIds, companyId) {
		return this.query()
			.patch({ flagActive: false, deletedAt: helper.localDate(new Date()) })
			.where('zone_id', id)
			.skipUndefined()
			.whereIn('customers_address_id', customerIds)
			.where('company_id', companyId);
	}

	static findMultiple(ids, zoneId, companyId) {
		return this.query()
			.select('id', 'company_id')
			.where('company_id', companyId)
			.where('zone_id', zoneId)
			.whereIn('id', ids);
	}

	static findById(id, zoneId, companyId) {
		return this.query()
			.select('id', 'company_id')
			.where('seller_id', id)
			.where('company_id', companyId)
			.where('zone_id', zoneId)
			.first();
	}
}

module.exports = ComZonesCustomers;
