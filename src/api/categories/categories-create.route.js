'use strict';

const Joi = require('joi');
const handler = require('./categories-create.handler');
const { getCategories } = require('./categories.pre');

const route = {
	handler, // el metodo del servicio
	method: 'POST', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				assign: 'validCategories',
				method: getCategories,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				name: Joi.string().required(),
				description: Joi.string().required(),
				done: Joi.boolean().required(),
				
			},
			query: {
				search: Joi.string().allow(null, ''),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/categories/create',
};

module.exports = route;

