/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const DeliveryContract = require('../DeliveryContract');
const { olva } = require('./delivery-strategies-codes');
const { external } = require('../category-delivery-enums');
const { payProd } = require('./../../models/enums/way-payment-codes-enum');

class Olva extends DeliveryContract {
	constructor(data, categoryCode = external) {
		super();
		this.data = data;
		this.environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'http://ws.olvacourier.com:8080',
			prod: 'https://olvacourier.com:8080',
		};
		return url[this.environment];
	}

	async create() {
		const authorization = process.env.AUTH_OLVA;
		const { status, data: responseOlva } = await axios({
			url: `${this.getUrlApi()}/RegistroRemito-1.0-SNAPSHOT/webresources/remito/generar`,
			headers: {
				authorization: `Bearer ${authorization}`,
			},
			method: 'POST',
			data: this._getPayload(),
			validateStatus: () => true,
		});
		await this._updateOrder({ responseOlva });
		return { status, responseOlva, olva };
	}

	_getPayload() {
		const { order } = this.data;
		const { customer, responsiblePickUp } = order;
		let names;
		let surname;
		let identificationDocId;
		// let phoneCustomer;
		if (responsiblePickUp && responsiblePickUp.name && responsiblePickUp.lastname) {
			names = responsiblePickUp.name;
			surname = responsiblePickUp.lastname;
			identificationDocId = responsiblePickUp.dni;
			// phoneCustomer = responsiblePickUp.phone;
		} else {
			names = customer.name;
			surname = customer.lastname;
			identificationDocId = customer.dni;
			// phoneCustomer = customer.phone || responsiblePickUp.phone;
		}
		// const { weight } = order.details.reduce(i => ({
		// 	code: i.productCode,
		// 	description: i.productName,
		// 	width: i.product.width || 1,
		// 	height: i.product.height || 1,
		// 	depth: i.product.depth || 10,
		// 	weight: i.product.weight || 20,
		// 	quantity: i.quantity,
		// 	package_type: 2,
		// }), { weight: 0, });
		const wayPaymentCode = order.wayPayment && order.wayPayment.code;
		return {
			consignado: `${names} ${surname}`,
			nroDocConsignado: `${identificationDocId}`,
			direccion: `${order.customerAddress.addressLine1}`,
			ubigeo: `${order.customerAddress.parish.ubigeo}`,
			codigoRastreo: `${order.id}-PE-${order.documentNumber}`,
			observacion: `${order.comments}`,
			montoArticulo: order.total,
			receptor: `${customer.name} ${customer.lastname}`,
			rucSeller: `${order.commerce.documentNumber}`,
			ubigeoSeller: `${order.commerce.settings.ubigeo}`,
			seller: `${order.commerce.rzSocial}`,
			direccionSeller: `${order.commerce.address}`,
			contacto: `${order.subsidiary.contactName} ${order.subsidiary.contactLastname}`,
			telefono: `${order.commerce.phone}`,
			// codClienteRucDni: 'Numero de RUC Cliente. (A cual ruc se refiere.',
			total: wayPaymentCode !== payProd ? order.total : 0,
			formaPago: wayPaymentCode === payProd ? 'PPD' : 'COD',
			// tipoEnvio: 'INTEGER, Código de Tipo Envió Asignado por Olva Courier.',
			// altoEnvio: 'FLOAT, Alto del envió',
			// anchoEnvio: 'FLOAT, Ancho del envió',
			// largoEnvio: 'FLOAT, Largo del envió',
			// pesoUnitario: 'FLOAT, Peso Unitario del Producto o contenido del envió.',
			// eslint-disable-next-line max-len
			// codContenedor: 'INTEGER, 1: Sobre, 2: Caja, 3: Tubo, 4: Jaba de madera,  5: Valija, 6: Bolsa, 7: Bulto, 19: Paquete.',
		};
	}
}

module.exports = Olva;
