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
	givenDelivery,
	backToOrigin,
} = require('./../../../models/enums/order-delivery-state-enum');
const { isDevOrProd } = require('../../../shared/helper');
const { given } = require('./../../../models/enums/type-ms-order-states');
const { payOut } = require('./../../../models/PaymentState');
const { payProd } = require('../../../models/enums/way-payment-codes-enum');
const { courier } = require('./../../../models/enums/type-order-enum');
const { delivery: deliveryType } = require('./../../../models/enums/type-order-enum');
const { casamarket } = require('./../../../models/enums/code-app-order-enum');

class InPlaceDestinyState extends OrderDeliveryStateInterface {
	constructor(order, delivery, credentials) {
		super();
		this.response = 0;
		this.order = order;
		this.delivery = delivery;
		this.credentials = credentials;
	}

	async givenDelivery(collectData = {}) {
		if (this.response === 0) {
			const dataToUpdate = {
				orderStateCode: given,
				deliveryState: givenDelivery,
				collectData: JSON.stringify(collectData),
			};

			const wayPaymentCode = this.order.wayPayment && this.order.wayPayment.code;
			if (this.order.codeApp !== casamarket && wayPaymentCode === payProd) {
				dataToUpdate.paymentStateId = payOut;
			}

			await SalOrders.updateOrderInfo(
				this.order.id,
				this.credentials.cms_companies_id,
				dataToUpdate,
				this.delivery.id,
			);
		}

		if (this.response === 0) {
			if (isDevOrProd()) {
				const typeOrder = this.order.typeOrder ? this.order.typeOrder : deliveryType;
				let body;
				if (typeOrder === deliveryType) {
					body = `El pedido #${this.order.number} fue entregado. Muchas gracias por su preferencia`;
				} else {
					body = `El pedido #${
						this.order.number
					} fue entregado. Muchas gracias por confiar en nuestro servicio.`;
				}
				this.sendNotifications({
					client: {
						title: `Pedido #${this.order.number}: Pedido entregado`,
						body,
					},
				});
			}
		}
	}

	async backToOrigin() {
		if (this.response === 0) {
			if (this.order.typeOrder !== courier) {
				this.response = Boom.badRequest('ORDER_NOT_COURIER_TYPE');
			}
		}

		if (this.response === 0) {
			await SalOrders.updateOrderInfo(
				this.order.id,
				this.credentials.cms_companies_id,
				{
					deliveryState: backToOrigin,
				},
				this.delivery.id,
			);
		}

		if (this.response === 0) {
			if (isDevOrProd()) {
				this.sendNotifications({
					client: {
						title: `Pedido #${this.order.number}: Pedido en retorno`,
						body: 'El repartidor está retornando al punto de recojo.',
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

	inPlaceDestiny() {
		this.response = Boom.badRequest('inPlaceDestiny_ACTION_INVALID');
	}

	sendResponse() {
		return this.response;
	}
}

module.exports = InPlaceDestinyState;
