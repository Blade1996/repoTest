'use strict';

const { transaction, Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const RouteStates = require('./enums/route-status-enum');

class ComRouteHistory extends baseModel {
	static get tableName() {
		return 'com_route_history';
	}

	static get relationMappings() {
		return {
			seller: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				join: {
					from: 'com_route_history.seller_id',
					to: 'com_sellers.id',
				},
			},
			route: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComRouters.js`,
				join: {
					from: 'com_route_history.route_id',
					to: 'com_routers.id',
				},
			},
			checkInn: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComRouteCheckIn`,
				join: {
					from: 'com_route_check_in.route_history_id',
					to: 'com_route_history.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['route_id', 'company_id'],
			properties: {
				startDate: {
					type: 'date',
				},
				status: {
					type: 'integer',
				},
				routeId: {
					type: ['integer', 'null'],
				},
				sellerId: {
					type: ['integer', 'null'],
				},
				totalCustomersAssigned: {
					type: 'integer',
				},
				totalCheckInn: {
					type: ['integer', 'null'],
					default: 0,
				},
				totalSales: {
					type: 'decimal',
					default: 0,
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
		return [
			'id',
			'route_id',
			'seller_id',
			'start_date',
			'location_initiated',
			'total_customers_assigned',
			'total_check_inn',
			'total_sales',
			'status',
			'company_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
	}

	static create(data, comRoutes) {
		const { routeStatus, routeId, companyId } = data;
		let dataNew = data;
		delete dataNew.routeStatus;
		const knex = ComRouteHistory.knex();
		return transaction(knex, () =>
			this.query()
				.insert(dataNew)
				.then((newRecord) => {
					dataNew = newRecord;
					if (routeStatus === RouteStates.pending) {
						const newData = {
							status: RouteStates.initiated,
						};
						return comRoutes.updateData(routeId, newData, companyId);
					}
					return null;
				})
				.then(() => dataNew));
	}

	static getPoint(latitude, longitude) {
		const point = `"POINT(${latitude} ${longitude})"`;
		return this.raw(`GeomFromText(${point})`);
	}

	static getRouteHistory(sellerId, startDate, companyId, routeId) {
		return this.query()
			.where('seller_id', sellerId)
			.where('start_date', startDate)
			.where('company_id', companyId)
			.where('status', RouteStates.initiated)
			.skipUndefined()
			.where('route_id', routeId)
			.first();
	}

	static validateRouteSeller(sellerId, startDate, companyId, routeId) {
		return this.query()
			.whereNot('seller_id', sellerId)
			.where('start_date', startDate)
			.where('company_id', companyId)
			.where('status', RouteStates.initiated)
			.skipUndefined()
			.where('route_id', routeId)
			.first();
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static editByRoute(routeId, data, companyId) {
		return this.query()
			.patch(data)
			.where('route_id', routeId)
			.where('company_id', companyId);
	}

	static getAll(filter = {}, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[seller(selectColumns), route(selectColumns), checkInn(selectColumns).[customerAddress(basicColumns).[customer(basicColumns)]]]')
			.skipUndefined()
			.where('seller_id', filter.sellerId)
			.where('company_id', companyId);

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.start_date, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.start_date, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}
}

module.exports = ComRouteHistory;
