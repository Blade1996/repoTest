'use strict';

const Joi = require('joi');
const handler = require('./categories-update.handler');
const {  ValidExists, getCategories } = require('./categories.pre');

const route = {
	handler, // el metodo del servicio
	method: 'PATCH', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				method: ValidExists,
			},
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
			params: {

                id: Joi.number().integer().required(),
		
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/categories/{id}',
};

module.exports = route;

