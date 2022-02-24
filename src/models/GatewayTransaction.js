'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { raw, Model } = require('objection');
const moment = require('moment');

class GatewayTransaction extends baseModel {
	static get tableName() {
		return 'com_gateway_transactions';
	}

	static get relationMappings() {
		return {
			order: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_gateway_transactions.order_id',
					to: 'sal_orders.id',
				},
			},
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_gateway_transactions.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [],
			properties: {
				sessionGateway: {
					type: ['object', 'null'],
					default: {},
				},
				gatewayAuthorizationResponse: {
					type: ['object', 'null'],
					default: {},
				},
				additionalInformation: {
					type: ['object', 'null'],
					default: {},
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'code',
			'code_gateway',
			'code_category',
			'type_transaction',
			'code_app',
			'payment_states',
			'status',
			'date_transaction',
			'date_expiration',
			'module_id',
			'company_id',
			'commerce_id',
			'order_id',
			'session_gateway',
			'token_gateway',
			'type_commerce_code',
			'reference_id',
			'merchand_id',
			'amount',
			'currency',
			'transaction_id',
			'gateway_authorization_response',
			'additional_information',
			'gateway_error_code',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static listPublic(otherColumns = []) {
		const columns = [
			'code',
			'code_gateway',
			'code_category',
			'type_transaction',
			'code_app',
			'status',
			'payment_states',
			'date_transaction',
			'date_expiration',
			'order_id',
			'token_gateway',
			'reference_id',
			'amount',
			'currency',
			'transaction_id',
			'type_commerce_code',
			'gateway_authorization_response',
			'gateway_error_code',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['paymentStateName'];
	}

	get paymentStateName() {
		let name;
		switch (this.paymentStates) {
		case 1:
			name = 'Pendiente';
			break;
		case 2:
			name = 'Aprobado';
			break;
		case 3:
			name = 'Rechazado';
			break;
		case 4:
			name = 'Captura de pago';
			break;
		case 5:
			name = 'Cancelado por Usuario';
			break;
		default:
			break;
		}
		return name;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			listPublic: builder => builder.select(this.listPublic()),
		};
	}

	static getAll(filter = {}, companyId) {
		const orderTable = 'sal_orders';
		let query = this.query()
			.eager('[order(selectColumns)]')
			.select(this.defaultColumns())
			.leftJoin(raw(`${orderTable} on ${this.tableName}.order_id = ${orderTable}.id`))
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.status`, filter.status)
			.skipUndefined()
			.where(`${orderTable}.customer_id`, filter.customerId)
			.skipUndefined()
			.where(`${this.tableName}.code_gateway`, filter.codeGateway)
			.skipUndefined()
			.where(`${this.tableName}.type_transaction`, filter.typeTransaction)
			.skipUndefined()
			.where(`${this.tableName}.payment_states`, filter.paymentState)
			.skipUndefined()
			.where(`${this.tableName}.order_id`, filter.orderId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, { companyId }) {
		return this.query()
			.eager('[order(selectColumns), commerce(selectColumns)]')
			.select(this.defaultColumns())
			.where(`${this.tableName}.company_id`, companyId)
			.findById(id);
	}

	static getByMerchandId({ merchandId }) {
		return this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.merchand_id`, merchandId)
			.where(`${this.tableName}.type_transaction`, 1)
			.first();
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getByCode(code) {
		const query = this.query()
			.eager('[order(selectColumns).[orderState(selectColumns), customer(selectColumns), details(selectColumns)], commerce(selectColumns)]')
			.select(this.defaultColumns())
			.where('code', code)
			.first();
		query.modifyEager('order', (builder) => {
			builder.select('sal_orders.token_gateway');
		});
		return query;
	}

	static getAllByCustomerId(filter = {}, companyId) {
		const orderColumns = [
			'sal_orders.number',
			'sal_orders.document_number',
			'sal_orders.additional_information',
		];
		const orderTable = 'sal_orders';
		let query = this.query()
			.select(this.listPublic(orderColumns))
			.leftJoin(raw(`${orderTable} on ${this.tableName}.order_id = ${orderTable}.id`))
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${orderTable}.customer_id`, filter.customerId)
			.skipUndefined()
			.where(`${this.tableName}.code_gateway`, filter.codeGateway)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.order_id`, filter.orderId)
			.orderBy(`${this.tableName}.id`, 'desc');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllPendingByCode({ lotRecords }, code = 'placetopay') {
		const todayDate = moment().format('YYYY-MM-DD HH:mm:ss');
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[order(tokenGatewayColumns), commerce(selectColumns)]')
			.where(`${this.tableName}.status`, 1)
			.where(`${this.tableName}.code_gateway`, code)
			.where(`${this.tableName}.payment_states`, 1)
			.whereRaw(`${this.tableName}.date_transaction <= ?`, todayDate)
			.whereRaw(`${this.tableName}.date_expiration >= ?`, todayDate);
		if (lotRecords) {
			query.limit(lotRecords);
		}
		return query;
	}

	static getAllPendingByCodeAndStatus({ lotRecords }, code = 'mercadopagoMp') {
		const query = this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.status`, 2)
			.where(`${this.tableName}.type_transaction`, 1)
			.where(`${this.tableName}.code_gateway`, code)
			.where(`${this.tableName}.company_id`, 269)
			.where(`${this.tableName}.payment_states`, 2)
			.whereNotNull(`${this.tableName}.merchand_id`)
			.where(`${this.tableName}.token_gateway`, '!=', 'notification');
		if (lotRecords) {
			query.limit(lotRecords);
		}
		return query;
	}
}

module.exports = GatewayTransaction;
