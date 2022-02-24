'use strict';

const MsDevice = require('../../models/MsDevice');
const ModuleCode = require('../../models/ModuleCode');
const {
	sendPushNotification,
} = require('./../../api/integration-api-external/notifications/notifications');
const NotificationOrigin = require('./../../models/enums/notification-origin-identifier-enum');

async function sendPushNotificationOrder({
	commerce,
	entityReceptor,
	companyId,
	salOrder,
	title,
	body,
}) {
	if (salOrder && commerce && commerce.settings && commerce.settings.enablePushNotification) {
		const destiny = async () => {
			if (commerce.settings.personalNotification) {
				const msDeviceData = await MsDevice.getByUser(entityReceptor.id, entityReceptor.entity);
				return msDeviceData && msDeviceData.token;
			}
			return `${companyId}_${salOrder.warehouseId}`;
		};
		const destinyFound = await destiny();
		if (destinyFound) {
			const dataInfo = {
				to: destinyFound,
				notification: { title, body },
				data: {
					origin: NotificationOrigin.orders,
					identifier: `${salOrder.id}`,
				},
				isTopic: !commerce.settings.personalNotification,
			};
			await sendPushNotification(dataInfo, companyId);
		}
	}
	return {};
}

async function sendNotificationPush(params, options = {}) {
	if (options.moduleId === ModuleCode.ecommerce) {
		return sendPushNotificationOrder(params);
	}
	return true;
}

module.exports = sendNotificationPush;
