/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const DeliveryContract = require('../DeliveryContract');
const { aimo } = require('./delivery-strategies-codes');
const { external } = require('../category-delivery-enums');
const helper = require('../../models/helper');
const Order = require('../../models/SalOrders');
const typeOrderStates = require('../../models/enums/type-ms-order-states');
// const { configInitError } = require('../error-codes/external-apis-error-codes');

class Aimo extends DeliveryContract {
	constructor(data, categoryCode = external) {
		super();
		this.data = data;
		this.categoryCode = categoryCode;
	}

	getUrlApi(env = 'dev') {
		const url = {
			dev: 'https://api.aimo.co/core',
			prod: 'https://api.aimo.co/core',
		};
		return url[env];
	}

	async create() {
		const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
		const authorization = process.env.AUTH_AIMO;
		const { status, data: responseAimo } = await axios({
			url: `${this.getUrlApi(env)}/orders/`,
			headers: {
				authorization: `Bearer ${authorization}`,
			},
			method: 'POST',
			data: this._getPayload(),
			validateStatus: () => true,
		});
		await this._updateOrder({ responseAimo });
		return { status, responseAimo, aimo };
	}

	_getPayload() {
		const { order } = this.data;
		return {
			reference_code: `${order.id}`,
			order_type: 'delivery',
			programmed_date: `${helper.localDate(order.createdAt, 'YYYY-MM-DD')}`,
			time_window: '08:00-20:00',
			branch_office: 'T01',
			batch: 'ROUTE1',
			tasks: [
				{
					coordinates: {
						latitude: order.commerce.latitude,
						longitude: order.commerce.longitude,
					},
					address: `${order.commerce.address}`,
					ubigeo: `${order.commerce.settings.ubigeo}`,
					address_detail: `${order.commerce.address}`,
					contact_person: `${order.subsidiary.contactName} ${order.subsidiary.contactLastname}`,
					contact_phone: `+51${order.commerce.phone}`,
					contact_email: `${order.commerce.email}`,
					special_instructions: `${order.comments}`,
					description: `${order.documentNumber}`,
					task_type: 'pickup',
					custom_properties: [
						{
							id: 1,
							value: `${order.customer.name}`,
						},
						{
							id: 2,
							value: `${order.customer.lastname}`,
						},
						{
							id: 3,
							value: `${order.customer.phone}`,
						},
						{
							id: 4,
							value: `${order.customer.dni}`,
						},
						{
							id: 5,
							value: `${order.customer.email}`,
						},
					],
					items: order.details.map(i => ({
						code: i.productCode,
						description: i.productName,
						width: i.product.width || 1,
						height: i.product.height || 1,
						depth: i.product.depth || 10,
						weight: i.product.weight || 20,
						quantity: i.quantity,
						package_type: 2,
					})),
				},
				{
					coordinates: {
						latitude: order.customerAddress.latitude,
						longitude: order.customerAddress.longitude,
					},
					address: `${order.customerAddress.addressLine1}`,
					ubigeo: `${order.customerAddress.parish.ubigeo}`,
					address_detail: `${order.customerAddress.reference}`,
					contact_person: `${order.responsiblePickUp.fullname}`,
					contact_phone: `+51${order.responsiblePickUp.phone}`,
					contact_email: `${order.responsiblePickUp.email}`,
					special_instructions: `${order.comments}`,
					description: `${order.documentNumber}`,
					task_type: 'dropoff',
					custom_properties: [
						{
							id: 1,
							value: `${order.customer.name}`,
						},
						{
							id: 2,
							value: `${order.customer.lastname}`,
						},
						{
							id: 3,
							value: `${order.customer.phone}`,
						},
						{
							id: 4,
							value: `${order.customer.dni}`,
						},
						{
							id: 5,
							value: `${order.customer.email}`,
						},
					],
					items: order.details.map(i => ({
						code: i.productCode,
						description: i.productName,
						width: i.product.width || 1,
						height: i.product.height || 1,
						depth: i.product.depth || 10,
						weight: i.product.weight || 20,
						quantity: i.quantity,
						package_type: 2,
					})),
				},
			],
			custom_properties: [
				{
					id: 1,
					value: `${order.customer.name}`,
				},
				{
					id: 2,
					value: `${order.customer.lastname}`,
				},
				{
					id: 3,
					value: `${order.customer.phone}`,
				},
				{
					id: 4,
					value: `${order.customer.dni}`,
				},
				{
					id: 5,
					value: `${order.customer.email}`,
				},
			],
			vehicle_type: null,
			is_immediate: true,
			time_window_start: `${order.commerce.settings.hourFrom}` || '08:00',
			time_window_end: `${order.commerce.settings.hourTo}` || '20:00',
		};
	}

	async _updateOrder({ responseAimo = {} }) {
		const { id, companyId } = this.data.order;
		if (id && companyId) {
			await Order.editTrackingInfo({ trackingInformation: responseAimo, id, companyId });
		}
	}

	async getPrice() {
		const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
		const authorization = process.env.AUTH_AIMO;
		const { status, data: responseAimo } = await axios({
			url: `${this.getUrlApi(env)}/orders/delivery_price`,
			headers: {
				authorization: `Bearer ${authorization}`,
			},
			method: 'POST',
			data: this._getPayloadPrice(),
			validateStatus: () => true,
		});
		return { status, responseAimo, aimo };
	}

	_getPayloadPrice() {
		const { order } = this.data;
		return {
			tasks: [
				{
					task_type: 'pickup',
					address: order.commerce.address,
					ubigeo: order.commerce.settings.ubigeo,
					coordinates: {
						latitude: order.commerce.latitude,
						longitude: order.commerce.longitude,
					},
				},
				{
					task_type: 'dropoff',
					address: order.customerAddress.address,
					ubigeo: order.customerAddress.parish.description,
					coordinates: {
						latitude: order.customerAddress.latitude,
						longitude: order.customerAddress.longitude,
					},
				},
			],
			weight: order.product.reduce((i, a) => (i.weight ? a + i.weight : a + 0.1), 0),
			programmed_date: `${helper.localDate(order.createdAt, 'YYYY-MM-DD')}`,
			time_window_start: `${order.commerce.settings.hourFrom}` || '08:00',
			time_window_end: `${order.commerce.settings.hourTo}` || '20:00',
		};
	}

	async updateStatus() {
		const { order, orderStatus } = this.data;
		const { data } = orderStatus;
		const trackingInformation = order.trackingInformation || {};
		let newOrderStateId = order.orderStateId;
		if (data && data.status === 'accepted') {
			newOrderStateId = typeOrderStates.readyToDeliver;
		}
		if (data && data.status === 'dropoff_started') {
			newOrderStateId = typeOrderStates.inRoad;
		}
		if (data && data.status === 'dropoff_completed') {
			newOrderStateId = typeOrderStates.given;
		}
		trackingInformation.orderStatus = orderStatus;
		await this._updateOrder({
			responseAimo: trackingInformation,
			orderStateId: newOrderStateId,
			id: order.id,
			companyId: order.companyId,
		});
		return { trackingInformation, orderStateId: newOrderStateId };
	}
}

module.exports = Aimo;
