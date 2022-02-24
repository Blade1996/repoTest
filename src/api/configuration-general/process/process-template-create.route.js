'use strict';

const Joi = require('joi');
const handler = require('./process-template-create.handler');
const { getProcess } = require('./process.pre');

const route = {
	handler,
	method: 'POST',
	options: {
		pre: [
			{
				assign: 'process',
				method: getProcess,
			},
		],
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.required(),
			},
			payload: {
				name: Joi.string().allow('', null),
				typeNotificationCode: Joi.string().required(),
				urlImage: Joi.string().allow('', null),
				tramaHtml: Joi.string().allow('', null),
				flagTemplateDefault: Joi.boolean().default(false),
			},
		},
	},
	path: '/process/{id}/new-template',
};

module.exports = route;
