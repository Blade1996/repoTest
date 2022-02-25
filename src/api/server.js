'use strict';

const Glue = require('glue');
const AuthBearer = require('hapi-auth-bearer-token');
const dbConfig = require('./../config/objection');
const validate = require('./authenticate-token');
const validateStore = require('./authenticate-store');
const validateCompany = require('./validate-company');
const plugins = require('./plugins-register');
const cacheConfig = require('./cache');
const cookie = require('./cookieAuthenticate');
const { isDevOrProd } = require('../shared/helper');
// const validServicesSync = require('../external-apis/apis-strategies/processSync/PathServicesSync');
// const ExternalApis = require('../external-apis/ExternalApisStrategy');
// const { firebaseSync } = require('../external-apis/apis-strategies/apis-strategies-codes');
const { getMessageError } = require('./shared/httpHelper');

dbConfig.initConnection();

const options = {
	cache: cacheConfig,
	host: process.env.HOST,
	port: process.env.PORT,
	routes: {
		security: true,
		cors: {
			origin: ['*'],
			exposedHeaders: ['x-quantity', 'x-last-page', 'X-Frame-Options'],
			credentials: true,
		},
	},
	state: cookie,
};

const manifest = {
	server: options,
	register: {
		plugins,
	},
};

process.on('unhandledRejection', (err) => {
	/* eslint-disable no-console */
	console.log('ZOMG', err);
	process.exit(1);
});

module.exports = Glue.compose(
	manifest,
	{
		preRegister: async (server) => {
			await server.register(AuthBearer);
			server.auth.strategy('hash', 'bearer-access-token', {
				validate: validateCompany,
			});
			server.auth.strategy('store', 'bearer-access-token', {
				validate: validateStore,
			});
			if (isDevOrProd()) {
				server.auth.strategy('simple', 'bearer-access-token', {
					validate,
				});
				server.auth.default('simple');
				server.ext('onPreResponse', (request) => {
					server.plugins['hapi-raven'].client.setContext({
						user: request.auth.credentials,
					});
					if (request.response.isBoom && request.response.output.statusCode === 400) {
						const newOutPut = request.response.output;
						if (newOutPut.payload.message && newOutPut.payload.message.indexOf(' ' < 0)) {
							newOutPut.payload.messageError = getMessageError(newOutPut.payload.message);
						}
						if (request.response.data && request.response.data.details) {
							newOutPut.payload.details = request.response.data.details;
						}
						server.plugins['hapi-raven'].client.captureException(request.response, {
							extra: {
								query: request.query,
								payload: request.payload,
								params: request.params,
								response: { ...request.response, output: newOutPut },
							},
							level: 'warning',
							tags: {
								statusCode: 400,
							},
						});
					}
					return request.response;
				});
				await server.events.on('response', async (request) => {
					if (request.route && request.response && request.response.source) {
						const { source } = request.response;
						const { path, method } = request.route;
						const { originPlatform } = source;
						const companyId = source.companyId || source.comCompanyId;
						const subsidiaryId = source.subsidiaryId || source.comSubsidiaryId;
						if (path && method && companyId && subsidiaryId) {
							const configSync = await request.server.methods.getConfigSync({
								companyId,
								subsidiaryId,
							});

							return validServicesSync({
								path,
								method,
								rawPath: request.path,
								originPlatform,
								configSync,
								source,
							})
								.then((processSync) => {
									if (processSync.eurekaService) {
										const summaryRequest = {
											auth: {
												credentials: request.auth.credentials,
											},
											response: {
												source,
											},
										};
										const { subsidiaryFilters, serviceSync, statusSync } = processSync;
										const externalApisInstance = new ExternalApis(
											{
												companyId,
												serviceData: {
													...serviceSync,
													info: request.info,
													subsidiaryFilters,
													statusSync,
												},
												request: summaryRequest,
											},
											firebaseSync,
										);
										// eslint-disable-next-line no-await-in-loop
										externalApisInstance.create({});
									}
									return request.response;
								})
								.catch(error => console.log('Error process sync config ', error));
						}
					}
					return request.response;
				});
			}
		},
	},
);
