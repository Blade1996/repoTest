'use strict';

const { transaction, raw, Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComRouteHistory = require('./ComRouteHistory');
const ComRouteCheckInDetail = require('./ComRouteCheckInDetails');
const SalOrders = require('./SalOrders');
const RemissionGuide = require('./RemissionGuide');
const { registered } = require('./enums/order-pick-state-enum');
const { home } = require('./PickUp');
const { readyToDeliver } = require('./enums/type-ms-order-states');
const { notAssigned } = require('./enums/order-delivery-state-enum');

class ComRouteCheckIn extends baseModel {
	static get tableName() {
		return 'com_route_check_in';
	}

	static get relationMappings() {
		return {
			seller: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				join: {
					from: 'com_route_check_in.seller_id',
					to: 'com_sellers.id',
				},
			},
			route: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComRouters.js`,
				join: {
					from: 'com_route_check_in.route_id',
					to: 'com_routers.id',
				},
			},
			document: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_route_check_in.document_id',
					to: 'sal_orders.id',
				},
			},
			customerAddress: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CustomersAddress.js`,
				join: {
					from: 'com_route_check_in.customer_address_id',
					to: 'com_customers_address.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: [],
			properties: {
				date: {
					type: 'date',
				},
				routeId: {
					type: ['integer', 'null'],
				},
				sellerId: {
					type: ['integer', 'null'],
				},
				customerAddressId: {
					type: ['integer', 'null'],
				},
				routeHistoryId: {
					type: ['integer', 'null'],
				},
				documentId: {
					type: ['integer', 'null'],
				},
				comment: {
					type: ['string', 'null'],
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
			'customer_address_id',
			'document_id',
			'route_history_id',
			'comment',
			'date',
			'company_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
	}

	static create(data) {
		const { companyId, amount, routeHistoryId } = data;
		const dataNew = data;
		delete dataNew.amount;
		const knex = ComRouteCheckIn.knex();
		let temp = null;
		return transaction(knex, () =>
			this.query()
				.insert(dataNew)
				.then((newData) => {
					temp = newData;
					return ComRouteHistory.edit(
						routeHistoryId,
						{
							totalCheckInn: this.raw('total_check_inn+??', [1]),
							totalSales: this.raw('total_sales+??', [amount || 0]),
						},
						companyId,
					);
				})
				.then(() => temp));
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static unsubcribeOrderRoute(
		{
			routeId, orderId, amount, detailIds, flagPickUpShip, orderStateCode = readyToDeliver,
		},
		companyId,
	) {
		const knex = ComRouteCheckIn.knex();
		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('route_id', routeId)
				.where('order_id', orderId)
				.then(() =>
					ComRouteHistory.editByRoute(
						routeId,
						{
							totalCheckInn: raw('total_check_inn+??', [1]),
							totalSales: raw('total_sales+??', [amount || 0]),
						},
						companyId,
					))
				.then(() => ComRouteCheckInDetail.removeByRoute(detailIds))
				.then(() => RemissionGuide.removeByOrder(orderId, companyId))
				.then(() => {
					const dataToUpdate = {
						routeName: null,
						routeId: null,
						orderPickState: registered,
						flagGuides: false,
					};
					if (flagPickUpShip) {
						dataToUpdate.deliveryId = null;
						dataToUpdate.orderStateId = SalOrders.orderStateRaw(orderStateCode);
						dataToUpdate.flagPickUp = home;
						dataToUpdate.additionalInfo = SalOrders.deliveryStateRaw(notAssigned);
					}
					return SalOrders.editSimple(orderId, dataToUpdate, companyId);
				}));
	}

	static getAll(filter = {}, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[seller(selectColumns), route(selectColumns), document(selectColumns), customerAddress(selectColumns).[customer(selectColumns)]]')
			.skipUndefined()
			.where('route_id', filter.routeId)
			.skipUndefined()
			.where('seller_id', filter.sellerId)
			.skipUndefined()
			.where('date', filter.date)
			.where('company_id', companyId);

		const response = this.includePaginationAndSort(query, filter);
		return response;
	}

	static updateData(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static findById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}
}

module.exports = ComRouteCheckIn;
