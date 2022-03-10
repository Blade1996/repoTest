'use strict';

const Joi = require('joi');
const handler = require('./product-update.handler');
const { validExits, getProduct } = require('./product.pre');

const route = {
	handler, // el metodo del servicio
	method: 'PATCH', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				method: validExits,
			},
			{
				assign: 'validProduct',
				method: getProduct,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				name: Joi.string().required(),
				description: Joi.string().required(),
				quantity: Joi.number().integer().required(),
			},
			params: {
				id: Joi.number().integer().required(),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/product/{id}',
};

module.exports = route;