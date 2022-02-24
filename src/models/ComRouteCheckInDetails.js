'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComRouteCheckInDetail extends baseModel {
	static get tableName() {
		return 'com_route_check_in_details';
	}

	static get relationMappings() {
		return {
			orderDetail: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrdersDetails.js`,
				join: {
					from: 'com_route_check_in_details.order_detail_id',
					to: 'sal_orders_details.id',
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
				routeCheckInId: {
					type: ['integer', 'null'],
				},
				orderDetailId: {
					type: ['integer', 'null'],
				},
				quantity: {
					type: ['number', 'null'],
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
			'order_detail_id',
			'route_check_in_id',
			'comment',
			'company_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
	}

	static removeByRoute(orderDetailIds) {
		return this.query()
			.softDelete()
			.whereIn('order_detail_id', orderDetailIds);
	}
}

module.exports = ComRouteCheckInDetail;
