'use strict';

const Joi = require('joi');
const handler = require('./product-create.handler');
const { getProduct } = require('./product.pre');

const route = {
	handler, // el metodo del servicio
	method: 'POST', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				assign: 'validProduct',
				method: getProduct,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				name: Joi.string().required(),
				description: Joi.string().required(),
				quantity: Joi.number().integer(),
			},
			query: {
				search: Joi.string().allow(null, ''),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/product/create',
};

module.exports = route;

