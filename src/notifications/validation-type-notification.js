'use strict';

const simpleAxios = require('./../api/shared/simple-axios');
const TypeNotification = require('./notification-strategies/type-notifications-enums');
const NotificationWsap = require('./notification-strategies/type-notification-wsap');
const NotificationPush = require('./notification-strategies/type-notification-push');
const Notification = require('./NotificationStrategy');

async function runNotifications({
	auxProcess, params, onlyTypeNot, subsidiary, authorization,
}) {
	const responseStatus = { sendProcess: 0, process: {} };
	responseStatus.sendProcess = auxProcess.configTypeIntegration.length;
	responseStatus.auxProcess = auxProcess;
	const typeNotSend = auxProcess.configTypeIntegration.filter(item => item.flagActive);
	const dataNotifications = [];
	typeNotSend.forEach((element) => {
		let notificationItem = {};
		if (
			(element.code === TypeNotification.email && element.flagActive && !onlyTypeNot) ||
			(element.code === TypeNotification.email &&
				element.flagActive &&
				onlyTypeNot === TypeNotification.email)
		) {
			responseStatus[TypeNotification.email] = true;
			const notificationEmailInstance = new Notification(
				{ params, options: element },
				TypeNotification.email,
			);
			notificationItem = notificationEmailInstance.sendNotificationEmail({});
			if (notificationItem.data) {
				dataNotifications.push({ ...notificationItem.data, typeCode: element.code });
			}
		}
		if (
			(element.code === TypeNotification.wsap && element.flagActive && !onlyTypeNot) ||
			(element.code === TypeNotification.wsap &&
				element.flagActive &&
				onlyTypeNot === TypeNotification.wsap)
		) {
			responseStatus[TypeNotification.wsap] = true;
			notificationItem = NotificationWsap(params, element);
			if (notificationItem.data) {
				dataNotifications.push({ ...notificationItem.data, typeCode: element.code });
			}
		}
		if (
			(element.code === TypeNotification.push && element.flagActive && !onlyTypeNot) ||
			(element.code === TypeNotification.push &&
				element.flagActive &&
				onlyTypeNot === TypeNotification.push)
		) {
			responseStatus[TypeNotification.push] = true;
			notificationItem = NotificationPush(params, element);
			if (notificationItem.data) {
				dataNotifications.push({ ...notificationItem.data, typeCode: element.code });
			}
		}
	});
	if (dataNotifications.length > 0) {
		const { status, data: responseNot } = await simpleAxios({
			url: `${process.env.NOTIFICATIONS_URL}/notifications-multiple`,
			method: 'POST',
			headers: {
				authorization,
			},
			data: {
				dataNotifications,
				auto: true,
				subsidiaryCode: subsidiary.subsidiaryAclCode,
			},
			validateStatus: () => true,
		});
		responseStatus.responseNot = { status, responseNot };
	}
	return responseStatus;
}

module.exports = runNotifications;
