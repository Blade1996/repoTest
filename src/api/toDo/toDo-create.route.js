'use strict';

const Joi = require('joi');
const handler = require('./toDo-create.handler');
const { getToDo } = require('./toDo.pre');

const route = {
	handler, // el metodo del servicio
	method: 'POST', // metodo http
	options: {
		auth: false, // no requiera autenticación
		pre: [
			{
				assign: 'validToDo',
				method: getToDo,
			},
		], // serie de validaciones antes de enviar al handler
		validate: {
			payload: {
				activity: Joi.string().required(),
			},
			query: {
				search: Joi.string().allow(null, ''),
			},
		}, // aqui se colocara los valores que va a recibir el servicio

	},
	path: '/to-do/create',
};

module.exports = route;

