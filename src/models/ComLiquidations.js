'use strict';

const { transaction, Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const SalOrders = require('./SalOrders');
const General = require('./General');
const { isNullOrUndefined } = require('../shared/helper');

class ComLiquidations extends baseModel {
	static get tableName() {
		return 'com_liquidations';
	}

	static get relationMappings() {
		return {
			liquidationStatus: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/LiquidationStatus.js`,
				join: {
					from: 'com_liquidations.liquid_status_id',
					to: 'liquidation_status.id',
				},
			},
			orders: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_liquidations.id',
					to: 'sal_orders.subsidiary_id',
				},
			},
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_liquidations.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
			delivery: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Delivery.js`,
				join: {
					from: 'com_liquidations.delivery_id',
					to: 'com_delivery.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'liquidStatusId', 'employeeId'],
			properties: {
				name: {
					type: 'string',
				},
				number: {
					type: 'string',
				},
				descriptions: {
					type: 'string',
				},
				orderIds: {
					type: ['array', 'null'],
					default: [],
				},
				commerceId: {
					type: ['integer', 'null'],
				},
				infoLiquidation: {
					type: ['object', 'null'],
				},
				deliveryId: {
					type: ['integer', 'null'],
				},
				...defaultsPropiertes,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['type'];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			`${this.tableName}.id`,
			`${this.tableName}.name`,
			`${this.tableName}.number`,
			`${this.tableName}.liquid_status_id`,
			`${this.tableName}.employee_id`,
			`${this.tableName}.delivery_id`,
			`${this.tableName}.commerce_id`,
			`${this.tableName}.description`,
			`${this.tableName}.quantity`,
			`${this.tableName}.amount`,
			`${this.tableName}.balance`,
			`${this.tableName}.info_liquidation`,
			`${this.tableName}.payment_amount`,
			`${this.tableName}.operation_date`,
			`${this.tableName}.observation`,
			`${this.tableName}.order_ids`,
		];
		return columns.concat(otherColumns);
	}

	get type() {
		let type = 'comercio';
		if (this.deliveryId) {
			type = 'repartidor';
		}
		return type;
	}

	static async createMultiple(
		dataLiquidation,
		{
			orders, liquidStatus, dateOpen, companyId, newNumber, numLiquidation,
		},
	) {
		const knex = ComLiquidations.knex();
		const result = await transaction(knex, async (trx) => {
			const liquidations = await this.query(trx).insertGraph(dataLiquidation);
			const orderUpdate = orders.map((item) => {
				const newItem = { ...item };
				const liquidationInfo = {};
				const liquidDataCommerce = liquidations.find(l => l.commerceId === item.commerceId);
				if (liquidDataCommerce) {
					newItem.liquidationIdCommerce = liquidDataCommerce.id;
					liquidationInfo.liquidationStatusCommerce = liquidStatus.id;
					liquidationInfo.dateCommerce = dateOpen;
				}
				const liquidDataDelivery = liquidations.find(l => l.deliveryId === item.deliveryId);
				if (liquidDataDelivery) {
					newItem.liquidationIdDelivery = liquidDataDelivery.id;
					liquidationInfo.liquidationStatusDelivery = liquidStatus.id;
					liquidationInfo.dateDriver = dateOpen;
				}
				newItem.liquidationInfo = Object.assign(newItem.liquidationInfo || {}, liquidationInfo);
				return newItem;
			});
			await SalOrders.editByUpsert(orderUpdate, trx);
			if (newNumber > 1) {
				await General.autoCode(numLiquidation.id, companyId, newNumber, trx);
			}
			return Promise.resolve(liquidations);
		});
		return result;
	}

	static getTotalAmount(companyId, filter = {}) {
		let query = this.query().where('company_id', companyId);
		query = this.listFilterLiquidations(query, filter);
		query
			.select(raw(`SUM(${this.tableName}.amount) AS amount, SUM(${
				this.tableName
			}.balance) AS balance, SUM(${this.tableName}.payment_amount) AS payment_amount`))
			.first();
		return query;
	}

	static listFilterLiquidations(query, filter) {
		query.join('liquidation_status as liqSt', 'liqSt.id', `${this.tableName}.liquid_status_id`);
		if (filter.type === 'delivery') {
			query.whereNotNull('delivery_id');
			if (!isNullOrUndefined(query.delivery_id)) {
				query.where('delivery_id', query.delivery_id);
			}
		} else if (filter.type === 'commerce') {
			query.whereNotNull('commerce_id');
		}
		if (filter.operationDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(operation_date, "+05:00", "+00:00")) = ?',
				filter.operationDate,
			);
		}
		if (filter.liquidStatusId) {
			query.where('liquid_status_id', filter.liquidStatusId);
		}
		if (filter.deliveryId) {
			query.where('delivery_id', filter.deliveryId);
		}
		if (filter.search) {
			const fields = ['name', 'description', 'observation', 'number'].map(i => `${this.tableName}.${i}`);
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}
		return query;
	}

	static getList(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns('liqSt.code as liquidStatus'))
			.eager('[commerce(basicColumns), delivery(basicColumns)]')
			.where(`${this.tableName}.company_id`, companyId);
		query = this.listFilterLiquidations(query, filter);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getListFiltered(companyId, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('liquidationStatus(selectColumns)')
			.where('company_id', companyId);
		if (filter.deliveryId) {
			query.where('delivery_id', companyId);
		}
		return query;
	}

	static getId(id) {
		return this.query()
			.select('id')
			.where('id', id)
			.first();
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByNumber(number) {
		return this.query()
			.select('id')
			.whereIn('number', number);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('liquidationStatus(selectColumns)')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}
}
module.exports = ComLiquidations;
