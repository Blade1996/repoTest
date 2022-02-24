/* eslint-disable no-shadow */
/* eslint-disable no-restricted-syntax */

'use strict';

const baseModel = require('./base');
const moment = require('moment');
const { Model, raw, transaction } = require('objection');
const simpleAxios = require('./../api/shared/simple-axios');
const { peru } = require('./CountryCode');
const helper = require('./helper');
const { addDays, isSameMonth } = require('date-fns');
const { isDevOrProd, roundFixedToNumber } = require('../shared/helper');
const Series = require('./SalSeries');
const OrderCredit = require('./OrderCredit');
const { store, home } = require('./PickUp');
const CustomersAddress = require('./CustomersAddress');
const MsDevice = require('./MsDevice');
const OriginPlatform = require('./enums/origin-platform-enum');
const NotificationOrigin = require('./enums/notification-origin-identifier-enum');
const TypeOriginOrder = require('./enums/type_origin_order-enum');
const {
	sendPushNotification,
} = require('./../api/integration-api-external/notifications/notifications');
const { bankDep } = require('./enums/way-payment-codes-enum');
const MsOrderStates = require('./enums/type-ms-order-states');
const { delivery, courier, freeCourier } = require('./enums/type-order-enum');
const { isNullOrUndefined, isArray } = require('util');
const {
	pending, partial, payOut, pendingRefund, refund,
} = require('./PaymentState');

const {
	registered,
	attended,
	readyToPickUp,
	inProgress,
} = require('./enums/order-pick-state-enum');
const ComCommerceCustomersAddress = require('./ComCommerceCustomersAddress');
const { given } = require('./enums/type-ms-order-states');
const { localDate } = require('./helper');
const liquidStatus = require('../models/enums/liquid-status-enum');

class SalOrders extends baseModel {
	static get tableName() {
		return 'sal_orders';
	}

	static get relationMappings() {
		return {
			orderState: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/OrderStates.js`,
				join: {
					from: 'sal_orders.order_state_id',
					to: 'com_orders_states.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_orders.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			customer: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'sal_orders.customer_id',
					to: 'com_customers.id',
				},
			},
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrdersDetails.js`,
				join: {
					from: 'sal_orders.id',
					to: 'sal_orders_details.sal_order_id',
				},
			},
			customerAddress: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/CustomersAddress.js`,
				join: {
					from: 'sal_orders.customer_address_id',
					to: 'com_customers_address.id',
				},
			},
			customerBill: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'sal_orders.customer_bill_id',
					to: 'com_customers.id',
				},
			},
			bankAccount: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComBankAccounts.js`,
				join: {
					from: 'sal_orders.bank_account_id',
					to: 'com_companies_bank_accounts.id',
				},
			},
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'sal_orders.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
			wayPayment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsWayPayment.js`,
				join: {
					from: 'sal_orders.way_payment_id',
					to: 'ms_way_payment.id',
				},
			},
			orderPickStateData: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsOrderPickState.js`,
				join: {
					from: 'sal_orders.order_pick_state',
					to: 'ms_order_pick_state.id',
				},
			},
			route: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComRouters.js`,
				join: {
					from: 'sal_orders.route_id',
					to: 'com_routers.id',
				},
			},
			saleDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_orders.id',
					to: 'sal_documents.order_id',
				},
			},
			commerceCustomer: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/ComCommerceCustomers.js`,
				join: {
					from: 'sal_orders.customer_id',
					to: 'com_commerce_customers.customer_id',
				},
			},
			gatewayTransaction: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/GatewayTransaction.js`,
				join: {
					from: 'sal_orders.id',
					to: 'com_gateway_transactions.order_id',
				},
			},
			delivery: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Delivery.js`,
				join: {
					from: 'sal_orders.delivery_id',
					to: 'com_delivery.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_orders.employee_id',
					to: 'com_employee.id',
				},
			},
			remissionGuides: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/RemissionGuide.js`,
				join: {
					from: 'sal_orders.id',
					to: 'sal_remission_guides.order_id',
				},
			},
			routePickUp: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComRouters.js`,
				join: {
					from: 'sal_orders.route_id_pick_up',
					to: 'com_routers.id',
				},
			},
			transportAgency: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComTransportAgency.js`,
				join: {
					from: 'sal_orders.transport_agency_id',
					to: 'com_transport_agency.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['orderStateId', 'customerId'],
			properties: {
				number: {
					type: 'integer',
				},
				flagKardex: {
					type: ['integer', 'null'],
				},
				flagSale: {
					type: ['integer', 'null', 'boolean'],
				},
				orderStateId: {
					type: 'integer',
				},
				subsidiaryId: {
					type: 'integer',
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				warehouseName: {
					type: ['string', 'null'],
				},
				warehouseAddresss: {
					type: ['string', 'null'],
				},
				customerId: {
					type: 'integer',
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				deliveryAddress: {
					type: ['object', 'null'],
				},
				deliveryDate: {
					type: 'date',
					default: localDate({}, 'YYYY-MM-DD HH:mm:ss'),
				},
				deliveryPrice: {
					type: ['number', 'null'],
				},
				paymentStateId: {
					type: 'integer',
				},
				comments: {
					type: ['string', 'null'],
				},
				additionalInfo: {
					type: ['object', 'null'],
					default: {},
				},
				subtotal: {
					type: 'number',
				},
				total: {
					type: 'number',
				},
				flagPickUp: {
					type: 'integer',
				},
				customerAddressId: {
					type: ['integer', 'null'],
				},
				bankAccountId: {
					type: ['integer', 'null'],
				},
				responsiblePickUp: {
					type: ['object', 'null'],
				},
				customerBillId: {
					type: ['integer', 'null'],
				},
				wayPaymentId: {
					type: ['integer', 'null'],
				},
				wayPaymentDetailCode: {
					type: ['string', 'null'],
				},
				dataBill: {
					type: ['object', 'null'],
				},
				flagBill: {
					type: ['boolean', 'null'],
				},
				costShipping: {
					type: ['number', 'null'],
					default: 0,
				},
				tokenGateway: {
					type: ['string', 'null'],
				},
				sessionGateway: {
					type: ['object', 'null'],
					default: {},
				},
				flagStatusOrder: {
					type: ['integer', 'null'],
					default: 1,
					enum: [1, 2, 3, 'null'],
				},
				gatewayErrorCode: {
					type: ['string', 'null'],
				},
				gatewayAuthorizationResponse: {
					type: ['object', 'null'],
					default: {},
				},
				flagApproval: {
					type: 'boolean',
				},
				flagInvolveStock: {
					type: ['boolean', 'null'],
					default: false,
				},
				merchantId: {
					type: ['string', 'null'],
				},
				commerceId: {
					type: ['integer', 'null'],
				},
				channel: {
					type: ['string', 'null'],
				},
				currency: {
					type: ['string', 'null'],
				},
				stateLogs: {
					type: ['array', 'null'],
					default: [],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				originPlatform: {
					type: ['integer', 'null'],
				},
				discount: {
					type: ['number', 'null'],
				},
				orderPickState: {
					type: ['integer', 'null'],
					default: registered,
				},
				routeName: {
					type: ['string', 'null'],
				},
				flagGuides: {
					type: ['boolean', 'integer', 'null'],
					default: 0,
				},
				codeApp: {
					type: ['string', 'null'],
				},
				guideCode: {
					type: ['string', 'null'],
				},
				routeId: {
					type: ['integer', 'null'],
				},
				routeIdPickUp: {
					type: ['integer', 'null'],
				},
				costShippingFlagTax: {
					type: ['boolean', 'integer', 'null'],
				},
				costShippingTax: {
					type: ['number', 'null'],
					default: 0,
				},
				costShippingTaxAmount: {
					type: ['number', 'null'],
					default: 0,
				},
				flagDocument: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				documentNumberRelate: {
					type: ['string', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				syncStatus: {
					type: ['integer', 'null'],
					default: 1,
				},
				deliveryId: {
					type: ['integer', 'null'],
				},
				flagMoneyTakenDriver: {
					type: ['integer', 'null', 'boolean'],
				},
				amountCollectDriver: {
					type: ['number', 'null'],
				},
				liquidationIdCommerce: {
					type: ['integer', 'null'],
				},
				liquidationIdDelivery: {
					type: ['integer', 'null'],
				},
				// liquidStatus: {
				// 	type: ['string', 'null'],
				// 	default: 'NO_LIQUID',
				// },
				// liquidDate: {
				// 	type: 'date',
				// 	default: localDate({}, 'YYYY-MM-DD HH:mm:ss'),
				// },
				liquidationInfo: {
					type: ['object', 'null'],
				},
				typeOrderCode: {
					type: ['string', 'null'],
				},
				referenceExternal: {
					type: ['string', 'null'],
				},
				trackingInformation: {
					type: ['object', 'null'],
				},
				deliveryJson: {
					type: ['object', 'null'],
				},
				typeOrder: {
					type: ['integer', 'null'],
					default: 1,
				},
				transportAgencyId: {
					type: ['integer', 'null'],
				},
				typeDistributionId: {
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
			tokenGatewayColumns: builder => builder.select(this.defaultColumns(['token_gateway'])),
			simpleColumns: builder => builder.select(this.simpleColumns('')),
			selectColumnsGatewayTransaction: builder =>
				builder.select(this.selectColumnsGatewayTransaction()),
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static simpleColumns(otherColumns = []) {
		let columns = [
			'id',
			'number',
			'order_state_id',
			'flag_pick_up',
			'responsible_pick_up',
			'subsidiary_id',
			'warehouse_id',
			'customer_id',
			'employee_id',
			'delivery_address',
			'delivery_date',
			'delivery_price',
			'delivery_json',
			'type_order',
			'payment_state_id',
			'taxes',
			'subtotal',
			'total',
			'created_at',
			'way_payment_id',
			'way_payment_detail_code',
			'flag_bill',
			'bank_account_id',
			'flag_status_order',
			'cost_shipping',
			'flag_approval',
			'company_id',
			'commerce_id',
			'location_origin',
			'channel',
			'currency',
			'terminal_id',
			'discount',
			'order_pick_state',
			'amount_collect_driver',
			'cost_shipping_flag_tax',
			'cost_shipping_tax',
			'cost_shipping_tax_amount',
			'flag_document',
			'delivery_id',
			'flag_money_taken_driver',
			'distance',
			'type_order_code',
			'tracking_information',
			'document_number',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'number',
			'flag_kardex',
			'flag_sale',
			'order_state_id',
			'flag_pick_up',
			'order_annex_id',
			'responsible_pick_up',
			'subsidiary_id',
			'warehouse_id',
			'warehouse_name',
			'warehouse_address',
			'customer_id',
			'employee_id',
			'delivery_address',
			'delivery_date',
			'delivery_price',
			'delivery_json',
			'type_order',
			'payment_state_id',
			'comments',
			'additional_info',
			'taxes',
			'subtotal',
			'total',
			'customer_address_id',
			'customer_bill_id',
			'created_at',
			'way_payment_id',
			'way_payment_detail_code',
			'data_bill',
			'flag_bill',
			'bank_account_id',
			'flag_status_order',
			'cost_shipping',
			'gateway_error_code',
			'flag_approval',
			'flag_involve_stock',
			'merchant_id',
			'company_id',
			'commerce_id',
			'location_origin',
			'channel',
			'state_logs',
			'gateway_authorization_response',
			'currency',
			'terminal_id',
			'origin_platform',
			'additional_information',
			'discount',
			'order_pick_state',
			'amount_collect_driver',
			'liquidation_id_commerce',
			'liquidation_id_delivery',
			'liquidation_info',
			'route_name',
			'route_id',
			'route_id_pick_up',
			'flag_guides',
			'pick_up_name',
			'code_app',
			'guide_code',
			'cost_shipping_flag_tax',
			'cost_shipping_tax',
			'cost_shipping_tax_amount',
			'flag_document',
			'document_number_relate',
			'sync_status',
			'delivery_id',
			'flag_money_taken_driver',
			'distance',
			'type_order_code',
			'reference_external',
			'tracking_information',
			'document_number',
			'transport_agency_id',
			'type_distribution_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static selectColumnsGatewayTransaction(otherColumns = []) {
		let columns = ['id', 'number', 'order_state_id'].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}
	static basicColumns(otherColumns = []) {
		let columns = [
			'id',
			'number',
			'responsible_pick_up',
			'warehouse_name',
			'customer_id',
			'employee_id',
			'taxes',
			'total',
			'way_payment_detail_code',
			'flag_bill',
			'company_id',
			'commerce_id',
			'location_origin',
			'currency',
			'additional_info',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get virtualAttributes() {
		return [
			'paymentStateName',
			'pickUpName',
			'originPlatformName',
			'orderPickStateName',
			'totalItems',
			'formatNumbers',
			'paymentStateGateway',
			'distanceWithSymbol',
			'paymentStateColor',
			'currencySymbol',
			'typeOrderName',
			'typeOfOrganization',
		];
	}
	get typeOfOrganization() {
		let name;
		if (!this.transportAgencyId) {
			name = 'RP';
		} else {
			name = 'AT';
		}
		return name;
	}

	get typeOrderName() {
		let name;
		if (this.typeOrder === delivery) {
			name = 'Delivery';
		} else if (this.typeOrder === courier) {
			name = 'Courier';
		} else if (this.typeOrder === freeCourier) {
			name = 'Libre';
		}
		return name;
	}
	get distanceWithSymbol() {
		return `${this.distance || 0} km`;
	}

	get formatNumbers() {
		return {
			total: this.total ? this.total.toFixed(2) : '0.00',
		};
	}

	get totalItems() {
		const totalItems = this.details ? this.details.length : 0;
		return totalItems;
	}
	get paymentStateName() {
		let name;
		if (this.paymentStateId === pending) {
			name = 'Pendiente';
		} else if (this.paymentStateId === partial) {
			name = 'Parcial';
		} else if (this.paymentStateId === payOut) {
			name = 'Pagado';
		} else if (this.paymentStateId === refund) {
			name = 'Reembolso Procesado';
		} else if (this.paymentStateId === pendingRefund) {
			name = 'Reembolso Pendiente';
		}
		return name;
	}
	get paymentStateColor() {
		let color;
		if (this.paymentStateId === pending) {
			color = 'red accent-4';
		} else if (this.paymentStateId === partial) {
			color = 'grey darken-1';
		} else if (this.paymentStateId === payOut) {
			color = 'teal accent-3';
		} else if (this.paymentStateId === refund) {
			color = 'blue darken-1';
		} else if (this.paymentStateId === pendingRefund) {
			color = 'orange darken-2';
		}
		return color;
	}
	get paymentStateGateway() {
		let name;
		const { additionalInformation } = this;
		if (additionalInformation) {
			const { paymentGateway } = additionalInformation;
			if (paymentGateway && paymentGateway.status) {
				name = paymentGateway.status;
			}
		}
		return name;
	}

	get pickUpName() {
		let name = '';
		if (this.flagPickUp === home) {
			name = 'Envío a Domicilio';
		} else if (this.flagPickUp === store) {
			name = 'Recojo en Tienda';
		}
		return name;
	}

	get originPlatformName() {
		let name = '';
		if (this.originPlatform === OriginPlatform.desktop) {
			name = 'Desktop';
		} else if (this.originPlatform === OriginPlatform.web) {
			name = 'Web';
		} else if (this.originPlatform === OriginPlatform.movil) {
			name = 'Movil';
		}
		return name;
	}

	get orderPickStateName() {
		let name;
		if (this.orderPickState === registered) {
			name = 'Registrado';
		} else if (this.orderPickState === attended) {
			name = 'Atendido';
		} else if (this.orderPickState === readyToPickUp) {
			name = 'Listo para recoger';
		} else if (this.orderPickState === inProgress) {
			name = 'En curso';
		}
		return name;
	}

	get currencySymbol() {
		let symbol;
		if (this.currency === 'PEN') {
			symbol = 'S/';
		} else {
			symbol = '$';
		}
		return symbol;
	}

	async $afterInsert() {
		const useOrderCredits = this.additionalInfo && this.additionalInfo.useOrderCredits;
		if (useOrderCredits) {
			await OrderCredit.useOneCredit(this.subsidiaryId, this.companyId);
		}
	}

	static getDeliveryDateRangeString(order) {
		let name = '';
		const { homeDeliveryDays, storeDeliveryDays, storeDeliveryRange } = order.additionalInfo || {};
		const formatFunction = (date, newFormat) =>
			moment(date)
				.locale('es')
				.format(newFormat);
		const getDay = date => formatFunction(date, 'DD');
		const getMoth = date => formatFunction(date, 'MMMM');
		if (order.flagPickUp === home) {
			const newDate = addDays(order.createdAt, homeDeliveryDays || 0);
			name = `Recógelo a partir del ${getDay(newDate)} de ${getMoth(newDate)}`;
		} else if (order.flagPickUp === store) {
			const startDate = addDays(order.createdAt, storeDeliveryDays || 2);
			const endDate = addDays(startDate, storeDeliveryRange || 2);
			const sameMoth = isSameMonth(startDate, endDate);
			const startDay = getDay(startDate);
			const startMonth = getMoth(startDate);
			const endDay = getDay(endDate);
			const endMonth = getMoth(endDate);
			if (sameMoth) {
				name = `Recíbelo del ${startDay} al ${endDay} de ${endMonth}`;
			} else {
				name = `Recíbelo del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
			}
		}
		return name;
	}

	static validEagerAdd(filter, eagers, validName, eagerAdd) {
		if (filter.relationAdd.indexOf(validName) > -1) {
			eagers.push(eagerAdd);
		}
		return eagers;
	}

	static validEagers(filter, eagerDefault = '') {
		let eagers = [];
		if (eagerDefault !== '') {
			eagers.push(eagerDefault);
		}
		if (filter.includeEmployee) {
			eagers.push('employee(selectColumnsVendor)');
		}
		if (filter.includeRoutePickUp) {
			eagers.push('routePickUp(basicColumns)');
		}
		if (filter.flagTransportAgency) {
			eagers.push('transportAgency(selectColumns)');
		}
		if (filter.relationAdd && filter.relationAdd.length > 0) {
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'customerSimple',
				'customer(onlyVirtualAttributes)',
			);
			eagers = this.validEagerAdd(filter, eagers, 'customer', 'customer(selectColumnsVendor)');
			eagers = this.validEagerAdd(filter, eagers, 'orderState', 'orderState(selectColumns)');
			eagers = this.validEagerAdd(filter, eagers, 'details', 'details(selectColumns)');
		}
		return `[${eagers.toString()}]`;
	}

	static getAll(companyId, filter = {}, aclFilters = {}) {
		const filterAux = { ...filter };
		const customerTable = 'com_customers';
		let newColumns = this.defaultColumns();
		const eagerDefault =
			'route(selectColumns), orderPickStateData(selectColumns), customer(selectColumns), customerBill(selectColumns), details(selectColumns), customerAddress(selectColumns).[parish(selectColumns), city(selectColumns), province(selectColumns)], orderState(selectColumns), wayPayment(selectColumns), commerce(basicColumns), delivery(basicColumns)';
		const eagers = this.validEagers(filter, eagerDefault);
		let query = this.query()
			.eager(eagers)
			.aclFilter(aclFilters.subsidiaries, this.tableName)
			.skipUndefined()
			.where(`${this.tableName}.flag_pick_up`, filter.flagPickUp)
			.skipUndefined()
			.where(`${this.tableName}.payment_state_id`, filter.paymentState)
			.skipUndefined()
			.where(`${this.tableName}.customer_address_id`, filter.addressId)
			.skipUndefined()
			.where(`${this.tableName}.flag_kardex`, filter.flagKardex)
			.skipUndefined()
			.where(`${this.tableName}.flag_bill`, filter.flagBill)
			.skipUndefined()
			.where(`${this.tableName}.flag_status_order`, filter.statusOrder)
			.skipUndefined()
			.where(`${this.tableName}.flag_involve_stock`, filter.involveStock)
			.skipUndefined()
			.where(`${this.tableName}.flag_approval`, filter.flagApproval)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.order_pick_state`, filter.orderPickState)
			.skipUndefined()
			.where(`${this.tableName}.origin_platform`, filter.originPlatform)
			.skipUndefined()
			.where(`${this.tableName}.way_payment_id`, filter.wayPaymentId)
			.skipUndefined()
			.where(`${this.tableName}.reference_external`, filter.referenceExternal)
			.skipUndefined()
			.where(`${this.tableName}.flag_sale`, filter.flagSale)
			.where(`${this.tableName}.company_id`, companyId);

		if (!filter.showAll) {
			if (filter.typeOrders) {
				const typeOrders = filter.typeOrders.split(',');
				query.whereIn(`${this.tableName}.type_order`, typeOrders);
			} else if (filter.typeOrder) {
				query.where(`${this.tableName}.type_order`, filter.typeOrder);
			} else {
				query.where(`${this.tableName}.type_order`, delivery);
			}
		}

		if (filter.commercesId && Array.isArray(filter.commercesId) && filter.commercesId.length > 0) {
			query.whereIn(`${this.tableName}.commerce_id`, filter.commercesId);
		}

		if (filter.orderStateId) {
			const newOrderStateId = `${filter.orderStateId}`;
			query.whereIn(`${this.tableName}.order_state_id`, newOrderStateId.split(','));
		}

		if (!filter.flagReseller) {
			query.where(`${this.tableName}.flag_status_order`, payOut);
		}

		if (filter.transportAgencyId) {
			query.where(`${this.tableName}.transport_agency_id`, filter.transportAgencyId);
		}
		if (filter.employeeId) {
			query.where(`${this.tableName}.employee_id`, filter.employeeId);
		}

		if (filter.employeeIds) {
			query.whereIn(`${this.tableName}.employee_id`, filter.employeeIds);
		}

		if (filter.customerId) {
			query.where(`${this.tableName}.customer_id`, filter.customerId);
		}
		if (filter.warehouses) {
			const warehouses = filter.warehouses.split(',');
			query.whereIn(`${this.tableName}.warehouse_id`, warehouses);
		}
		if (filter.deliveryId) {
			query.where(`${this.tableName}.delivery_id`, filter.deliveryId);
		}
		if (filter.flagRouted) {
			query
				.innerJoin('com_route_check_in', 'com_route_check_in.order_id', `${this.tableName}.id`)
				.groupBy(`${this.tableName}.id`);
		}

		if (filter.byFac || filter.byBol) {
			query
				.innerJoin('sal_documents', 'sal_documents.order_id', `${this.tableName}.id`)
				.innerJoin(
					'com_ms_type_documents',
					'com_ms_type_documents.id',
					'sal_documents.sal_type_document_id',
				)
				.where('com_ms_type_documents.code', filter.byFac ? 'FAC' : 'BOL')
				.groupBy(`${this.tableName}.id`);
		}

		if (filter.zoneId) {
			query
				.innerJoin(
					'com_zones_customers',
					'com_zones_customers.customer_id',
					`${this.tableName}.customer_id`,
				)
				.where('com_zones_customers.zone_id', filter.zoneId)
				.groupBy(`${this.tableName}.id`);
		}

		if (filter.provinceId || filter.cityId || filter.parishId) {
			query
				.innerJoin('com_customers', 'com_customers.id', `${this.tableName}.customer_id`)
				.skipUndefined()
				.where('com_customers.province_id', filter.provinceId)
				.skipUndefined()
				.where('com_customers.city_id', filter.cityId)
				.skipUndefined()
				.where('com_customers.parish_id', filter.parishId)
				.groupBy(`${this.tableName}.id`);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}

		if (filter.deliveryDate) {
			query.whereRaw(`${this.tableName}.delivery_date >= ?`, filter.deliveryDate);
			query.whereRaw(`${this.tableName}.delivery_date <= ?`, filter.deliveryDate);
		}

		if (filter.orderStateCode || filter.avoidOrderStates || filter.orderStateCodes) {
			query.innerJoin(
				'com_orders_states',
				'com_orders_states.id',
				`${this.tableName}.order_state_id`,
			);
			if (filter.orderStateCode) {
				query.where('com_orders_states.code', filter.orderStateCode);
			}
			if (filter.avoidOrderStates) {
				const orderStatesAvoided = filter.avoidOrderStates.split(',');
				query.whereNotIn('com_orders_states.code', orderStatesAvoided);
			}
			if (filter.orderStateCodes) {
				const orderStateCodes = filter.orderStateCodes.split(',');
				query.whereIn('com_orders_states.code', orderStateCodes);
			}
		}

		if (filter.sortField) {
			if (!filter.zoneId && filter.sortField === 'zone_name') {
				query
					.innerJoin(
						'com_zones_customers',
						'com_zones_customers.customer_id',
						`${this.tableName}.customer_id`,
					)
					.innerJoin('com_zones', 'com_zones.id', 'com_zones_customers.zone_id');
				filterAux.sortField = 'com_zones.name';
			} else if (filter.zoneId && filter.sortField === 'zone_name') {
				query.innerJoin('com_zones', 'com_zones.id', 'com_zones_customers.zone_id');
				filterAux.sortField = 'com_zones.name';
			} else if (filter.sortField === 'parish_name' || filter.sortField === 'customer_name') {
				if (filter.provinceId || filter.cityId || filter.parishId) {
					if (filter.sortField === 'parish_name') {
						query.leftJoin('com_general', 'com_general.id', 'com_customers.parish_id');
						filterAux.sortField = 'com_general.name';
					} else {
						filterAux.sortField = 'com_customers.name';
					}
				} else if (!filter.provinceId && !filter.cityId && !filter.parishId) {
					if (filter.sortField === 'customer_name') {
						query.innerJoin('com_customers', 'com_customers.id', `${this.tableName}.customer_id`);
						filterAux.sortField = 'com_customers.name';
					} else {
						query
							.innerJoin('com_customers', 'com_customers.id', `${this.tableName}.customer_id`)
							.leftJoin('com_general', 'com_general.id', 'com_customers.parish_id');
						filterAux.sortField = 'com_general.name';
					}
				}
			} else if (filter.sortField === 'order_pick_state_name') {
				query.innerJoin(
					'ms_order_pick_state',
					'ms_order_pick_state.id',
					`${this.tableName}.order_pick_state`,
				);
				filterAux.sortField = 'ms_order_pick_state.name';
			}
		} else {
			query.orderBy(raw(`${this.tableName}.created_at desc, ${this.tableName}.number`), 'desc');
		}

		if (filter.search) {
			if (!filter.customerId) {
				if (
					!filter.provinceId &&
					!filter.cityId &&
					!filter.parishId &&
					filter.sortField !== 'customer_name' &&
					filter.sortField !== 'parish_name'
				) {
					query.innerJoin(
						`${customerTable}`,
						`${customerTable}.id`,
						`${this.tableName}.customer_id`,
					);
				}
				query.where((builder) => {
					builder
						.whereRaw(
							`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
							[filter.search],
						)
						.orWhereRaw(
							`MATCH(${this.tableName}.channel, ${this.tableName}.warehouse_name, ${
								this.tableName
							}.warehouse_address, ${this.tableName}.comments)
										AGAINST(?)`,
							[filter.search],
						)
						.orWhere(`${this.tableName}.number`, 'like', `%${filter.search}%`);
				});
			} else {
				query.where((builder) => {
					builder
						.whereRaw(
							`MATCH(${this.tableName}.channel, ${this.tableName}.warehouse_name, ${
								this.tableName
							}.warehouse_address, ${this.tableName}.comments)
									AGAINST(?)`,
							[filter.search],
						)
						.orWhere(`${this.tableName}.number`, 'like', `%${filter.search}%`);
				});
			}
		}

		if (filter.latitude && filter.longitude) {
			const kilometerRadius = filter.kilometerRadius || 2;
			newColumns = newColumns.toString();
			newColumns = `${newColumns}, ( 6371 * acos(cos(radians(?)) * cos(radians(ST_X(${
				this.tableName
			}.location_origin))) * cos(radians(ST_Y(${
				this.tableName
			}.location_origin)) - radians(?)) + sin(radians(?)) * sin(radians(ST_X(${
				this.tableName
			}.location_origin))))) AS distanceTotal`;
			query
				.select(raw(newColumns, filter.latitude, filter.longitude, filter.latitude))
				.whereNotNull(`${this.tableName}.location_origin`)
				.having('distanceTotal', '<=', kilometerRadius)
				.orderBy('distanceTotal');
		} else {
			query.select(newColumns);
		}

		query = this.includePaginationAndSort(query, filterAux);
		return query;
	}

	static getListReport(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[orderState(selectColumns), wayPayment(selectColumns), details(selectColumns)]')
			.skipUndefined()
			.where(`${this.tableName}.flag_pick_up`, filter.flagPickUp)
			.skipUndefined()
			.where(`${this.tableName}.order_state_id`, filter.orderStateId)
			.skipUndefined()
			.where(`${this.tableName}.payment_state_id`, filter.paymentState)
			.skipUndefined()
			.where(`${this.tableName}.customer_address_id`, filter.addressId)
			.skipUndefined()
			.where(`${this.tableName}.flag_kardex`, filter.flagKardex)
			.skipUndefined()
			.where(`${this.tableName}.flag_bill`, filter.flagBill)
			.skipUndefined()
			.where(`${this.tableName}.flag_status_order`, filter.statusOrder)
			.skipUndefined()
			.where(`${this.tableName}.flag_involve_stock`, filter.involveStock)
			.skipUndefined()
			.where(`${this.tableName}.flag_approval`, filter.flagApproval)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, filter.commerceId)
			.skipUndefined()
			.where(`${this.tableName}.order_pick_state`, filter.orderPickState)
			.skipUndefined()
			.where(`${this.tableName}.flag_sale`, filter.flagSale)
			.skipUndefined()
			.where(`${this.tableName}.currency`, filter.currency)
			.where(`${this.tableName}.company_id`, companyId);

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async create(data, products, dataCommerceAddress) {
		const newData = Object.assign({}, data);
		delete newData.taxDefault;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.locationOrigin = this.raw(`GeomFromText(${point})`);
			delete newData.latitude;
			delete newData.longitude;
		}
		let subtotal = 0;
		let detailPrice;
		const results = data.details.reduce(
			(acum, detail) => {
				const newDetail = Object.assign({}, detail);
				newDetail.companyId = data.companyId;
				if (data.productMaster && data.productMaster.length > 0) {
					data.productMaster.forEach((item1) => {
						if (detail.commercePriceList && item1.priceList) {
							const priceListId = item1.priceList[detail.commercePriceList];
							if (priceListId) {
								const units = priceListId.units ? priceListId.units[detail.unitId] : {};
								const newPrice = units ? units.price : undefined;
								detailPrice = newPrice || priceListId.price;
							}
						}
					});
				}
				if (detailPrice) {
					newDetail.subtotal = detailPrice;
					newDetail.total = detailPrice * detail.quantity;
				} else {
					newDetail.total = detail.salePrice * detail.quantity;
				}
				newDetail.subtotal = detail.subtotal;
				newDetail.stock = detail.stockQuantity;
				subtotal += newDetail.total;
				delete newDetail.commercePriceList;

				let kardexObjectDetail = null;
				const item = products.find((i) => {
					const sameProductId = detail.productId === i.productId;
					const sameWarehouseId = detail.warehouseId === i.warehouseId;
					return sameProductId && sameWarehouseId;
				});
				if (item) {
					kardexObjectDetail = Object.assign({}, newDetail);
					kardexObjectDetail.brandId = item.brandId;
					kardexObjectDetail.warWarehousesId = item.warehouseId;
					kardexObjectDetail.warProductsId = item.productId;
				}
				// Set order details data with the product information to show it in service
				acum.kardexOrderDetails.push(kardexObjectDetail || newDetail);
				// Set all order detail data to insert in table
				acum.orderDetails.push(newDetail);

				return acum;
			},
			{ orderDetails: [], kardexOrderDetails: [] },
		);
		newData.subtotal = subtotal;
		const amountDiscount = newData.discount > 0 ? subtotal * (newData.discount / 100) : 0;
		newData.discount = amountDiscount;
		newData.total = newData.costShipping + (subtotal - amountDiscount);
		newData.details = results.orderDetails;
		delete newData.productMaster;
		const knex = SalOrders.knex();
		const result = await transaction(knex, async (trx) => {
			if (dataCommerceAddress && dataCommerceAddress.flagCalculate === true) {
				const newDataCommerceAddress = Object.assign({}, dataCommerceAddress);
				delete newDataCommerceAddress.flagCalculate;
				newData.distance = newDataCommerceAddress.distance;
				await ComCommerceCustomersAddress.create(newDataCommerceAddress, trx);
			}
			await Series.query(trx)
				.patch({ number: this.raw('number+??', [1]) })
				.where('sal_terminals_id', newData.terminalId)
				.where('com_subsidiaries_id', newData.subsidiaryId)
				.where('sal_type_documents_id', newData.typeDocumentId)
				.where('company_id', newData.companyId);

			const currentSerie = await Series.query(trx)
				.where('sal_terminals_id', newData.terminalId)
				.where('com_subsidiaries_id', newData.subsidiaryId)
				.where('sal_type_documents_id', newData.typeDocumentId)
				.where('company_id', newData.companyId)
				.first();
			if (currentSerie) {
				newData.number = Number(currentSerie.number);
				newData.serie = currentSerie.serie;
				newData.documentNumber = `${currentSerie.serie}-${currentSerie.number}`;
			}
			const salOrderResult = await this.query(trx).insertGraph(newData);
			return salOrderResult;
		});

		result.details = results.kardexOrderDetails;
		return result;
	}

	static async createBatch(
		data,
		terminalId,
		subsidiaryId,
		typeDocumentId,
		companyId,
		{ SalOrdersDetailsModel, ordersDetailIds },
	) {
		const knex = SalOrders.knex();
		const response = await transaction(knex, async (trx) => {
			const currentSerie = await Series.query(trx)
				.where('sal_terminals_id', terminalId)
				.where('com_subsidiaries_id', subsidiaryId)
				.where('sal_type_documents_id', typeDocumentId)
				.where('company_id', companyId)
				.first();

			const serieNumber = Number(currentSerie.number);
			let count = 0;
			const { newOrder, updateOrder } = data.reduce(
				(acum, items) => {
					const newData = { ...items };
					if (newData.latitude && newData.longitude) {
						const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
						newData.locationOrigin = this.raw(`GeomFromText(${point})`);
						delete newData.latitude;
						delete newData.longitude;
					}

					if (!items.id) {
						newData.number = serieNumber + count;
						newData.serie = currentSerie.serie;
						newData.documentNumber = `${currentSerie.serie}-${serieNumber + count}`;
						count += 1;
					}
					delete newData.dataCommerceAddress;
					delete newData.productMaster;
					delete newData.priceListId;
					delete newData.taxDefault;
					delete newData.products;
					if (items.id) {
						acum.updateOrder.push(newData);
					} else {
						acum.newOrder.push(newData);
					}
					return acum;
				},
				{
					newOrder: [],
					updateOrder: [],
				},
			);

			let salOrderResult;
			if (updateOrder && updateOrder.length > 0) {
				if (SalOrdersDetailsModel && ordersDetailIds && ordersDetailIds.length > 0) {
					await SalOrdersDetailsModel.query(trx)
						.delete()
						.whereIn('id', ordersDetailIds)
						.where('company_id', companyId);
				}
				salOrderResult = await this.query(trx).upsertGraph(updateOrder, {
					noDelete: true,
				});
			}
			if (newOrder && newOrder.length > 0) {
				await Series.query(trx)
					.patch({ number: this.raw('number+??', [count]) })
					.where('sal_terminals_id', terminalId)
					.where('com_subsidiaries_id', subsidiaryId)
					.where('sal_type_documents_id', typeDocumentId)
					.where('company_id', companyId);
				const salOrder = await this.query(trx).insertGraph(newOrder);
				salOrderResult = salOrderResult ? salOrderResult.concat(salOrder) : salOrder;
			}
			return salOrderResult;
		});

		return Promise.resolve(response);
	}

	static async edit(data, dataCommerceAddress) {
		const newData = data;
		const knex = SalOrders.knex();
		if (!data.customerAddressId && data.customerAddress) {
			const newCustomerAddress = await CustomersAddress.create(data.customerAddress);
			const customerAddresId = newCustomerAddress.id;
			delete newData.customerAddress;
			newData.customerAddressId = customerAddresId;
		}
		const options = {
			noDelete: false,
		};
		return transaction(knex, async (trx) => {
			if (dataCommerceAddress && dataCommerceAddress.flagCalculate === true) {
				const newDataCommerceAddress = Object.assign({}, dataCommerceAddress);
				delete newDataCommerceAddress.flagCalculate;
				newData.distance = newDataCommerceAddress.distance;
				await ComCommerceCustomersAddress.create(newDataCommerceAddress, trx);
			}
			return this.query(trx).upsertGraph(newData, options);
		});
	}

	static editSimple(id, data, companyId, customer = false) {
		const newData = { ...data };
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.originLocation = this.raw(`GeomFromText(${point})`);
		}
		if (customer) {
			const dataToUp = {
				latitude: newData.deliveryAddress.latitude,
				longitude: newData.deliveryAddress.longitude,
				addressLine1: newData.deliveryAddress.addressLine1,
			};
			CustomersAddress.edit(newData.customerAddressId, dataToUp, newData.customerId, companyId);
			delete newData.customerAddressId;
			delete newData.customerAddress;
		}
		return this.query()
			.patch(newData)
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static editMultiple(ids, data, companyId) {
		return this.query()
			.patch(data)
			.whereIn(`${this.tableName}.id`, ids)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static editByUpsert(data, trx) {
		return this.query(trx).upsertGraph(data, {
			noDelete: true,
			unrelate: false,
		});
	}

	static getById(id, companyId, params = {}) {
		const { isPublic = false, summary } = params;
		const otherColumns = isPublic ? ['token_gateway'] : [];
		if (summary) {
			otherColumns.push('session_gateway');
		}
		return this.query()
			.eager('[route(selectColumns), orderPickStateData(selectColumns), customer(selectColumns).[customerAddress(selectColumns), person(selectColumns)], customerAddress(selectColumns), details(selectColumns), subsidiary(selectColumns), commerce(selectColumns), wayPayment(selectColumns), orderState(selectColumns)]')
			.select(this.defaultColumns(otherColumns))
			.where(`${this.tableName}.id`, id)
			.skipUndefined()
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getByIds(id, companyId, filters = { simpleData: false }) {
		const eagerAux = filters.simpleData
			? '[details(selectColumns), wayPayment(selectColumns), commerce(selectColumns)]'
			: '[route(selectColumns), orderPickStateData(selectColumns), customer(selectColumns).[customerAddress(selectColumns), person(selectColumns)], customerAddress(selectColumns), details(selectColumns), subsidiary(selectColumns), commerce(selectColumns), wayPayment(selectColumns), orderState(selectColumns)]';
		const query = this.query()
			.eager(eagerAux)
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.id`, id)
			.skipUndefined()
			.whereIn(`${this.tableName}.order_state_id`, filters.orderStateIds)
			.where(`${this.tableName}.company_id`, companyId);
		return query;
	}

	static countOrdersByDeliveryId(companyId, deliveryId, typeOrder) {
		const query = this.query()
			.where('company_id', companyId)
			.where(`${this.tableName}.delivery_id`, deliveryId)
			.where(`${this.tableName}.order_state_id`, '!=', 3)
			.where(`${this.tableName}.type_order`, typeOrder);
		return query.count('*').first();
	}

	static getByLiquidations(companyId, filters = {}) {
		const orderColumns = [
			`${this.tableName}.id as orderId`,
			`${this.tableName}.document_number as orderNumber`,
			`${this.tableName}.payment_state_id as paymentState`,
		];
		const query = this.query()
			.eager('[wayPayment(fairColumns), commerce(basicColumns), customer(selectColumnsVendor).[person(selectColumns)]]')
			.select(this.simpleColumns(orderColumns))
			.skipUndefined()
			.where(`${this.tableName}.liquidation_id_commerce`, filters.liquidationIdCommerce)
			.skipUndefined()
			.where(`${this.tableName}.liquidation_id_delivery`, filters.liquidationIdDelivery)
			.skipUndefined()
			.whereIn(`${this.tableName}.order_state_id`, filters.orderStateIds)
			.where(`${this.tableName}.company_id`, companyId);
		return query;
	}

	static getByIdsOrder(ids, companyId, filter = {}) {
		let columns = [];
		const eagers = this.validEagers(filter, 'orderState(selectColumns)');
		const query = this.query()
			.eager(eagers)
			.whereIn(`${this.tableName}.id`, ids)
			.where(`${this.tableName}.company_id`, companyId);
		if (filter.flagOrderAnnexNull) {
			query.whereNull(`${this.tableName}.order_annex_id`);
			columns = ['total', 'flag_sale'];
		}
		query.select(this.selectColumnsGatewayTransaction(columns));
		return query;
	}

	static getByAnnexId(id, companyId) {
		const columns = [
			'flag_sale',
			'subsidiary_id',
			'warehouse_name',
			'warehouse_address',
			'customer_id',
			'type_order',
			'comments',
			'additional_info',
			'taxes',
			'subtotal',
			'total',
			'way_payment_id',
			'way_payment_detail_code',
			'bank_account_id',
			'company_id',
			'commerce_id',
			'currency',
			'origin_platform',
			'additional_information',
			'discount',
			'cost_shipping',
			'cost_shipping_flag_tax',
			'cost_shipping_tax',
			'cost_shipping_tax_amount',
			'flag_document',
			'reference_external',
			'document_number',
		].map(c => `${this.tableName}.${c}`);
		const query = this.query()
			.eager('[customer(onlyVirtualAttributes), saleDocument(simpleColumns).[customer(onlyVirtualAttributes), typeDocument(documentTypeData), company(basicColumns).country(selectColumns)]]')
			.where(`${this.tableName}.order_annex_id`, id)
			.where(`${this.tableName}.company_id`, companyId);
		query.modifyEager('saleDocument', (builder) => {
			builder.where('sal_documents.com_company_id', companyId);
		});
		query.select(this.selectColumnsGatewayTransaction(columns));
		return query;
	}

	static findById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getLastNumber(companyId) {
		return this.query()
			.max('number AS maxNumber')
			.where('company_id', companyId)
			.first();
	}

	static getAllByClient(clientId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.flag_status_order`, payOut)
			.where('customer_id', clientId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCustomer(number, customerId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns)')
			.where('number', number)
			.where('customer_id', customerId)
			.first();
	}

	static getByIdOnly(id, companyId) {
		return this.query()
			.select(this.defaultColumns(['token_gateway']))
			.eager('[details(selectColumns), commerce(selectColumns)]')
			.findById(id)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getByIdAndCustomer(id, {
		customerId, employeeId, companyId, params = {},
	}) {
		const { isPublic = false, summary } = params;
		const otherColumns = isPublic ? ['token_gateway'] : [];
		if (summary) {
			otherColumns.push('session_gateway');
		}
		const paymentList = summary ? 'gatewayTransaction(listPublic), ' : '';
		const query = this.query()
			.select(this.defaultColumns(otherColumns))
			.eager(`[customer(selectColumns), ${paymentList}details(selectColumns), customerAddress(selectColumns).[parish(selectColumns), city(selectColumns), province(selectColumns)], orderState(selectColumns), customerBill(selectColumns), commerce(selectColumns), wayPayment(selectColumns), bankAccount(selectColumns), delivery(basicColumns)]`)
			.where('id', id)
			.skipUndefined()
			.where('customer_id', customerId)
			.skipUndefined()
			.where('employee_id', employeeId)
			.where('company_id', companyId)
			.first();
		return query;
	}

	static releaseDelivery(id, dataToUpdate, companyId) {
		return this.query()
			.patch(dataToUpdate)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editOrderState(
		id,
		{
			orderStateId, stateLogUpdate, payOutValid, flagInvolveStock, flagKardex,
		},
		companyId,
	) {
		const dataToUpdate = {
			orderStateId,
			stateLogs: stateLogUpdate,
			flagInvolveStock,
		};
		if (flagKardex) {
			dataToUpdate.flagKardex = flagKardex;
		}
		if (payOutValid) {
			dataToUpdate.paymentStateId = payOutValid;
		}

		return this.query()
			.patch(dataToUpdate)
			.where('id', id)
			.where('company_id', companyId);
	}

	static isSync({ id, companyId, syncStatus = 2 }) {
		return this.query()
			.select('id')
			.where('sync_status', syncStatus)
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static editSynStatus({ id, companyId, syncStatus = 2 }) {
		return this.query()
			.patch({ syncStatus })
			.where('id', id)
			.where('company_id', companyId);
	}

	static cancel({
		id,
		customerId,
		companyId,
		cancelStateId,
		paymentStateId,
		stateLog,
		additionalInformation,
		gatewayAuthorizationResponse,
	}) {
		const knex = SalOrders.knex();
		return transaction(knex, async (trx) => {
			const dataCreated = this.query(trx)
				.patch({
					orderStateId: cancelStateId,
					stateLogs: stateLog,
					additionalInformation,
					paymentStateId,
					gatewayAuthorizationResponse,
				})
				.skipUndefined()
				.where('customer_id', customerId)
				.where('id', id)
				.where('company_id', companyId);
			return dataCreated;
		});
	}

	static findCustomerAddressUsage(customerAddressId, companyId) {
		return this.query()
			.where('customer_address_id', customerAddressId)
			.where('company_id', companyId)
			.first();
	}

	static getAllByIds(ids, companyId, filter = { detailEager: false }) {
		const eagerString = filter.detailEager
			? '[customerAddress(selectColumns), details(selectColumns)]'
			: 'customerAddress(selectColumns)';
		const query = this.query()
			.eager(eagerString)
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.id`, ids)
			.where(`${this.tableName}.company_id`, companyId);
		if (filter.orderStatesCode && Array.isArray(filter.orderStatesCode)) {
			query
				.innerJoin('com_orders_states', 'com_orders_states.id', `${this.tableName}.order_state_id`)
				.whereIn('com_orders_states.code', filter.orderStatesCode);
		}
		return query;
	}

	static approveAll(ids, companyId) {
		return this.query()
			.patch({ flagApproval: true })
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static updateAdditionalInfo(
		id,
		companyId,
		{
			additionalInfo, customerId, stateLogVoucher, paymentStateId,
		},
	) {
		return this.query()
			.patch({
				additionalInfo,
				paymentStateId,
				stateLogs: stateLogVoucher,
			})
			.where('id', id)
			.skipUndefined()
			.where('customer_id', customerId)
			.where('company_id', companyId);
	}

	static getByEmployee(id, employeeId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('employee_id', employeeId)
			.where('company_id', companyId)
			.first();
	}

	static editOrderPickState(id, orderPickState, companyId) {
		return this.query()
			.patch({ orderPickState })
			.where('id', id)
			.where('company_id', companyId);
	}

	static editTrackingInfo({ trackingInformation, id, companyId }) {
		return this.query()
			.patch({ trackingInformation })
			.where('id', id)
			.where('company_id', companyId);
	}

	static async sendPushNotification({
		number,
		commerce,
		entityReceptor,
		companyId,
		salOrder,
		title,
		body,
		event,
	}) {
		if (commerce && commerce.settings && commerce.settings.enablePushNotification) {
			const destiny = async () => {
				if (commerce.settings.personalNotification && entityReceptor) {
					const msDeviceData = await MsDevice.getByUser(entityReceptor.id, entityReceptor.entity);
					return msDeviceData && msDeviceData.token;
				}
				return salOrder && `${companyId}_${salOrder.warehouseId}`;
			};
			const destinyFound = await destiny();
			if (destinyFound) {
				const dataInfo = {
					to: destinyFound,
					notification: {
						title: title || 'Nuevo pedido',
						body: body || `Tiene un nuevo pedido #${number}`,
					},
					data: {
						origin: NotificationOrigin.orders,
						identifier: `${salOrder.id}`,
						event: event || null,
					},
					isTopic: !commerce.settings.personalNotification,
				};
				await sendPushNotification(dataInfo, companyId);
			}
		}
		return {};
	}

	static async handleNotification({
		order,
		wayPayment,
		bankAccount = {},
		paymentGateway,
		dataStructure,
		flagMultiOrder,
		commerceNotification,
	}) {
		const {
			commerce, orderState, customer, companyId,
		} = order;

		const sendNotificationMultiOrdersByWeb = (
			settings = {},
			templateCode = process.env.CODE_TEMPLATE_ECOMMERCE,
		) => {
			const data = {
				to: customer.email,
				from: settings.mailSender ? settings.mailSender : process.env.MAKI_ADMIN_FROM_MULTI,
				content: {
					...dataStructure,
					fullName: `${customer.name} ${customer.lastname}`,
					flagDeposit: wayPayment && wayPayment.code === bankDep,
					bankAccount: wayPayment && wayPayment.code === bankDep ? bankAccount : null,
					flagRequest: orderState.code === MsOrderStates.requested,
					flagInRoad: orderState.code === MsOrderStates.inRoad,
					flagGive: orderState.code === MsOrderStates.given,
					flagConfirm: orderState.code === MsOrderStates.confirmed,
					flagReadyToDeliver: orderState.code === MsOrderStates.readyToDeliver,
					orderState,
					flagStore: false,
					responsiblePickUp: order.responsiblePickUp,
					deliveryAddress: order.deliveryAddress,
				},
				message: dataStructure.message,
			};

			const structureData = {
				companyId,
				templateCode,
				data,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: structureData,
				validateStatus: () => true,
			});
		};

		const sendNotificationOrdersByWeb = (
			settings,
			templateCode = process.env.CODE_TEMPLATE_ECOMMERCE,
		) => {
			const data = {
				to: customer.email,
				from: settings.mailSender ? settings.mailSender : process.env.MAKI_ADMIN_FROM,
				content: {
					id: order.id,
					fullName: `${customer.name} ${customer.lastname}`,
					tienda: order.warehouseName,
					numero: order.number,
					details: order.details,
					flagDeposit: wayPayment && wayPayment.code === bankDep,
					bankAccount: wayPayment && wayPayment.code === bankDep ? bankAccount : null,
					flagRequest: orderState.code === MsOrderStates.requested,
					flagInRoad: orderState.code === MsOrderStates.inRoad,
					flagGive: orderState.code === MsOrderStates.given,
					flagConfirm: orderState.code === MsOrderStates.confirmed,
					flagReadyToDeliver: orderState.code === MsOrderStates.readyToDeliver,
					orderState,
					flagStore: order.flagPickUp === store,
					responsiblePickUp: order.responsiblePickUp,
					deliveryAddress: order.deliveryAddress,
					total: order.total,
					subtotal: order.subtotal,
					deliveryPrice: order.deliveryPrice || order.costShipping,
					address: commerce.address,
					deliveryDate: order.deliveryDate,
					paymentGateway,
					wayPayment,
				},
				message: `Su pedido: ${order.number}, se encuentra: ${orderState.name}`,
			};

			const structureData = {
				companyId,
				templateCode,
				data,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: structureData,
				validateStatus: () => true,
			});
		};

		const sendNotificationOrdersyWhatsapp = () => {
			let templateCode = process.env.CODE_TEMPLATE_WHATSAPP;
			const {
				phone: phoneOld, phoneNumbers, lastname, name,
			} = customer;
			let fields;
			if (order && order.orderState) {
				templateCode = `${process.env.CODE_TEMPLATE_WHATSAPP}_${order.orderState.code}`.substring(
					0,
					20,
				);
				fields = {
					fullName: `${name} ${lastname}`,
					statusOrder: order.orderState.name,
					numOrder: order.number,
					deliveryDate: order.deliveryDate,
				};
			}
			let numberPhone;
			if (phoneNumbers && isArray(phoneNumbers) && phoneNumbers.length > 0) {
				numberPhone = phoneNumbers[0].length === 9 ? phoneNumbers[0] : null;
			}
			if (isNullOrUndefined(numberPhone)) {
				numberPhone = phoneOld && phoneOld.length === 9 ? phoneOld : null;
			}
			const message = `Hola ${customer.name} ${customer.lastname}, Tu pedido es el número: ${
				order.number
			}`;

			const dataNotification = {
				companyId,
				templateCode,
				data: {
					phone: `51${numberPhone}`,
					message,
					fields,
				},
			};
			if (!isNullOrUndefined(numberPhone)) {
				return simpleAxios({
					url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/WTAPP/public`,
					method: 'POST',
					data: dataNotification,
					validateStatus: () => true,
				});
			}
			return null;
		};

		const sendNotificationOrdersByWebConfirm = (settings, templateCode = 'CONFIRM_GATEWAY') => {
			const data = {
				to: customer.email,
				from: settings.mailSender ? settings.mailSender : process.env.MAKI_ADMIN_FROM,
				content: dataStructure,
				message: `Su pedido: ${order.number}, se encuentra: ${orderState.name}`,
			};

			const structureData = {
				companyId,
				templateCode,
				data,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: structureData,
				validateStatus: () => true,
			});
		};

		const sendNotificationToCommercesByWeb = (
			settings = {},
			templateCode = 'TR-ORDER-SUCCESS-COM',
		) => {
			const data = {
				to: dataStructure.commerce.email,
				from: settings.mailSender ? settings.mailSender : process.env.MAKI_ADMIN_FROM_MULTI,
				content: {
					...dataStructure,
					flagDeposit: wayPayment && wayPayment.code === bankDep,
					bankAccount: wayPayment && wayPayment.code === bankDep ? bankAccount : null,
					flagRequest: orderState.code === MsOrderStates.requested,
					flagInRoad: orderState.code === MsOrderStates.inRoad,
					flagGive: orderState.code === MsOrderStates.given,
					flagConfirm: orderState.code === MsOrderStates.confirmed,
					flagReadyToDeliver: orderState.code === MsOrderStates.readyToDeliver,
					orderState,
					flagStore: false,
					responsiblePickUp: order.responsiblePickUp,
					deliveryAddress: order.deliveryAddress,
					paymentGateway,
					wayPayment,
				},
				message: `Tiene un nuevo pedido N.${dataStructure.numero} con transacción N.${
					dataStructure.numberTransaction
				}`,
			};

			const structureData = {
				companyId,
				templateCode,
				data,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: structureData,
				validateStatus: () => true,
			});
		};

		if (commerce && !isNullOrUndefined(orderState)) {
			const { settings } = commerce;
			if (settings && settings.flagWebOrders) {
				await sendNotificationOrdersByWeb(settings);
			}
			if (settings && settings.flagSmsOrders) {
				await sendNotificationOrdersyWhatsapp();
			}
			if (settings && dataStructure) {
				await sendNotificationOrdersByWebConfirm(settings);
			}
		}
		if (flagMultiOrder && !isNullOrUndefined(orderState)) {
			sendNotificationMultiOrdersByWeb();
		}
		if (
			commerceNotification &&
			dataStructure.commerce &&
			dataStructure.commerce.email &&
			dataStructure.numberTransaction
		) {
			sendNotificationToCommercesByWeb(dataStructure.commerce.settings);
		}
		return true;
	}

	static async getByIdSimple(id, companyId, addDateString = true) {
		const order = await this.query()
			.select(this.defaultColumns())
			.eager('details(selectColumns)')
			.where('id', id)
			.where('company_id', companyId)
			.first();
		if (order && addDateString) {
			order.deliveryDateRangeString = SalOrders.getDeliveryDateRangeString(order);
		}
		return order;
	}

	static recalculateTotal(order, allButOrderDetailsId, { customerDiscount = 0 }) {
		const { subtotal, newDetails } = order.details.reduce(
			(acc, detail) => {
				const newAcc = { ...acc };
				const isIn = allButOrderDetailsId.find(odId => odId === detail.id);
				if (isIn || !detail.id) {
					return newAcc;
				}
				newAcc.subtotal += detail.total;
				newAcc.newDetails.push(detail);
				return newAcc;
			},
			{ subtotal: 0, newDetails: [] },
		);
		const amountDiscount = customerDiscount > 0 ? subtotal * (customerDiscount / 100) : 0;
		return {
			id: order.id,
			discount: amountDiscount,
			subtotal,
			total: order.costShipping + (subtotal - amountDiscount),
			details: newDetails.map(detail => ({ id: detail.id })),
		};
	}

	/* Danger!!!, este método puede destrozar tu pedido. Usar con precaución */
	static updateOnly(orderDataToUpdateOnly) {
		return this.query().upsertGraph(orderDataToUpdateOnly, {
			noUpdate: ['details'],
			update: false,
		});
	}

	static async deleteItem({ order, orderDetailId, customerDiscount }, updateOrder = false) {
		const dataToUpdateOnly = this.recalculateTotal(order, [orderDetailId], { customerDiscount });
		if (updateOrder) {
			await this.updateOnly(dataToUpdateOnly);
		}
		return dataToUpdateOnly;
	}

	static getListGatewayTransaction(code, companyId, customerId) {
		const todayDate = moment().format('YYYY-MM-DD HH:mm:ss');
		const query = this.query()
			.select(this.defaultColumns())
			.join('com_gateway_transactions', 'com_gateway_transactions.order_id', `${this.tableName}.id`)
			.where('com_gateway_transactions.code_gateway', code)
			.whereRaw('com_gateway_transactions.date_transaction <= ?', todayDate)
			.whereRaw('com_gateway_transactions.date_expiration >= ?', todayDate)
			.where('com_gateway_transactions.status', 1)
			.where('com_gateway_transactions.payment_states', 1)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, customerId);
		return query;
	}

	static assignDeliveryOrder(id, deliveryId, companyId) {
		return this.query()
			.patch({ deliveryId })
			.where('id', id)
			.where('company_id', companyId)
			.whereNull('delivery_id');
	}

	static verifyDeliveryAssignment(deliveryId, id, companyId) {
		return this.query()
			.select(`${this.tableName}.id`)
			.innerJoin('com_orders_states', 'com_orders_states.id', `${this.tableName}.order_state_id`)
			.where((builder) => {
				builder
					.where(`${this.tableName}.delivery_id`, deliveryId)
					.where('com_orders_states.code', '!=', MsOrderStates.given);
			})
			.orWhere((builder) => {
				builder.where(`${this.tableName}.id`, id).whereNotNull(`${this.tableName}.delivery_id`);
			})
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getProductOrder(companyId) {
		return this.query()
			.select(raw('ANY_VALUE(product_id) as product_id, SUM(unit_quantity) as total, ANY_VALUE(name) as name, ANY_VALUE(slug) as slug, ANY_VALUE(settings) as settings'))
			.innerJoin('sal_orders_details', 'sal_orders_details.sal_order_id ', `${this.tableName}.id`)
			.innerJoin(
				'com_ecommerce_company',
				'com_ecommerce_company.id ',
				`${this.tableName}.commerce_id`,
			)
			.where(`${this.tableName}.company_id `, companyId)
			.groupBy('product_id')
			.orderBy('total', 'desc')
			.limit(20);
	}

	static exportExcelOrdersUbigeo({
		companyId,
		orderPickState,
		orderStateId,
		orderStateIds,
		wayPaymentId,
		subsidiaryId,
		warehouseId,
		customerId,
		employeeId,
		flagStatusOrder,
		syncStatus,
		bankAccountId,
		customerAddressId,
		paymentStateId,
		startDate,
		flagApproval,
		commerceId,
		deliveryId,
		originPlatform,
		terminalId,
		typeDocumentId,
		endDate,
		flagPickUp,
		warehouseIds,
	}) {
		const tdColumns = [
			'cadd.name as customerName',
			'cadd.phone as phoneCustomer',
			'cadd.document_number as customerDocument',
			'cadd.address_line_1 as addressCustomer',
			'cadd.reference as customerReference',
			'com.address as addressCommerce',
			'sal_orders.total as commercialValue',
			'gen1.name as nameCity',
			'gen2.name as nameParish',
			'gen3.name as nameProvince',
			'cadd.reference as customerAddressReference',
			'cadd.name as customerAddressName',
			'sal_orders.created_at as buyDate',
			'sal_orders.reference_external as referenceExternal',
		];
		const rawColumns = [
			raw('(CASE WHEN sal_orders.flag_pick_up = 1 THEN cadd.longitude ELSE 0 END)  as customerAddressLongitude'),
			raw('(CASE WHEN sal_orders.flag_pick_up = 1 THEN cadd.latitude ELSE 0 END)  as customerAddresslatitude'),
			raw('(CASE WHEN sal_orders.flag_pick_up = 1 THEN cadd.location ELSE 0 END)  as customerAddresslocation'),
			raw('(CASE WHEN JSON_EXTRACT(salDet.product, "$.weigth") THEN JSON_EXTRACT(salDet.product, "$.weigth") ELSE 0.1 END)  as weight'),
			raw('JSON_EXTRACT(com.ubigeo_data, "$.city.name") as cityNameCommerce'),
			raw('JSON_EXTRACT(com.ubigeo_data, "$.parish.name") as parishNameCommerce'),
			raw('JSON_EXTRACT(com.ubigeo_data, "$.province.name") as provinceNameCommerce'),
			raw('JSON_EXTRACT(com.contact_data, "$.name") as nameCommerce'),
			raw('JSON_EXTRACT(com.contact_data, "$.lastname") as lastNameCommerce'),
			raw('JSON_EXTRACT(com.contact_data, "$.phone") as phoneCommerce'),
			raw('SUM(salDet.quantity) as quantity'),
			raw('GROUP_CONCAT(salDet.product_name) as products'),
		];
		const columns = tdColumns.concat(rawColumns);
		const query = this.query()
			.select(columns)
			.join('com_ecommerce_company as com', 'com.id', `${this.tableName}.commerce_id`)
			.join('com_customers_address as cadd', 'cadd.id', `${this.tableName}.customer_address_id`)
			.leftJoin('com_general as gen1', 'gen1.id', 'cadd.province_id')
			.leftJoin('com_general as gen2', 'gen2.id', 'cadd.parish_id')
			.leftJoin('com_general as gen3', 'gen3.id', 'cadd.city_id')
			.join('sal_orders_details as salDet', 'salDet.sal_order_id', 'sal_orders.id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.flag_pick_up`, flagPickUp)
			.skipUndefined()
			.where(`${this.tableName}.order_pick_state`, orderPickState)
			.skipUndefined()
			.where(`${this.tableName}.order_state_id`, orderStateId)
			.skipUndefined()
			.where(`${this.tableName}.way_payment_id`, wayPaymentId)
			.skipUndefined()
			.where(`${this.tableName}.employee_id`, employeeId)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.warehouse_id`, warehouseId)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, customerId)
			.skipUndefined()
			.where(`${this.tableName}.flag_status_order`, flagStatusOrder)
			.skipUndefined()
			.where(`${this.tableName}.sync_status`, syncStatus)
			.skipUndefined()
			.where(`${this.tableName}.bank_account_id`, bankAccountId)
			.skipUndefined()
			.where(`${this.tableName}.payment_state_id`, paymentStateId)
			.skipUndefined()
			.where(`${this.tableName}.flag_approval`, flagApproval)
			.skipUndefined()
			.where(`${this.tableName}.commerce_id`, commerceId)
			.skipUndefined()
			.where(`${this.tableName}.delivery_id`, deliveryId)
			.skipUndefined()
			.where(`${this.tableName}.origin_platform`, originPlatform)
			.skipUndefined()
			.where(`${this.tableName}.terminal_id`, terminalId)
			.skipUndefined()
			.where(`${this.tableName}.type_document_id`, typeDocumentId)
			.skipUndefined()
			.where(`${this.tableName}.customer_addressId`, customerAddressId)
			.skipUndefined()
			.where(`${this.tableName}.flag_pick_up`, flagPickUp)
			.groupBy(`${this.tableName}.id`);

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}
		if (warehouseIds) {
			query.whereIn(`${this.tableName}.warehouse_id`, warehouseIds);
		}
		if (orderStateIds && orderStateIds.length > 0) {
			query.whereIn(`${this.tableName}.warehouse_id`, warehouseIds);
		}
		return query;
	}

	static moveToKardexExternal({ referenceExternal, orderStateToUpdate, flagInvolveStock }) {
		const typeOriginOrder = Object.values(TypeOriginOrder);
		return (
			isDevOrProd() &&
			typeOriginOrder.find(it => it === referenceExternal) &&
			!flagInvolveStock &&
			orderStateToUpdate.code === 'CONFIRMED'
		);
	}

	static moveToKardex({ codeApp, flagInvolveStock, orderStateToUpdate }) {
		const allowedApps = ['be_seller', 'ECOMMERCE', 'quipusales', 'shopify'];
		return (
			isDevOrProd() &&
			allowedApps.find(it => it === codeApp) &&
			!flagInvolveStock &&
			orderStateToUpdate.code === 'CONFIRMED'
		);
	}

	static getOrderBasic(id, companyId, fields = ['id', 'additional_info'], flagSale = undefined) {
		return this.query()
			.select(fields)
			.where('id', id)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('flag_sale', flagSale)
			.first();
	}

	static orderStateRaw(orderStateCode) {
		return raw('(SELECT id FROM com_orders_states WHERE code = ? LIMIT 1)', [orderStateCode]);
	}

	static deliveryStateRaw(deliveryState = '', collectData) {
		const values = [deliveryState];
		let upd;
		if (!isNullOrUndefined(collectData)) {
			upd = 'CAST(? as JSON)';
			values.push(collectData);
		} else {
			upd = 'JSON_OBJECT()';
		}
		return raw(
			`JSON_SET(IFNULL(additional_info, "{}"), "$.deliveryState", ?, "$.collectData", ${upd})`,
			values,
		);
	}

	static getAllBasic(companyId, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.whereIn('id', filter.orderIds)
			.skipUndefined()
			.where('flag_sale', filter.flagSale);
		if (filter.onlyAssginedDelivery) {
			query
				.innerJoin('com_orders_states', 'com_orders_states.id', `${this.tableName}.order_state_id`)
				.where('com_orders_states.code', '!=', given)
				.where(`${this.tableName}.delivery_id`, filter.onlyAssginedDelivery);
		}
		if (filter.relationAdd) {
			const eagers = this.validEagers(filter);
			query.eager(eagers);
		}
		return query;
	}

	static customerAssignedAlready(customerId, companyId) {
		return this.query()
			.select('id')
			.where('customer_id', customerId)
			.where('company_id', companyId)
			.first();
	}

	static editOrderPaymentState(id, paymentStateId, companyId) {
		return this.query()
			.patch({ paymentStateId })
			.where('id', id)
			.where('company_id', companyId);
	}

	static updateFlagSale(id, companyId, data = { flagSale: 1 }) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static updateDelivery(ids, deliveryId, companyId, extraData) {
		let dataToUpdate = { deliveryId };
		if (extraData) {
			dataToUpdate = { ...extraData, deliveryId };
		}
		return this.query()
			.patch(dataToUpdate)
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static updateOrderInfo(
		id,
		companyId,
		{
			deliveryId, orderStateCode, deliveryState, paymentStateId, flagPickUp, collectData,
		},
		deliveryIdQuery,
	) {
		const dataToUpdate = {};

		if (deliveryId) {
			dataToUpdate.deliveryId = deliveryId;
		}
		if (orderStateCode) {
			dataToUpdate.orderStateId = this.orderStateRaw(orderStateCode);
		}

		if (deliveryState) {
			dataToUpdate.additionalInfo = this.deliveryStateRaw(deliveryState, collectData);
		}

		if (paymentStateId) {
			dataToUpdate.paymentStateId = paymentStateId;
		}
		if (flagPickUp) {
			dataToUpdate.flagPickUp = flagPickUp;
		}
		if (Object.keys(dataToUpdate).length === 0) {
			return 0;
		}
		return this.query()
			.patch(dataToUpdate)
			.where('id', id)
			.skipUndefined()
			.where('delivery_id', deliveryIdQuery)
			.where('company_id', companyId);
	}

	static freeOrdersByRoute(routeId, companyId, orderStateCode, deliveryState, typeRouter = 2) {
		const stateRaw = this.orderStateRaw(orderStateCode);
		const deliveryRaw = this.deliveryStateRaw(deliveryState);
		const dataToUpdate = {
			orderStateId: stateRaw,
			additionalInfo: deliveryRaw,
			orderPickState: registered,
			deliveryId: null,
			routeId: null,
			routeName: null,
			flagPickUp: home,
		};
		const query = this.query()
			.patch(dataToUpdate)
			.where('company_id', companyId);
		if (typeRouter === 1) {
			query.where('route_id', routeId);
		} else {
			query.where('route_id_pick_up', routeId);
		}
		return query;
	}

	static getTotalAmount(id, companyId, filter = {}) {
		const query = this.query()
			.select([
				raw('sum(sal_orders.cost_shipping) as totalCostShipping'),
				raw('sum(sal_orders.total) as totalOrder'),
				raw('sum(sal_orders.amount_collect_driver) as totalBalance'),
			])
			.first();
		query.where(`${this.tableName}.commerce_id`, id);
		query.where(`${this.tableName}.company_id`, companyId);
		// if (filter.liquidDate) {
		// 	query.where('liquid_date', filter.liquidDate);
		// 	incluir con tabla de cabecera
		// }
		// if (filter.liquidStatus) {
		// 	query.where('liquidation_status_commerce', filter.liquidStatus);
		// }
		if (filter.typeOrder) {
			query.where('type_order', filter.typeOrder);
		}
		return query;
	}

	static getTotalOrders(companyId, filter = {}) {
		let query = this.query().select([
			raw('sum(IFNULL(sal_orders.cost_shipping,0)) as totalCostShipping'),
			raw('sum(IFNULL(sal_orders.total,0)) as totalOrder'),
			raw('sum(IFNULL(sal_orders.amount_collect_driver,0) - IFNULL(sal_orders.cost_shipping,0)) as totalBalance'),
			raw('sum(IFNULL(sal_orders.amount_collect_driver,0)) as totalAmountCollectDriver'),
			'type_order',
		]);
		query.where(`${this.tableName}.company_id`, companyId);
		query = this.filterLiquidations(query, filter);
		query.groupBy(`${this.tableName}.type_order`);
		return query;
	}

	static filterLiquidations(query, filter = {}) {
		const columnRef = filter.delivery ? 'liquidation_id_delivery' : 'liquidation_id_commerce';
		query
			.innerJoin('com_ecommerce_company as com', 'com.id', `${this.tableName}.commerce_id`)
			.innerJoin('com_delivery as delivery', 'delivery.id', `${this.tableName}.delivery_id`)
			.innerJoin('com_customers as cus', 'cus.id', `${this.tableName}.customer_id`);
		if (isNullOrUndefined(filter)) {
			query.whereNull(`${this.tableName}.${columnRef}`);
		}
		if (filter.liquidStatus && filter.liquidStatus !== 1) {
			query
				.innerJoin('com_liquidations as liq', 'liq.id', `${this.tableName}.${columnRef}`)
				.innerJoin('liquidation_status as liqSt', 'liqSt.id', 'liq.liquid_status_id')
				.where('liq.liquid_status_id', filter.liquidStatus);
		} else {
			query
				.leftJoin('com_liquidations as liq', 'liq.id', `${this.tableName}.${columnRef}`)
				.leftJoin('liquidation_status as liqSt', 'liqSt.id', 'liq.liquid_status_id');
			if (filter.liquidStatus === 1) {
				query.whereNull(`${this.tableName}.${columnRef}`);
			}
		}
		if (filter.liquidDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(liq.operation_date, "+05:00", "+00:00")) = ?',
				filter.liquidDate,
			);
		}
		if (filter.typeOrder) {
			query.where(`${this.tableName}.type_order`, filter.typeOrder);
		}
		if (filter.delivery && !isNullOrUndefined(filter.deliveryId)) {
			query
				.where(`${this.tableName}.delivery_id`, filter.deliveryId)
				.skipUndefined()
				.where(`${this.tableName}.order_state_id`, '<>', 4);
		} else if (filter.deliveryId) {
			query.where(`${this.tableName}.delivery_id`, filter.deliveryId);
		}
		if (filter.commerceId) {
			query.where('com.id', filter.commerceId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.paymentState) {
			query.where(`${this.tableName}.payment_state_id`, filter.paymentState);
		}
		return query;
	}

	static getLiquidations(companyId, filter = {}) {
		const joinCollumns = [
			'com.id as CommerceId',
			'com.name as CommerceName',
			'cus.name as CustomerName',
		];
		const orderColumns = [
			`${this.tableName}.id as orderId`,
			'type_order',
			'subtotal',
			`${this.tableName}.document_number as orderNumber`,
			`${this.tableName}.delivery_id as deliveryId`,
			'cost_shipping',
			'total',
			'amount_collect_driver',
			'delivery_date',
			'payment_state_id as paymentState',
			`${this.tableName}.created_at`,
			`${this.tableName}.way_payment_detail_code as wayPayment`,
			'liq.liquid_status_id as liquidStatusId',
			'liqSt.code as liqCode',
			'additional_info',
		];
		const allColumns = joinCollumns.concat(orderColumns);
		let query = this.query()
			.select(allColumns)
			.select(raw("CONCAT(delivery.name,' ',delivery.lastname )  as deliveryName"));
		query.where(`${this.tableName}.company_id`, companyId);
		query = this.filterLiquidations(query, filter);
		query = this.includePaginationAndSort(query, filter);
		query.orderBy(`${this.tableName}.created_at`, 'DESC');
		return query;
	}

	static structureLiquidations(dataLiquidations, freeCourierSettings = {}, filters = {}) {
		const stateOrder = {
			1: 'Delivery',
			2: 'Courier',
			3: 'Libre',
		};
		const percentageOrder = {
			1: ((freeCourierSettings && freeCourierSettings.deliveryOrderPercentage) || 0) / 100,
			2: ((freeCourierSettings && freeCourierSettings.courierOrderPercentage) || 0) / 100,
			3: ((freeCourierSettings && freeCourierSettings.freeOrderPercentage) || 0) / 100,
		};
		const finalLiquidations = dataLiquidations.map((order) => {
			const newOrder = { ...order };
			const {
				additionalInfo,
				flagMoneyTakenDriver,
				wayPayment = {},
				wayPaymentDetailCode = '',
			} = order;
			const { includeShipping } = additionalInfo || {};
			if (!isNullOrUndefined(wayPayment.name) && wayPayment.name === 'mercadopago') {
				newOrder.wayPayment = 'MP';
			} else if (!isNullOrUndefined(wayPayment.name)) {
				newOrder.wayPayment = `${wayPayment.name.substring(0, 4)}.` || '';
			} else if (!isNullOrUndefined(wayPaymentDetailCode)) {
				newOrder.wayPayment = `${wayPaymentDetailCode.substring(0, 4)}.` || '';
			}
			if (
				(!isNullOrUndefined(includeShipping) && !includeShipping) ||
				(!isNullOrUndefined(flagMoneyTakenDriver) && !flagMoneyTakenDriver)
			) {
				newOrder.deliveryCharge = 'SC';
			} else {
				newOrder.deliveryCharge = 'C';
			}
			const totalCommission = order.costShipping * percentageOrder[order.typeOrder];
			newOrder.commission = roundFixedToNumber(totalCommission);
			newOrder.costDriver = newOrder.commission;
			if (!isNullOrUndefined(filters.delivery) && filters.delivery) {
				newOrder.amountCollectDriver = order.total || 0;
				const { collectData } = additionalInfo || {};
				const { typePayment = '' } = collectData || {};
				if (typePayment !== 'EFECTIVO') {
					newOrder.amountCollectDriver = 0;
					newOrder.wayPayment = `${typePayment.substring(0, 4)}.` || '';
				}
				newOrder.balance = roundFixedToNumber(newOrder.commission - newOrder.amountCollectDriver);
			} else {
				newOrder.balance = roundFixedToNumber(order.amountCollectDriver - order.costShipping);
			}
			if (order.liqCode) {
				newOrder.liquidStatus = isNullOrUndefined(liquidStatus[order.liqCode])
					? liquidStatus.NO_LIQUID
					: liquidStatus[order.liqCode];
			}
			newOrder.typeOrder = stateOrder[order.typeOrder];
			return newOrder;
		});

		return finalLiquidations;
	}

	static structureOrderExcel(orders) {
		const finalOrders = orders.map((order) => {
			const newOrder = { ...order };
			const {
				additionalInfo,
				flagMoneyTakenDriver,
				wayPayment = {},
				wayPaymentDetailCode = '',
			} = order;
			const { includeShipping } = additionalInfo || {};
			if (!isNullOrUndefined(wayPayment.name) && wayPayment.name === 'mercadopago') {
				newOrder.wayPayment = 'MP';
			} else if (!isNullOrUndefined(wayPayment.name)) {
				newOrder.wayPayment = `${wayPayment.name.substring(0, 4)}.` || '';
			} else if (!isNullOrUndefined(wayPaymentDetailCode)) {
				newOrder.wayPayment = `${wayPaymentDetailCode.substring(0, 4)}.` || '';
			}
			if (
				(!isNullOrUndefined(includeShipping) && !includeShipping) ||
				(!isNullOrUndefined(flagMoneyTakenDriver) && !flagMoneyTakenDriver)
			) {
				newOrder.deliveryCharge = 'SC';
			} else {
				newOrder.deliveryCharge = 'C';
			}
			if (newOrder.orderStateId === 3) {
				const { collectData } = additionalInfo || {};
				if (!isNullOrUndefined(wayPaymentDetailCode)) {
					newOrder.wayPayment = `${wayPaymentDetailCode.substring(0, 4)}.` || '';
				} else if (collectData && collectData.typePayment === 'EFECTIVO') {
					newOrder.amountCollectDriver = order.total || 0;
					newOrder.wayPayment = `${collectData.typePayment.substring(0, 4)}.` || '';
				}
			}
			if (!isNullOrUndefined(newOrder.deliveryJson)) {
				const { deliveryPoint, pickUpPoint } = newOrder.deliveryJson || {};
				newOrder.destinyAddress = deliveryPoint.addressLine || '';
				newOrder.contactDestiny = deliveryPoint.contact || '';
				newOrder.originAddress = pickUpPoint.addressLine || '';
				newOrder.contactOrigin = pickUpPoint.contact || '';
			}
			return newOrder;
		});

		return finalOrders;
	}

	static srtuctureByTypeOrder(order, typeOrder, data) {
		const { deliveryJson, additionalInfo = {} } = order;
		const keyToUpdate = typeOrder === delivery ? 'deliveryAddress' : 'deliveryJson';
		let finalData = {};
		if (!isNullOrUndefined(deliveryJson)) {
			const deliveryPoint = deliveryJson.deliveryPoint || {};
			deliveryJson.deliveryPoint = Object.assign(deliveryPoint, {
				latitude: data.latitude || deliveryPoint.latitude,
				addressLine: data.address || deliveryPoint.addressLine,
				longitude: data.longitude || deliveryPoint.longitude,
				contactNumber: data.contactNumber || deliveryPoint.contactNumber,
			});
		}
		if (typeOrder === delivery) {
			finalData = {
				[keyToUpdate]: Object.assign(order[`${keyToUpdate}`] || {}, {
					latitude:
						data.latitude || (order[`${keyToUpdate}`] && order[`${keyToUpdate}`].latitude) || 0.0,
					longitude:
						data.longitude || (order[`${keyToUpdate}`] && order[`${keyToUpdate}`].longitude) || 0.0,
					isFavorite: (order[`${keyToUpdate}`] && order[`${keyToUpdate}`].isFavorite) || false,
					addressLine1:
						data.address || (order[`${keyToUpdate}`] && order[`${keyToUpdate}`].addressLine1) || '',
				}),
				comments: data.comments,
			};
			if (!isNullOrUndefined(order.customerAddressId)) {
				Object.assign(finalData, {
					customerAddressId: order.customerAddressId,
					customerId: order.customerId,
				});
			}
		} else if (typeOrder === courier || typeOrder === freeCourier) {
			finalData = {
				[keyToUpdate]: Object.assign(order[`${keyToUpdate}`] || {}, {}),
				comments: data.comments,
			};
		}
		if (!isNullOrUndefined(additionalInfo)) {
			if ('customerComment' in additionalInfo) {
				Object.assign(additionalInfo, { customerComment: data.comments || '' });
			}
		} else {
			finalData.additionalInfo = { customerComment: data.comments || '' };
		}

		return finalData;
	}

	static async createMultipleOriginal(data, updateSeries = []) {
		const response = data.map((i) => {
			const newItem = { ...i };
			if (newItem.latitude && newItem.longitude) {
				const point = `"POINT(${newItem.latitude} ${newItem.longitude})"`;
				newItem.locationOrigin = this.raw(`GeomFromText(${point})`);
			}
			delete newItem.latitude;
			delete newItem.longitude;
			return newItem;
		});
		if (updateSeries.length > 0) {
			updateSeries.map(i => ({ id: i.id, number: raw('number+??', [i.number || 0]) }));
			await Series.updateMultiple(updateSeries);
		}
		return this.query().insertGraph(response);
	}

	static getByReferenceExternal(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('reference_external', code)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static getPriceDetail(price, discount, unitPrice, quantity) {
		const discountUnit = discount / quantity;
		const discountPercentage = (discount * 100) / (price * quantity);
		const newDiscount = unitPrice * (discountPercentage / 100);
		const newPrice = price - discountUnit;
		return {
			discountUnit,
			price: newPrice,
			discount: newDiscount * quantity,
			discountPercentage,
		};
	}

	static getByStatus(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('flag_status_order', 3)
			.where('company_id', companyId)
			.first();
	}

	static totalAmountForRoute(routeId, companyId) {
		return this.query()
			.select([
				raw('sum(or.quantity) as totalQuantity'),
				raw('sum(sal_orders.distance) as totalDistance'),
				raw('sum(or.total) as totalAmount'),
			])
			.join('sal_orders_details as or', 'or.sal_order_id', `${this.tableName}.id`)
			.where('sal_orders.route_id', routeId)
			.where('or.company_id', companyId)
			.first();
	}

	static generateRawCasePaymentStatus() {
		let caseSql = 'CASE WHEN document_sale.payment_state = 1 THEN "Pendiente"';
		caseSql += ' WHEN document_sale.payment_state = 2 THEN "Parcial"';
		caseSql += 'ELSE "Pagado" END as statusPaymentName';
		return caseSql;
	}

	static generateRawCaseTaxStatus() {
		let caseSql = 'CASE WHEN document_sale.status_tax = 1 THEN "Sin Enviar"';
		caseSql += ' WHEN document_sale.status_tax = 2 THEN "En Proceso"';
		caseSql += ' WHEN document_sale.status_tax = 3 THEN "Validado"';
		caseSql += ' WHEN document_sale.status_tax = 4 THEN "Error"';
		caseSql += ' WHEN document_sale.status_tax = 5 THEN "Firmado"';
		caseSql += ' ELSE "Error Al Firmar" END as statusTaxName';
		return caseSql;
	}

	static generateRawCaseCustomer(countryCode = peru) {
		const rucTypePerson = countryCode === peru ? 2 : 7;
		let caseSql = `CASE WHEN c.flag_type_person != ${rucTypePerson} THEN CONCAT(c.name, " ", c.lastname)`;
		caseSql += ` WHEN c.flag_type_person = ${rucTypePerson} THEN c.rz_social`;
		caseSql += ' ELSE "-" END as customer_name,';
		caseSql += ` CASE WHEN c.flag_type_person != ${rucTypePerson} THEN c.dni`;
		caseSql += ` WHEN c.flag_type_person = ${rucTypePerson} THEN c.ruc`;
		caseSql += ' ELSE "-" END as customer_document_number';
		return caseSql;
	}

	static exportExcel({
		companyId,
		warehouseIds,
		salStatesId,
		salTypeDocumentId,
		paymentState,
		employeeId,
		startDate,
		routeId,
		pending = false,
		statusTax,
		statusTaxSri,
		endDate,
		typeOrder,
		typeDocumentIds,
		accountReceivable,
		countryCode = peru,
		customerId,
		documentTypesNot,
		currency,
		currencies,
	}) {
		const saleTable = 'sal_documents';
		const commerceTable = 'com_ecommerce_company';
		const aliasCommerce = 'commerce';
		const aliasSale = 'document_sale';
		const tableOrState = 'com_orders_states';
		const aliasOrState = 'orderState';
		const salesColumns = [
			'document_number',
			'commentary',
			'currency',
			'warehouse_name',
			'user_id',
			'type_payment_codes',
			'discount',
			'tip',
		].map(c => `${aliasSale}.${c}`);
		const subColumns = ['s.rz_social as sucursalName'];
		const terminalColumns = ['t.name as terminalName'];
		const tdColumns = ['td.name as typeDocumentName'];
		const stColumns = ['st.name as dispatchStatusName'];
		const comColumns = ['commerce.name as commerceName'];
		const orStateColumns = ['orderState.name as orderStateName'];
		const deliveryColumns = ['delivery.name as deliveryName'];
		const ptColumns = ['p.name as paymentName'];
		const customerColumns = [
			'msp.email AS customerEmail',
			'c.address AS customerAddress',
			'msp.fullname as customerName',
		];

		const rawRelatedDocumentsNumber =
			countryCode === peru
				? raw('CASE WHEN td.code_taxes = "07" THEN (CASE WHEN document_sale.sal_type_document_id = 1 THEN CONCAT("BB", document_sale.document_number) ELSE CONCAT("FF", document_sale.document_number) END) ELSE "" END as relatedDocumentsNumber')
				: raw('CASE WHEN td.code_taxes = "04" THEN document_sale.document_number ELSE "" END AS relatedDocumentsNumber');

		const rawColumns = [
			raw(this.generateRawCasePaymentStatus()),
			raw(this.generateRawCaseTaxStatus()),
			raw(`DATE_FORMAT(CONVERT_TZ(${aliasSale}.created_at, "+05:00", "+00:00"),'%Y-%m-%d') as date`),
			raw(`TIME(CONVERT_TZ(${aliasSale}.created_at, "+05:00", "+00:00")) as time`),
			raw(`CASE WHEN st.name = "ANULADO" THEN 0 ELSE ${aliasSale}.due_amount END as debtAmount`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${aliasSale}.amount WHEN td.name = "NOTA DE CREDITO" THEN (${aliasSale}.amount * -1) ELSE ${aliasSale}.amount END as amount`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${aliasSale}.taxes WHEN td.name = "NOTA DE CREDITO" THEN (${aliasSale}.taxes * -1) ELSE ${aliasSale}.taxes END as taxes`),
			raw(`CASE WHEN st.name = "ANULADO" THEN ${aliasSale}.subtotal WHEN td.name = "NOTA DE CREDITO" THEN (${aliasSale}.subtotal * -1) ELSE ${aliasSale}.subtotal END as subtotal`),
			raw('CONCAT(emp.name, " ", emp.lastname) AS employeeName'),
			rawRelatedDocumentsNumber,
			raw(this.generateRawCaseCustomer(countryCode)),
		];
		const columns = salesColumns.concat(
			subColumns,
			terminalColumns,
			tdColumns,
			stColumns,
			deliveryColumns,
			comColumns,
			ptColumns,
			orStateColumns,
			rawColumns,
			customerColumns,
		);
		const query = this.query().select(columns);
		if (!isNullOrUndefined(routeId)) {
			query
				.innerJoin(`${saleTable} as ${aliasSale}`, `${this.tableName}.id`, `${aliasSale}.order_id`)
				.where(`${this.tableName}.route_id`, routeId);
			if (pending) {
				query.where(`${aliasSale}.payment_state`, 1);
			}
		} else {
			query.leftJoin(
				`${saleTable} as ${aliasSale}`,
				`${aliasSale}.id`,
				`${aliasSale}.sal_documents_id`,
			);
		}
		if (!isNullOrUndefined(typeOrder)) {
			query
				.innerJoin(
					`${commerceTable} as ${aliasCommerce}`,
					`${this.tableName}.id`,
					`${aliasCommerce}.commerce_id`,
				)
				.where(`${this.tableName}.type_order`, typeOrder);
		}
		query
			.innerJoin('com_subsidiaries as s', 's.id', `${aliasSale}.com_subsidiary_id`)
			.innerJoin('sal_terminals as t', 't.id', `${aliasSale}.terminal_id`)
			.innerJoin('com_ms_type_documents as td', 'td.id', `${aliasSale}.sal_type_document_id`)
			.innerJoin('sal_sales_states as st', 'st.id', `${aliasSale}.sal_states_id`)
			.innerJoin('com_customers as c', 'c.id', `${aliasSale}.customer_id`)
			.innerJoin('ms_person as msp', 'msp.id', 'c.person_id')
			.innerJoin(
				`${tableOrState} as ${aliasOrState}`,
				`${aliasOrState}.id`,
				`${this.tableName}.order_state_id`,
			)
			.innerJoin('com_delivery as delivery', 'com_delivery.id', `${this.tableName}.delivery_id`)
			.leftJoin('com_employee as emp', 'emp.id', `${aliasSale}.com_employee_id`)
			.leftJoin('sal_method_payments as p', 'p.id', `${aliasSale}.payment_method_id`)
			.where(`${aliasSale}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${aliasSale}.sal_states_id`, salStatesId)
			.skipUndefined()
			.where(`${aliasSale}.sal_type_document_id`, salTypeDocumentId)
			.skipUndefined()
			.where(`${aliasSale}.payment_state`, paymentState)
			.skipUndefined()
			.where(`${aliasSale}.com_employee_id`, employeeId)
			.skipUndefined()
			.where(`${aliasSale}.status_tax`, statusTax)
			.skipUndefined()
			.where(`${aliasSale}.status_tax_sri`, statusTaxSri)
			.skipUndefined()
			.where(`${aliasSale}.customer_id`, customerId)
			.skipUndefined()
			.where(`${aliasSale}.currency`, currency)
			.skipUndefined()
			.where(`${this.tableName}.type_order`, typeOrder);

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn(`${aliasSale}.warehouse_id`, warehouseIds);
		}

		if (documentTypesNot) {
			query.where('td.code', '!=', documentTypesNot);
		}
		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${aliasSale}.sal_type_document_id`, typeDocumentIds);
		}
		if (accountReceivable) {
			query.where(raw(`${aliasSale}.due_amount < ${aliasSale}.amount`));
		}

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${aliasSale}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(`DATE(CONVERT_TZ(${aliasSale}.created_at, "+05:00", "+00:00")) <= ?`, endDate);
		}
		if (currencies) {
			const currenciesKeys = Object.keys(currencies);
			query.whereIn(`${aliasSale}.currency`, `${currenciesKeys}`.split(','));
		}
		return query;
	}
}
module.exports = SalOrders;
