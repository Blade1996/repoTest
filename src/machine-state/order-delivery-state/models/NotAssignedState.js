/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const Boom = require('boom');
const OrderDeliveryStateInterface = require('./../OrderDeliveryStateInterface');
const {
	notifyOrderStatusChangeByPush,
} = require('./../../../api/sales/sal-orders/sal-orders.events');
const SalOrders = require('../../../models/SalOrders');
const TypeEntity = require('../../../models/TypeEntity');
const {
	alreadyAssignedToOrder,
	alreadyAssignedToDelivery,
} = require('./../../../api/shared/error-codes');
const { accepted } = require('./../../../models/enums/order-delivery-state-enum');
const { isDevOrProd } = require('../../../shared/helper');
const { assigned } = require('./../../../models/enums/type-ms-order-states');
const { high } = require('../../../models/enums/notification-intensity-enum');

class NotAssignedState extends OrderDeliveryStateInterface {
	constructor(order, delivery, credentials, flagChangeStatus = false) {
		super();
		this.response = 0;
		this.order = order;
		this.delivery = delivery;
		this.credentials = credentials;
		this.flagChangeStatus = flagChangeStatus;
	}

	async accept() {
		if (this.response === 0) {
			const dataToUpd = {
				deliveryId: this.delivery.id,
				orderStateCode: assigned,
				deliveryState: accepted,
			};
			if (this.flagChangeStatus) {
				dataToUpd.flagPickUp = 1;
			}
			await SalOrders.updateOrderInfo(this.order.id, this.credentials.cms_companies_id, dataToUpd);
		}

		if (this.response === 0) {
			if (isDevOrProd()) {
				const { employee = {} } = this.credentials;
				const commerceName = this.order.commerce && this.order.commerce.name;
				const msg = commerceName ? ` asignado del comercio ${commerceName}.` : ' asignado.';
				const params = {
					client: {
						title: `Pedido #${this.order.number}: Repartidor asignado`,
						body: `Su pedido ha sido asignado al repartidor ${
							this.delivery.fullname
						} para su envío.`,
					},
				};
				const employeeDeliveryId = this.delivery && this.delivery.employeeId;
				const validEmployee = employeeDeliveryId === employee.id;
				if (!validEmployee) {
					params.deliveryMan = {
						title: 'Nuevo pedido a entregar',
						body: `Hola ${this.delivery.fullname}, tienes un pedido #${this.order.number}${msg}`,
						intensity: high,
					};
				}
				this.sendNotifications(params);
			}
		}
	}

	async _validateAssignment() {
		const companyId = this.credentials.cms_companies_id;
		const deliveryId = this.delivery.id;
		const orderId = this.order.id;
		const isAssignedAlready = await SalOrders.verifyDeliveryAssignment(
			deliveryId,
			orderId,
			companyId,
		);
		if (isAssignedAlready) {
			this.response = Boom.badRequest(alreadyAssignedToOrder);
		}
	}

	async _assignDeliveryToOrder() {
		const companyId = this.credentials.cms_companies_id;
		const ordersApproved = await SalOrders.assignDeliveryOrder(
			this.order.id,
			this.delivery.id,
			companyId,
		);
		if (ordersApproved < 1) {
			this.response = Boom.badRequest(alreadyAssignedToDelivery);
		}
	}

	sendNotifications({ employee, client, deliveryMan }) {
		// Send to Employee
		if (employee) {
			const employeeParams = {
				number: this.order.number,
				commerce: {
					settings: {
						personalNotification: false,
						enablePushNotification: true,
					},
				},
				entityReceptor: { id: this.credentials.employee.id, entity: TypeEntity.employee },
				companyId: this.order.companyId,
				salOrder: this.order,
				event: '',
				title: employee.title,
				body: employee.body,
				intensity: employee.intensity,
			};
			notifyOrderStatusChangeByPush(employeeParams);
		}

		// Send to Client
		if (client) {
			const customerId = this.order.customer && this.order.customer.id;
			const clientParams = {
				number: this.order.number,
				commerce: {
					settings: {
						personalNotification: true,
						enablePushNotification: true,
					},
				},
				entityReceptor: { id: customerId, entity: TypeEntity.customer },
				companyId: this.order.companyId,
				salOrder: this.order,
				event: '',
				title: client.title,
				body: client.body,
				intensity: client.intensity,
			};
			notifyOrderStatusChangeByPush(clientParams);
		}

		// Send to Delivery man
		if (deliveryMan) {
			const deliveryParams = {
				number: this.order.number,
				commerce: {
					settings: {
						personalNotification: true,
						enablePushNotification: true,
					},
				},
				entityReceptor: { id: this.delivery.employeeId, entity: TypeEntity.delivery },
				companyId: this.order.companyId,
				salOrder: this.order,
				event: '',
				title: deliveryMan.title,
				body: deliveryMan.body,
				intensity: deliveryMan.intensity,
			};
			notifyOrderStatusChangeByPush(deliveryParams);
		}
	}

	unAssign() {
		this.response = Boom.badRequest('unAssign_ACTION_INVALID');
	}

	inPlaceOrigin() {
		this.response = Boom.badRequest('inPlaceOrigin_ACTION_INVALID');
	}

	inRoadDelivery() {
		this.response = Boom.badRequest('inRoadDelivery_ACTION_INVALID');
	}

	inPlaceDestiny() {
		this.response = Boom.badRequest('inPlaceDestiny_ACTION_INVALID');
	}

	backToOrigin() {
		this.response = Boom.badRequest('backToOrigin_ACTION_INVALID');
	}

	givenDelivery() {
		this.response = Boom.badRequest('givenDelivery_ACTION_INVALID');
	}

	sendResponse() {
		return this.response;
	}
}

module.exports = NotAssignedState;
