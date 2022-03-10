'use strict';

const Joi = require('joi');
const handler = require('./categories-delete.handler');
const {  ValidExists } = require('./categories.pre');

const route = {
	handler, // el metodo del servicio
	method: 'DELETE', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				method: ValidExists,
			},
           
		], // serie de validaciones antes de enviar al handler
		validate: {
		
			params: {

                id: Joi.number().integer().required(),
		
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/categories/{id}',
};

module.exports = route;

