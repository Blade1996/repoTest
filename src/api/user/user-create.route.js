'use strict';

const Joi = require('joi');
const handler = require('./user-create.handler');
const { getUser } = require('./user.pre');

const route = {
	handler, // el metodo del servicio
	method: 'POST', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				assign: 'validUser',
				method: getUser,
			},
		],
		// serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				name: Joi.string().required(),
			},
			query: {
				search: Joi.string().allow(null, ''),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/user/create',
};

module.exports = route;

