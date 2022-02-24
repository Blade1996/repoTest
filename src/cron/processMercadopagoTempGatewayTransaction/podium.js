'use strict';

require('dotenv').config();
const Podium = require('podium');
const dbConfig = require('../../config/objection');
const SalOrders = require('../../models/SalOrders');
const GatewayTransaction = require('../../models/GatewayTransaction');
const { notifyOrderStatusChangeByPush } = require('./../../api/sales/sal-orders/sal-orders.events');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('getGatewayStatusNotification');

async function processSaleKardex({ lotRecords }) {
	try {
		const data = await GatewayTransaction.getAllPendingByCodeAndStatus({ lotRecords });
		if (data.length === 0) {
			return data;
		}
		data.forEach((gatewayTransaction) => {
			podiumObject.emit('getGatewayStatusNotification', gatewayTransaction);
		});
		return data;
	} catch (error) {
		return error;
	}
}

podiumObject.on('getGatewayStatusNotification', async (gatewayTransaction) => {
	try {
		const { companyId, referenceId: numberTransaction, id } = gatewayTransaction;
		const orderIds = gatewayTransaction.orderId
			? [gatewayTransaction.orderId]
			: gatewayTransaction.additionalInformation.orderIds;
		const orders = await SalOrders.getByIds(orderIds, companyId);
		const {
			orderState,
			customer,
			wayPayment,
			flagPickUp,
			responsiblePickUp,
			deliveryAddress,
		} = orders[0];
		if (customer && wayPayment && orderState) {
			const {
				customerNot,
				commercesNot,
				total,
				subtotal,
				costShipping,
				employeesPushNot,
			} = orders.reduce(
				(acc, order) => {
					acc.customerNot.push({
						id: order.id,
						tienda: order.warehouseName || order.details[0].warehouseName,
						numero: order.documentNumber || order.number,
						details: order.details,
						total: order.total,
						subtotal: order.subtotal,
						address: order.commerce && order.commerce.address,
						deliveryDate: order.deliveryDate,
						wayPayment,
						numberTransaction,
						paymentGateway:
							order.additionalInformation && order.additionalInformation.paymentGateway,
					});
					acc.total += order.total;
					acc.subtotal += order.subtotal;
					acc.costShipping += order.costShipping;
					acc.commercesNot.push({
						id: order.id,
						fullName: `${customer.name} ${customer.lastname}`,
						tienda: order.warehouseName || order.details[0].warehouseName,
						numero: order.documentNumber || order.number,
						total: order.total,
						subtotal: order.subtotal,
						details: order.details,
						deliveryPrice: order.costShipping,
						numberTransaction,
						wayPayment,
						commerce: order.commerce,
						paymentGateway:
							order.additionalInformation && order.additionalInformation.paymentGateway,
					});
					acc.employeesPushNot.push({
						salOrder: order,
						number: order.number,
						commerce: order.commerce,
						companyId,
						title: 'Nuevo pedido',
						body: `Tiene un nuevo pedido #${order.number}`,
					});
					return acc;
				},
				{
					customerNot: [],
					commercesNot: [],
					employeesPushNot: [],
					total: 0,
					subtotal: 0,
					costShipping: 0,
				},
			);
			const dataStructure = {
				commerces: customerNot,
				total,
				subtotal,
				costShipping,
			};
			dataStructure.message = `Su pedido se encuentra: ${orderState.name}`;
			dataStructure.numberTransaction = numberTransaction;
			SalOrders.handleNotification({
				order: {
					orderState,
					customer,
					companyId,
					flagPickUp,
					responsiblePickUp,
					deliveryAddress,
				},
				wayPayment,
				flagMultiOrder: true,
				dataStructure,
			});
			commercesNot.forEach((commerce) => {
				SalOrders.handleNotification({
					order: {
						orderState,
						customer,
						companyId,
						flagPickUp,
						responsiblePickUp,
						deliveryAddress,
					},
					wayPayment,
					dataStructure: commerce,
					commerceNotification: true,
				});
			});

			employeesPushNot.forEach((emplNot) => {
				notifyOrderStatusChangeByPush(emplNot);
			});
		}
		await GatewayTransaction.edit(id, { tokenGateway: 'notification' });
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log('errorerrorerror Mercadopago Notificaciones', error);
		return error;
	}
});

module.exports = processSaleKardex;
