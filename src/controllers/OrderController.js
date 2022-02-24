'use strict';

const TypeEntity = require('./../models/TypeEntity');
const ComSubsidiaries = require('./../models/ComSubsidiaries');
const SyncFirebase = require('../external-apis/apis-strategies/processSync/SyncFirebase');
const { high } = require('./../models/enums/notification-intensity-enum');
const { freeCourier, delivery, courier } = require('./../models/enums/type-order-enum');
const { getLinearDistanceKm } = require('./../shared/helper');

async function setParamsNotification({
	order,
	number,
	title = 'Nuevos pedido courier',
	body = 'Hay nuevos pedidos por recoger y entregar',
	deliveryData,
	companyId,
	personalNotification = true,
	enablePushNotification = true,
	commerce,
	settingsCompany,
	credentials,
}) {
	const {
		flagNotifyRandom,
		numberNotifyFree,
		flagNotifyRandomDelivery,
		numberNotifyDelivery,
		flagNotifyRandomCourier,
		numberNotifyCourier,
		notifyByRadioOrder,
		radioOrderMax,
	} =
		(settingsCompany && settingsCompany.freeCourierSettings) || {};
	let subsidiaryDefault;
	if (notifyByRadioOrder && settingsCompany.flagTypeIntegrationGrouper) {
		subsidiaryDefault = await ComSubsidiaries.getByCompanyDefault(companyId);
	}
	const params = {
		salOrder: order,
		number,
		title,
		body,
		subsidiaryDefault,
		commerce: commerce || {
			settings: {
				personalNotification,
				enablePushNotification,
			},
		},
		entityReceptor: { entity: TypeEntity.delivery },
		companyId,
		intensity: high,
		notifyByRadioOrder,
		radioOrderMax,
		credentials,
	};
	if (deliveryData) {
		params.entityReceptor.id = deliveryData.employeeId;
	}
	if (flagNotifyRandom && order.typeOrder === freeCourier) {
		params.notifyRandomDealer = numberNotifyFree;
	} else if (flagNotifyRandomDelivery && order.typeOrder === delivery) {
		params.notifyRandomDealer = numberNotifyDelivery;
	} else if (flagNotifyRandomCourier && order.typeOrder === courier) {
		params.notifyRandomDealer = numberNotifyCourier;
	}
	return params;
}

async function getUsersNotificationByDistance({
	subsidiary,
	credentials,
	distanceKm = 2,
	locationOrigin,
}) {
	const { pickUpPoint } = locationOrigin || {};
	const subsidiaryFilters = ComSubsidiaries.getSubsidiaryFilters({ subsidiary });
	const { employee } = credentials || {};
	const users = await SyncFirebase.getEstructureFree({
		subsidiaryFilters: {
			...subsidiaryFilters,
			code: `lord-express-default-rtdb/${(employee && employee.company.code) || subsidiary.code}`,
		},
		credentials,
	});
	const userIds = Object.keys(users);
	let coordinates = Object.values(users);
	coordinates = coordinates.map((i, x) => ({ ...i, id: userIds[x] }));
	const newUsers = coordinates.reduce((a, i) => {
		if (
			pickUpPoint &&
			pickUpPoint.latitude &&
			pickUpPoint.longitude &&
			getLinearDistanceKm(i.latitude, i.longitude, pickUpPoint.latitude, pickUpPoint.longitude) <=
				distanceKm
		) {
			return [...a, i];
		}
		return a;
	}, []);
	return newUsers;
}

module.exports = { setParamsNotification, getUsersNotificationByDistance };
