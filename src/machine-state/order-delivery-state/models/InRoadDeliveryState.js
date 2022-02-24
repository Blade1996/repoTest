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
const { inPlaceDestiny } = require('./../../../models/enums/order-delivery-state-enum');
const { isDevOrProd } = require('../../../shared/helper');
const { delivery: deliveryType } = require('./../../../models/enums/type-order-enum');

class InRoadDeliveryState extends OrderDeliveryStateInterface {
	constructor(order, delivery, credentials) {
		super();
		this.response = 0;
		this.order = order;
		this.delivery = delivery;
		this.credentials = credentials;
	}

	async inPlaceDestiny() {
		if (this.response === 0) {
			await SalOrders.updateOrderInfo(
				this.order.id,
				this.credentials.cms_companies_id,
				{
					deliveryState: inPlaceDestiny,
				},
				this.delivery.id,
			);
		}

		if (this.response === 0) {
			if (isDevOrProd()) {
				const typeOrder = this.order.typeOrder ? this.order.typeOrder : deliveryType;
				this.sendNotifications({
					client: {
						title:
							typeOrder === deliveryType
								? `Pedido #${this.order.number}: Llegó el repartidor`
								: `Pedido #${this.order.number}: Repartidor en punto de entrega`,
						body:
							typeOrder === deliveryType
								? 'El repartidor ha llegado a su ubicación'
								: 'Su pedido ha llegado al punto de entrega. El repartidor se pondrá en contacto con el responsable de ese punto.',
					},
				});
			}
		}
	}

	sendNotifications({ employee, client }) {
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
			};
			notifyOrderStatusChangeByPush(clientParams);
		}
	}

	accept() {
		this.response = Boom.badRequest('accept_ACTION_INVALID');
	}

	unAssign() {
		this.response = Boom.badRequest('unAssign_ACTION_INVALID');
	}

	inRoadDelivery() {
		this.response = Boom.badRequest('inRoadDelivery_ACTION_INVALID');
	}

	inPlaceOrigin() {
		this.response = Boom.badRequest('inPlaceOrigin_ACTION_INVALID');
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

module.exports = InRoadDeliveryState;
