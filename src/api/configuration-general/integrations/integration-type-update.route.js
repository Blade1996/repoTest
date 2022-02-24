'use strict';

const Joi = require('joi');
const { failAction } = require('./../../shared/httpHelper');
const handler = require('./integration-type-update.handler');
const {
	getIntegrationType,
	getSubsidiary,
	getIntegrationsConfig,
	getIntegrationsCategories,
	getWayPaymentDefault,
	validSubsidiaryDefault,
} = require('./integration.pre');

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
				assign: 'subsidiaryDefault',
				method: validSubsidiaryDefault,
			},
			{
				assign: 'subsidiary',
				method: getSubsidiary,
			},
			{
				assign: 'comIntegrations',
				method: getIntegrationsConfig,
			},
			{
				assign: 'comIntegrationCategory',
				method: getIntegrationsCategories,
			},
			{
				assign: 'wayPayment',
				method: getWayPaymentDefault,
			},
		],
		validate: {
			params: {
				codeType: Joi.string().required(),
			},
			query: {
				subsidiaryId: Joi.number()
					.integer()
					.allow(null, ''),
			},
			payload: {
				integrationCategory: Joi.array()
					.required()
					.items(Joi.object({
						code: Joi.string(),
						name: Joi.string(),
						integrations: Joi.array()
							.items(Joi.object({
								id: Joi.number()
									.integer()
									.positive()
									.required(),
								code: Joi.string().required(),
								name: Joi.string().required(),
								flagCustomizer: Joi.boolean(),
								flagActive: Joi.boolean(),
								flagInternal: Joi.boolean(),
								config: Joi.object().allow(null),
								configAdditional: Joi.object()
									.allow(null)
									.default({}),
							}))
							.required(),
					})),
			},
			failAction,
		},
	},
	path: '/integrations/{codeType}',
};

module.exports = route;
