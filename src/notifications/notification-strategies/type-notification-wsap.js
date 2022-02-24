'use strict';

const { isNullOrUndefined, isArray } = require('util');
const ModuleCode = require('../../models/ModuleCode');

function getTemplateActive(options = {}) {
	const template = options.templates ? options.templates.find(i => i.flagActive) : undefined;
	return template ? template.code : '';
}

async function sendNotificationWhatappsOrder({ order }, options) {
	const {
		commerce, orderState, customer, companyId,
	} = order;

	if (commerce && orderState && customer && companyId) {
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
				templateCode: getTemplateActive(options) || templateCode,
				data: {
					phone: `51${numberPhone}`,
					message,
					fields,
				},
			};
			if (!isNullOrUndefined(numberPhone)) {
				return { data: dataNotification };
				// return axios({
				// 	url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/WTAPP/public`,
				// 	method: 'POST',
				// 	data: dataNotification,
				// 	validateStatus: () => true,
				// });
			}
			return {};
		};

		if (commerce && !isNullOrUndefined(orderState)) {
			const { settings } = commerce;
			if (settings && settings.flagSmsOrders) {
				return sendNotificationOrdersyWhatsapp();
			}
		}
	}
	return {};
}

async function sendNotificationWhatapps(params, options = {}) {
	if (options.moduleId === ModuleCode.ecommerce) {
		return sendNotificationWhatappsOrder(params, options);
	}
	return true;
}

module.exports = sendNotificationWhatapps;
