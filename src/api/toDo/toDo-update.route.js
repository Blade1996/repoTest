'use strict';

const Joi = require('joi');
const handler = require('./toDo-update.handler');
const { validExits, getToDo } = require('./toDo.pre');

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
				assign: 'validToDo',
				method: getToDo,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				activity: Joi.string().required(),
				done: Joi.boolean().default(false),
				flagActive: Joi.boolean().default(true),
			},
			params: {
				id: Joi.number().integer().required(),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/to-do/{id}',
};

module.exports = route;

