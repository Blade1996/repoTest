'use strict';

const Joi = require('joi');
const handler = require('./process-details.handler');
const { getProcess, getProcessSubsidiary, getSubsidiary } = require('./process.pre');

const route = {
	handler,
	method: 'GET',
	options: {
		pre: [
			{
				assign: 'subsidiary',
				method: getSubsidiary,
			},
			{
				assign: 'process',
				method: getProcess,
			},
			{
				assign: 'processSubsidiary',
				method: getProcessSubsidiary,
			},
		],
		validate: {
			params: {
				id: Joi.number()
					.integer()
					.required(),
			},
		},
	},
	path: '/process/{id}',
};

module.exports = route;
