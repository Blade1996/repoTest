'use strict';

const Joi = require('joi');
const handler = require('./process-update.handler');
const { failAction } = require('./../../shared/httpHelper');
const { getProcessDetail, getSubsidiary, getIntegrationType } = require('./process.pre');

const route = {
	handler,
	method: 'PATCH',
	options: {
		pre: [
			{
				assign: 'integrationType',
				method: getIntegrationType,
			},
			{
				assign: 'subsidiary',
				method: getSubsidiary,
			},
			{
				assign: 'processDetail',
				method: getProcessDetail,
			},
		],
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.required(),
			},
			failAction,
			payload: {
				name: Joi.string(),
				ambit: Joi.string(),
				typeNot: Joi.array()
					.items(Joi.object({
						code: Joi.string().required(),
						name: Joi.string()
							.allow('', null)
							.default('N/A'),
						urlImage: Joi.string().allow('', null),
						flagActive: Joi.boolean().required(),
						templates: Joi.array().items(Joi.object({
							code: Joi.string().required(),
							name: Joi.string().required(),
							urlImage: Joi.string().allow('', null),
							flagActive: Joi.boolean().required(),
						}).allow(null)),
						services: Joi.array().items(Joi.object({
							method: Joi.string().required(),
							path: Joi.string().required(),
							typeRegister: Joi.string().required(),
							exceptions: Joi.array()
								.items(Joi.string())
								.allow(null),
						}).allow(null)),
						templateStructure: Joi.object().allow(null),
						actions: Joi.object().allow(null),
					}))
					.required(),
				moduleId: Joi.number()
					.integer()
					.positive(),
			},
		},
	},
	path: '/process/{id}',
};

module.exports = route;
