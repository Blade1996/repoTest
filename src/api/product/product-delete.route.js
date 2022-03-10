'use strict';

const Joi = require('joi');
const handler = require('./product-delete.handler');
const { validExits } = require('./product.pre');

const route = {
	handler, // el metodo del servicio
	method: 'DELETE', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				method: validExits,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			params: {
				id: Joi.number().integer().required(),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/product/{id}',
};

module.exports = route;