'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComRoutesSellers extends baseModel {
	static get tableName() {
		return 'com_routes_customers';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: [],
			properties: {
				zoneId: {
					type: ['integer', 'null'],
				},
				routeId: {
					type: ['integer', 'null'],
				},
				zoneSellerId: {
					type: ['integer', 'null'],
				},
				zoneCustomerId: {
					type: ['integer', 'null'],
				},
				flagPrimary: {
					type: 'boolean',
				},
				sellersId: {
					type: ['array', 'null'],
					default: [],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		const relation = {
			zoneCustomer: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComZonesCustomers.js`,
				join: {
					from: 'com_zones_customers.id',
					to: 'com_routes_customers.zone_customer_id',
				},
			},
			zoneSeller: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComZonesCustomers.js`,
				join: {
					from: 'com_zones_customers.id',
					to: 'com_routes_customers.zone_seller_id',
				},
			},
		};
		return relation;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns() {
		return [
			'id',
			'zone_id',
			'route_id',
			'location',
			'customer_address_id',
			'sellers_id',
			'zone_seller_id',
			'zone_customer_id',
			'flag_primary',
			'company_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[zoneCustomer(selectColumns).[customer(selectColumns), customersAddress(selectColumns).[parish(selectColumns), city(selectColumns), province(selectColumns)]], zoneSeller(selectColumns).[seller(selectColumns)]]')
			.skipUndefined()
			.where('zone_id', filter.zoneId)
			.skipUndefined()
			.where('route_id', filter.routeId)
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findMultiple(zoneId, routeId, companyId) {
		return this.query()
			.select('id', 'company_id', 'customer_address_id')
			.where('company_id', companyId)
			.where('zone_id', zoneId)
			.where('route_id', routeId);
	}

	static editMultiple(data, zoneId, routeId, companyId) {
		return this.query()
			.upsertGraph(data)
			.where('route_id', routeId)
			.where('zone_id', zoneId)
			.where('company_id', companyId);
	}

	static getById(id, routeId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('route_id', routeId)
			.where('company_id', companyId)
			.findById(id);
	}

	static remove(id, customerIds, companyId) {
		return this.query()
			.patch({ flagActive: false, deletedAt: helper.localDate(new Date()) })
			.where('route_id', id)
			.skipUndefined()
			.whereIn('customer_address_id', customerIds)
			.where('company_id', companyId);
	}

	static create(data) {
		return this.query().insertGraph(data);
	}

	static getRoutesCustomer(customerAddressId, routeId, companyId) {
		return this.query()
			.where('customer_address_id', customerAddressId)
			.where('route_id', routeId)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = ComRoutesSellers;
