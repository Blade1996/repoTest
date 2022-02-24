'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model, raw } = require('objection');

class SalOrdersDetails extends baseModel {
	static get tableName() {
		return 'sal_orders_details';
	}

	static get relationMappings() {
		return {
			order: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'sal_orders_details.sal_order_id',
					to: 'sal_orders.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['salOrderId'],
			properties: {
				salOrderId: {
					type: 'integer',
				},
				productId: {
					type: 'integer',
				},
				productCode: {
					type: ['string', 'null'],
				},
				referenceExternalId: {
					type: ['string', 'null'],
				},
				productName: {
					type: ['string', 'null'],
				},
				productImage: {
					type: ['string', 'null'],
				},
				stock: {
					type: 'number',
				},
				discount: {
					type: ['number', 'null'],
				},
				unitPrice: {
					type: 'number',
				},
				quantity: {
					type: 'number',
				},
				taxes: {
					type: ['array', 'null'],
					default: [],
				},
				product: {
					type: ['object', 'null'],
				},
				unit: {
					type: ['object', 'null'],
				},
				price: {
					type: 'number',
				},
				subtotal: {
					type: 'number',
				},
				total: {
					type: 'number',
				},
				brandName: {
					type: ['string', 'null'],
				},
				brandId: {
					type: ['integer', 'null'],
				},
				categoryName: {
					type: ['string', 'null'],
				},
				categoryId: {
					type: ['integer', 'null'],
				},
				unitName: {
					type: ['string', 'null'],
				},
				unitId: {
					type: ['integer', 'null'],
				},
				commentary: {
					type: ['string', 'null'],
				},
				kardexId: {
					type: ['integer', 'null'],
				},
				alternateCode: {
					type: 'array',
					default: [],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				warehouseName: {
					type: ['string', 'null'],
				},
				totalRefund: {
					type: ['number', 'null'],
				},
				quantityRefund: {
					type: ['integer', 'null'],
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'sal_order_id',
			'product_id',
			'product_code',
			'product_name',
			'product_image',
			'product',
			'warehouse_id',
			'stock',
			'discount',
			'unit_price',
			'quantity',
			'taxes',
			'price',
			'subtotal',
			'total',
			'brand_name',
			'brand_id',
			'category_name',
			'category_id',
			'unit_name',
			'unit_id',
			'commentary',
			'alternate_code',
			'unit',
			'unit_quantity',
			'unit_conversion',
			'unit_code',
			'tax_amount',
			'tax',
			'subtotal_without_tax',
			'stock_quantity',
			'sale_price',
			'price_cost',
			'discount_percentage',
			'description',
			'code_taxes',
			'kardex_id',
			'additional_information',
			'warehouse_name',
			'total_refund',
			'quantity_refund',
		];
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getBySalOrderId(salOrderId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_order_id', salOrderId)
			.where('company_id', companyId);
	}

	static getByIds(salOrderId, ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_order_id', salOrderId)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getByIdsSimple(salOrderId, ids, companyId) {
		return this.query()
			.select('id', 'additional_information')
			.where('sal_order_id', salOrderId)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getByProducts(routeId, companyId) {
		return this.query()
			.select(
				'sal_orders_details.id',
				'or.number as number',
				'sal_orders_details.product_code',
				'sal_orders_details.product_name',
				'sal_orders_details.warehouse_name',
				'sal_orders_details.unit_name',
				'sal_orders_details.quantity',
				'sal_orders_details.stock',
				'sal_orders_details.total',
			)
			.join('sal_orders as or', 'or.id', `${this.tableName}.sal_order_id`)
			.where('or.route_id', routeId)
			.where('sal_orders_details.company_id', companyId);
	}

	static getByProductsTotal(routeId, companyId) {
		return this.query()
			.select(
				raw('sal_orders_details.quantity as totalQuantity'),
				raw('or.distance as totalDistance'),
				raw('sal_orders_details.total as totalAmount'),
			)
			.join('sal_orders as or', 'or.id', `${this.tableName}.sal_order_id`)
			.where('or.route_id', routeId)
			.where('sal_orders_details.company_id', companyId);
	}

	static getByForProducts(routeId, companyId) {
		return this.query()
			.select(
				'sal_orders_details.id',
				raw('GROUP_CONCAT(or.number) as number'),
				'sal_orders_details.product_code',
				'sal_orders_details.product_name',
				'sal_orders_details.warehouse_name',
				'sal_orders_details.unit_name',
				raw('sum(sal_orders_details.quantity) as quantity'),
				raw('sal_orders_details.stock as stock'),
				raw('sum(sal_orders_details.total) as total'),
			)
			.join('sal_orders as or', 'or.id', `${this.tableName}.sal_order_id`)
			.where('or.route_id', routeId)
			.where('sal_orders_details.company_id', companyId)
			.groupBy('sal_orders_details.product_id')
			.groupBy('sal_orders_details.unit_id');
	}

	static getByForProductsTotal(routeId, companyId) {
		return this.query()
			.select([
				raw('sum(sal_orders_details.quantity) as totalQuantity'),
				raw('sum(or.distance) as totalDistance'),
				raw('sum(sal_orders_details.total) as totalAmount'),
			])
			.join('sal_orders as or', 'or.id', `${this.tableName}.sal_order_id`)
			.where('or.route_id', routeId)
			.where('sal_orders_details.company_id', companyId)
			.first();
	}

	static totalAmountForRoute(routeId, companyId) {
		return this.query()
			.select([
				raw('sum(sal_orders_details.quantity) as totalQuantity'),
				raw('sum(or.distance) as totalDistance'),
				raw('sum(or.total) as totalAmount'),
			])
			.join('sal_orders as or', 'or.id', `${this.tableName}.sal_order_id`)
			.where('or.route_id', routeId)
			.where('or.company_id', companyId)
			.first();
	}
}
module.exports = SalOrdersDetails;
