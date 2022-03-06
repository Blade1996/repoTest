'use strict';

const Joi = require('joi');
const handler = require('./users-update.handler');
const { validExits, getUser } = require('./users.pre');

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
				assign: 'validUser',
				method: getUser,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				name: Joi.string().required(),
                email:Joi.string().required(),
                password:Joi.string().required(),
				done: Joi.boolean().default(false),
			},
			params: {
				id: Joi.number().integer().required(),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/user/{id}',
};

module.exports = route;

