/* eslint-disable no-param-reassign */

'use strict';

const { transaction, Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComRoutesSellers = require('./ComRoutesSellers');
const ComRouteCheckIn = require('./ComRouteCheckIn');
const ComRouteHistory = require('./ComRouteHistory');
const RemissionGuide = require('./RemissionGuide');
const Order = require('./SalOrders');
const General = require('./General');
const Serie = require('./SalSeries');
const RouteStatus = require('./enums/route-status-enum');
const { customer } = require('./enums/type-route-enum');
const { inProgress } = require('./enums/order-pick-state-enum');
const CountryCode = require('./CountryCode');
const { typeDistributorRoute } = require('./TypeGeneral');
const PickUp = require('./PickUp');
const { pending } = require('../models/PaymentState');
const { assigned, readyToDeliver } = require('./enums/type-ms-order-states');
const { accepted, notAssigned } = require('./enums/order-delivery-state-enum');
const { pickUp } = require('./enums/flag-pick-up-ship');
const { isNullOrUndefined } = require('../shared/helper');

class ComRouters extends baseModel {
	static get tableName() {
		return 'com_routers';
	}

	static get relationMappings() {
		return {
			zonesCustomers: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComZonesCustomers.js`,
				filter: query => query.where('com_routes_customers.flag_active', 1),
				join: {
					from: 'com_routers.id',
					through: {
						modelClass: `${__dirname}/ComRoutesSellers.js`,
						from: 'com_routes_customers.route_id',
						to: 'com_routes_customers.zone_customer_id',
					},
					to: 'com_zones_customers.id',
				},
			},
			typeDeliveryRoute: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_routers.type_delivery_route_id',
					to: 'com_general.id',
				},
			},
			responsibleUser: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Courier.js`,
				join: {
					from: 'com_routers.responsible_user_id',
					to: 'com_courier.id',
				},
			},
			orders: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_routers.id',
					to: 'sal_orders.route_id',
				},
			},
			ordersPickUp: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_routers.id',
					to: 'sal_orders.route_id_pick_up',
				},
			},
			vehicle: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComVehicles.js`,
				join: {
					from: 'com_routers.vehicle_id',
					to: 'com_vehicles.id',
				},
			},
			distributorType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: query => query.where('com_general.type_general_id', typeDistributorRoute),
				join: {
					from: 'com_routers.type_distributor',
					to: 'com_general.number',
				},
			},
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_routers.company_id',
					to: 'com_companies.id',
				},
			},
			routeToday: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComRouteHistory.js`,
				join: {
					from: 'com_routers.id',
					to: 'com_route_history.route_id',
				},
			},
			zone: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComZones.js`,
				join: {
					from: 'com_routers.zone_id',
					to: 'com_zones.id',
				},
			},
			delivery: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Delivery.js`,
				join: {
					from: 'com_routers.delivery_id',
					to: 'com_delivery.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name', 'company_id'],
			properties: {
				images: {
					type: 'array',
					default: [],
				},
				name: {
					type: ['string', 'null'],
				},
				definition: {
					type: ['string', 'null'],
				},
				color: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				location: {
					type: ['string', 'null'],
				},
				dateStart: {
					type: 'date',
				},
				dateEnd: {
					type: 'date',
				},
				dates: {
					type: ['array', 'null'],
					default: [],
				},
				status: {
					type: 'integer',
				},
				frequency: {
					type: ['integer', 'null'],
				},
				distance: {
					type: 'number',
				},
				zoneId: {
					type: ['integer', 'null'],
				},
				sellersId: {
					type: ['array', 'null'],
					default: [],
				},
				days: {
					type: ['array', 'null'],
					default: [],
				},
				totalCustomersAssigned: {
					type: 'integer',
				},
				typeDeliveryRouteId: {
					type: ['integer', 'null'],
				},
				responsibleUserId: {
					type: ['integer', 'null'],
				},
				typeRoute: {
					type: ['integer', 'null'],
					default: customer,
				},
				code: {
					type: ['string', 'null'],
				},
				vehicleId: {
					type: ['integer', 'null'],
				},
				typeDistributor: {
					type: ['integer', 'null'],
					default: 1,
				},
				codeExternal: {
					type: ['string', 'null'],
				},
				entityStateId: {
					type: ['integer', 'null'],
					default: 1,
				},
				flagPickUpShip: {
					type: ['integer', 'null'],
				},
				deliveryId: {
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
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static get virtualAttributes() {
		return [
			'fullnameSeller',
			'statusName',
			'totalOrders',
			'totalAmountOrders',
			'totalItems',
			'totalAmountProduct',
			'totalProducts',
			'currencySymbol',
			'dateRoute',
			'formatNumbers',
		];
	}

	get dateRoute() {
		return helper.localDate(this.dateStart, 'YYYY-MM-DD');
	}

	get fullnameSeller() {
		let fullnames = '';
		let size = 0;
		if (this.zonesCustomers && this.zonesCustomers.length > 0) {
			size = this.zonesCustomers.length;
			this.zonesCustomers.forEach((item, i) => {
				if (item.seller && item.seller.fullname) {
					if (i < size - 1) {
						fullnames += `${item.seller.fullname}, `;
					} else {
						fullnames += item.seller.fullname;
					}
				}
			});
		}
		return fullnames;
	}

	get statusName() {
		let name = '';
		switch (this.status) {
		case RouteStatus.pending:
			name = 'Pendiente';
			break;
		case RouteStatus.initiated:
			name = 'Iniciado';
			break;
		case RouteStatus.finalized:
			name = 'Finalizado';
			break;
		default:
			break;
		}
		return name;
	}

	get totalOrders() {
		if (this.flagPickUpShip === pickUp) {
			return this.ordersPickUp ? this.ordersPickUp.length : 0;
		}
		return this.orders ? this.orders.length : 0;
	}

	get totalAmountOrders() {
		let totalAmountOrders = 0;
		const ordersFound = this.flagPickUpShip === pickUp ? this.ordersPickUp : this.orders;
		if (ordersFound && Array.isArray(ordersFound)) {
			totalAmountOrders = ordersFound.reduce((acum, item) => acum + item.total, 0);
		}
		return totalAmountOrders;
	}
	get totalAmountProduct() {
		let newProducts = 0;
		const ordersFound = this.flagPickUpShip === pickUp ? this.ordersPickUp : this.orders;
		if (ordersFound && ordersFound.length > 0) {
			newProducts = ordersFound.reduce((acum, item) => {
				let newAcum = acum;
				if (item.details && item.details.length > 0) {
					item.details.forEach((d) => {
						newAcum += d.total;
					});
				}
				return newAcum;
			}, 0);
		}
		return newProducts;
	}

	get totalProducts() {
		let dataTotal;
		const ordersFound = this.flagPickUpShip === pickUp ? this.ordersPickUp : this.orders;
		if (Array.isArray(ordersFound) && ordersFound.length > 0) {
			dataTotal = ordersFound.reduce(
				(acum, item) => (item.details && item.details.length > 0 ? acum + item.details.length : 0),
				0,
			);
		}
		return dataTotal;
	}

	get currencySymbol() {
		let name;
		const countryCode =
			this.company && this.company.country ? this.company.country.countryCode : CountryCode.ecuador;
		switch (countryCode) {
		case CountryCode.peru:
			name = 'S/';
			break;
		case CountryCode.ecuador:
			name = '$';
			break;
		default:
			break;
		}
		return name;
	}

	get formatNumbers() {
		let totalAmountOrders = 0;
		const ordersFound = this.flagPickUpShip === pickUp ? this.ordersPickUp : this.orders;
		if (ordersFound && Array.isArray(ordersFound)) {
			totalAmountOrders = ordersFound.reduce((acum, item) => acum + item.total, 0);
		}
		return {
			totalAmount: totalAmountOrders ? totalAmountOrders.toFixed(2) : '0.00',
		};
	}

	static defaultColumns() {
		return [
			'id',
			'name',
			'images',
			'definition',
			'description',
			'location',
			'color',
			'frequency',
			'days',
			'distance',
			'zone_id',
			'sellers_id',
			'company_id',
			'subsidiary_id',
			'date_start',
			'date_end',
			'dates',
			'status',
			'total_customers_assigned',
			'type_delivery_route_id',
			'responsible_user_id',
			'created_at',
			'code',
			'vehicle_id',
			'type_distributor',
			'code_external',
			'entity_state_id',
			'hour',
			'flag_pick_up_ship',
			'delivery_id',
		].map(c => `${this.tableName}.${c}`);
	}

	static basicColumns(otherColumns = []) {
		const columns = ['id', 'name', 'flag_pick_up_ship'].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
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
		if (filter.relationAdd && filter.relationAdd.length > 0) {
			eagers = ['routeToday(selectColumns)'];
			eagers = this.validEagerAdd(filter, eagers, 'vehicle', 'vehicle(selectColumns)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'ordersPickUpDetails',
				'ordersPickUp(basicColumns).[details(selectColumns), commerce(basicColumns)]',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'ordersPickUp',
				'ordersPickUp(basicColumns).commerce(basicColumns)',
			);
			eagers = this.validEagerAdd(filter, eagers, 'delivery', 'delivery(basicColumns)');
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'ordersDetails',
				'orders(basicColumns).[details(selectColumns), commerce(basicColumns)]',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'orders',
				'orders(basicColumns).commerce(basicColumns)',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'responsibleUser',
				'responsibleUser(selectColumns)',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'typeDeliveryRoute',
				'typeDeliveryRoute(basicColumns)',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'zonesCustomerSimple',
				'zonesCustomers(selectColumns)',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'zonesCustomer',
				'zonesCustomers(selectColumns).[customer(selectColumns), zone(selectColumns), seller(selectColumns), customersAddress(selectColumns)]',
			);
			eagers = this.validEagerAdd(
				filter,
				eagers,
				'distributorType',
				'distributorType(selectColumns)',
			);
		}
		return `[${eagers.toString()}]`;
	}

	static getAll(companyId, filter = {}) {
		const deliveryEager = filter.includeDriver ? ', delivery(basicColumns)' : '';
		const orderEagers = filter.includeCommerce ? ', commerce(basicColumns)' : '';
		const ordersPickUpEager = filter.includeOrdersPickUp
			? `, ordersPickUp(selectColumns).[details(selectColumns)${orderEagers}]`
			: '';
		const eagerDefault = `vehicle(selectColumns), orders(selectColumns).[details(selectColumns)${orderEagers}], responsibleUser(selectColumns), typeDeliveryRoute(selectColumns), zonesCustomers(selectColumns).[customer(selectColumns), zone(selectColumns), seller(selectColumns), customersAddress(selectColumns)], distributorType(selectColumns), routeToday(selectColumns)${deliveryEager}${ordersPickUpEager}`;
		const eagers = this.validEagers(filter, eagerDefault);
		let query = this.query()
			.select(this.defaultColumns())
			.eager(eagers)
			.modifyEager('routeToday', (builder) => {
				if (filter.date) {
					builder.where('start_date', filter.date);
				}
			})
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('frequency', filter.frequency)
			.skipUndefined()
			.where('zone_id', filter.zoneId)
			.skipUndefined()
			.where('responsible_user_id', filter.responsibleUserId)
			.skipUndefined()
			.where('type_delivery_route_id', filter.typeDeliveryRouteId)
			.skipUndefined()
			.where('type_route', filter.typeRoute)
			.skipUndefined()
			.where('vehicle_id', filter.vehicleId)
			.skipUndefined()
			.where('type_distributor', filter.typeDistributor)
			.skipUndefined()
			.where('entity_state_id', filter.entityStateId)
			.skipUndefined()
			.where('flag_pick_up_ship', filter.flagPickUpShip)
			.skipUndefined()
			.where('delivery_id', filter.deliveryId)
			.where('company_id', companyId);

		if (filter.date) {
			query.whereRaw(`JSON_CONTAINS(${this.tableName}.dates, '"${filter.date}"')`);
		}

		if (filter.sellerId) {
			query.whereRaw(`JSON_CONTAINS(JSON_EXTRACT(${this.tableName}.sellers_id, '$[*].id'), '${
				filter.sellerId
			}')`);
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
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async create(data, {
		zoneId, customers, orders, codeRoute, serie, grouped, delivery,
	}) {
		try {
			const dataNew = data;
			const { location } = dataNew;
			dataNew.location = this.raw(`GeomFromText(${location})`);
			delete dataNew.linestring;
			const routeResultTx = await transaction(
				ComRouters,
				ComRoutesSellers,
				ComRouteCheckIn,
				Order,
				General,
				Serie,
				RemissionGuide,
				async (
					RouteTx,
					RouteSellerTx,
					ComRouteCheckInTx,
					OrderTx,
					GeneralTx,
					SeriesTx,
					RemissionTx,
				) => {
					if (codeRoute) {
						await GeneralTx.query()
							.patch({ number: raw('number+??', [1]) })
							.where('company_id', dataNew.companyId)
							.where('id', codeRoute.id);

						const currentCode = await GeneralTx.query()
							.where('company_id', dataNew.companyId)
							.where('id', codeRoute.id)
							.first();
						dataNew.code = `${currentCode.number}`;
					}
					const route = await RouteTx.query().insert(dataNew);
					if (route && Array.isArray(customers)) {
						const newRecord = customers.map((item) => {
							const newItem = item;
							newItem.routeId = route.id;
							newItem.zoneId = zoneId;
							newItem.companyId = route.companyId;
							newItem.customerAddressId = item.customerAddressId;
							const point = `"POINT(${item.latitude} ${item.longitude})"`;
							newItem.location = this.raw(`GeomFromText(${point})`);
							delete newItem.latitude;
							delete newItem.longitude;
							return newItem;
						});
						await RouteSellerTx.query().insertGraph(newRecord);
					}
					const dataUp = { orderPickState: inProgress };
					if (route.flagPickUpShip === pickUp) {
						dataUp.routeIdPickUp = route.id;
					} else {
						dataUp.routeId = route.id;
						dataUp.routeName = route.name;
					}
					if (delivery) {
						dataUp.flagPickUp = PickUp.home;
						dataUp.additionalInfo = OrderTx.deliveryStateRaw(accepted);
						dataUp.orderStateId = OrderTx.orderStateRaw(assigned);
						dataUp.deliveryId = delivery.id;
					}
					let numOrder = 0;
					if (route && Array.isArray(orders) && !grouped) {
						const editOrders = [];
						const newRecord = orders.map((item) => {
							const newItem = {};
							newItem.date = new Date();
							newItem.routeId = route.id;
							newItem.companyId = route.companyId;
							newItem.orderId = item.id;
							newItem.customerAddressId = item.customerAddressId;
							if (
								item.customerAddress &&
								item.customerAddress.latitude &&
								item.customerAddress.longitude
							) {
								const { latitude, longitude } = item.customerAddress;
								const point = `"POINT(${latitude} ${longitude})"`;
								newItem.location = this.raw(`GeomFromText(${point})`);
							}
							const remissionGuidesNew = item.remissionGuides;
							if (remissionGuidesNew) {
								remissionGuidesNew.subsidiaryId = item.subsidiaryId;
								remissionGuidesNew.warehouseId = item.warehouseId;
							}
							editOrders.push({
								id: item.id,
								...dataUp,
								flagGuides: !!item.remissionGuides,
								remissionGuides: remissionGuidesNew,
							});
							if (item.remissionGuides) {
								numOrder += 1;
							}
							return newItem;
						});
						await ComRouteCheckInTx.query().insertGraph(newRecord);
						await OrderTx.editByUpsert(editOrders);
					} else if (route && orders && Array.isArray(orders.orderData)) {
						numOrder = 1;
						const remission = { ...orders };
						const relatedOrders = remission.orderData;
						const newRecord = relatedOrders.map((item) => {
							const newItem = {};
							newItem.date = new Date();
							newItem.routeId = route.id;
							newItem.companyId = route.companyId;
							newItem.orderId = item.id;
							newItem.customerAddressId = item.customerAddressId;
							if (
								item.customerAddress &&
								item.customerAddress.latitude &&
								item.customerAddress.longitude
							) {
								const { latitude, longitude } = item.customerAddress;
								const point = `"POINT(${latitude} ${longitude})"`;
								newItem.location = this.raw(`GeomFromText(${point})`);
							}
							return newItem;
						});
						await ComRouteCheckInTx.query().insertGraph(newRecord);
						delete remission.orderData;
						const newRemission = await RemissionTx.query().insertGraph(remission);
						const ordersIds = relatedOrders.map(i => i.id);
						await OrderTx.editMultiple(
							ordersIds,
							{ ...dataUp, guideId: newRemission.id },
							newRemission.companyId,
						);
					}
					if (numOrder > 0 && serie) {
						await SeriesTx.query()
							.patch({ number: raw('number+??', [numOrder]) })
							.where('id', serie.id);
					}
					return route;
				},
			);
			return Promise.resolve(routeResultTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId, filter = {}) {
		const deliveryEager = filter.includeDriver ? ', delivery(basicColumns)' : '';
		const commerceEager = filter.includeCommerce ? ', commerce(basicColumns)' : '';
		const ordersPickUpEager = filter.includeOrdersPickUp
			? `, ordersPickUp(selectColumns).[employee(selectColumnsVendor), details(selectColumns), customer(selectColumns), customerAddress(selectColumns).parish(selectColumns), orderPickStateData(selectColumns), saleDocument(selectColumns)${commerceEager}]`
			: '';
		const ordersEager = `, orders(selectColumns).[employee(selectColumnsVendor), orderState(selectColumns), details(selectColumns), customer(selectColumns), customerAddress(selectColumns).parish(selectColumns), orderPickStateData(selectColumns), saleDocument(selectColumns)${commerceEager}]`;
		const eager = `[company(selectColumns).country(selectColumns), zone(basicColumns), vehicle(selectColumns), responsibleUser(selectColumns), typeDeliveryRoute(selectColumns), zonesCustomers(selectColumns).[customer(selectColumns), zone(selectColumns), seller(selectColumns), customersAddress(selectColumns)], distributorType(selectColumns), routeToday(selectColumns)${ordersEager}${deliveryEager}${ordersPickUpEager}]`;
		const query = this.query()
			.select(
				this.defaultColumns(),
				raw(`DATE_FORMAT(com_routers.created_at,  '${'%d-%m-%Y'}') AS created`),
			)
			.eager(eager)
			.findById(id)
			.where('company_id', companyId);
		if (filter.includeOrdersPickUp) {
			query.modifyEager('ordersPickUp.saleDocument', (builder) => {
				builder.where('sal_documents.com_company_id', companyId);
			});
		}
		if (filter.orderStateIds) {
			query.modifyEager('orders', (builder) => {
				builder.whereIn('sal_orders.order_state_id', filter.orderStateIds);
			});
		}
		query.modifyEager('orders.saleDocument', (builder) => {
			builder.where('sal_documents.com_company_id', companyId);
		});
		if (filter.typeReport === 'product') {
			query.modifyEager('orders.details', (builder) => {
				builder.groupBy('sal_orders_details.product_id').groupBy('sal_orders_details.unit_id');
			});
		}
		if (filter.dateToday) {
			query.whereRaw(`JSON_CONTAINS(${this.tableName}.dates, '"${filter.dateToday}"')`);
		}

		return query;
	}

	static async updateData(id, data, companyId, extraData = {}) {
		if (extraData.freeOrders) {
			await Order.freeOrdersByRoute(id, companyId, readyToDeliver, notAssigned);
		}
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static edit(id, data) {
		const {
			customersDeleted, customersNew, companyId, zoneId,
		} = data;
		const dataNew = data;
		if (dataNew.location) {
			dataNew.location = this.raw(`GeomFromText(${dataNew.location})`);
		} else {
			delete dataNew.location;
		}
		delete dataNew.companyId;
		delete dataNew.customersNew;
		delete dataNew.customersDeleted;
		delete dataNew.zoneId;
		const knex = ComRouters.knex();
		return transaction(knex, () =>
			this.query()
				.patch(dataNew)
				.where('id', id)
				.where('company_id', companyId)
				.then(() => {
					if (customersDeleted && customersDeleted.length > 0) {
						const ids = customersDeleted.map(it => it.customerAddressId);
						return ComRoutesSellers.remove(id, ids, companyId);
					}
					return null;
				})
				.then(() => {
					if (customersNew) {
						const newRecord = customersNew.map((item) => {
							const newItem = item;
							newItem.routeId = id;
							newItem.zoneId = zoneId;
							newItem.companyId = companyId;
							newItem.customerAddressId = item.customerAddressId;
							const point = `"POINT(${item.latitude} ${item.longitude})"`;
							newItem.location = this.raw(`GeomFromText(${point})`);
							delete newItem.latitude;
							delete newItem.longitude;
							delete newItem.flagSelected;
							return newItem;
						});
						return newRecord.length > 0 ? ComRoutesSellers.create(newRecord) : null;
					}
					return null;
				}));
	}

	static remove(id, companyId, filter = {}) {
		try {
			const { amount, orderIds, typeRouter } = filter;
			const knex = ComRouters.knex();
			return transaction(knex, () =>
				this.query()
					.softDelete()
					.where('id', id)
					.where('company_id', companyId)
					.then(() =>
						ComRouteHistory.editByRoute(
							id,
							{
								totalCheckInn: raw('total_check_inn+??', [1]),
								totalSales: raw('total_sales+??', [amount || 0]),
							},
							companyId,
						))
					// .then(() => ComRouteCheckInDetail.removeByRoute(detailIds)) No veo que se use aun
					.then(() => {
						if (orderIds && orderIds.length > 0) {
							return RemissionGuide.removeByOrderIds(orderIds, companyId);
						}
						return null;
					})
					.then(() =>
						Order.freeOrdersByRoute(id, companyId, readyToDeliver, notAssigned, typeRouter)));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getLineString(structure, h) {
		if (structure) {
			const location = structure.reduce((linestring, element) => {
				let newLinestring = linestring;
				newLinestring += newLinestring !== '' ? ', ' : '';
				return `${newLinestring}${element.lat} ${element.lng}`;
			}, '');
			return `"LINESTRING(${location})"`;
		}
		return h.response();
	}

	static assignSeller(id, data, updateData, zoneId, companyId) {
		const knex = ComRouters.knex();
		return transaction(knex, () =>
			this.query()
				.patch(data)
				.where('id', id)
				.where('company_id', companyId)
				.then(() => ComRoutesSellers.editMultiple(updateData, zoneId, id, companyId))
				.then(() => data));
	}

	static getByIdBasic(id, companyId, columns = []) {
		return this.query()
			.select(this.basicColumns(columns))
			.findById(id)
			.where('company_id', companyId);
	}

	static async getByRouter(id = null, companyId, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[orders(selectColumns)]')
			.modifyEager('orders', (builder) => {
				builder
					.select([
						raw('sal_orders.number as codeOrder'),
						raw("CONCAT(c.name,' ',c.lastname) as nameCustomer"),
						raw("Date_format(sal_orders.created_at,'%Y-%M-%d %h:%i:%s %p') as timeDate"),
						raw('cec.name as nameCommerce'),
						raw("CONCAT(sal_orders.currency ,' ', CONVERT(sal_orders.cost_shipping,char)) as costShippingCurrency"),
						raw("CONCAT(sal_orders.currency ,' ', CONVERT(sal_orders.total,char)) as totalCurrency"),
					])
					.join('com_customers as c', 'c.id', 'sal_orders.customer_id')
					.join('com_ecommerce_company as cec', 'cec.id', 'sal_orders.commerce_id');
				if (filter.pending) {
					query.where('sal_orders.payment_state_id', pending);
				}
			});
		if (!isNullOrUndefined(id)) {
			query.where(`${this.tableName}.id`, id);
		}
		query
			.where(`${this.tableName}.flag_pick_up_ship`, filter.flagPickUp)
			.where(`${this.tableName}.subsidiary_id`, filter.comSubsidiaryId)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
		return query;
	}
}

module.exports = ComRouters;
