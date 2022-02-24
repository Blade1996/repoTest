'use strict';

const { isNullOrUndefined } = require('util');
const NotificationContract = require('../NotificationContract');
const { bankDep } = require('../../models/enums/way-payment-codes-enum');
const MsOrderStates = require('../../models/enums/type-ms-order-states');
const { store } = require('../../models/PickUp');
const ModuleCode = require('../../models/ModuleCode');

class Email extends NotificationContract {
	constructor(data) {
		super();
		this.data = data;
		this.typeNotificationCode = 'EMAIL';
	}

	async getTemplateActive() {
		const { options } = this.data;
		const template = options.templates ? options.templates.find(i => i.flagActive) : undefined;
		return template ? template.code : '';
	}

	async sendNotificationEmailOrder() {
		const { params, options = {} } = this.data;
		const { order, wayPayment, bankAccount = {} } = params;
		const {
			commerce, orderState, customer, companyId,
		} = order;

		if (commerce && orderState && customer && companyId) {
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
						deliveryPrice: order.deliveryPrice,
						address: commerce.address,
						deliveryDate: order.deliveryDate,
						wayPayment,
					},
					message: `Su pedido: ${order.number}, se encuentra: ${orderState.name}`,
				};

				return {
					companyId,
					templateCode: this.getTemplateActive(options) || templateCode,
					data,
				};
				// return axios({
				// 	url: `${process.env.NOTIFICATIONS_URL}/notifications/EMAIL/public`,
				// 	method: 'POST',
				// 	data: structureData,
				// 	validateStatus: () => true,
				// });
			};

			if (commerce && !isNullOrUndefined(orderState)) {
				const { settings } = commerce;
				if (settings && settings.flagWebOrders) {
					return { data: sendNotificationOrdersByWeb(settings) };
				}
			}
		}
		return Promise.resolve();
	}

	async sendNotificationEmail() {
		const { options = {} } = this.data;
		if (options.moduleId === ModuleCode.ecommerce) {
			return this.sendNotificationEmailOrder();
		}
		return Promise.resolve();
	}
}

module.exports = Email;
