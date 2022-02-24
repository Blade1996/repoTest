/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const ExternalApisContract = require('../ExternalApisContract');
// const { firebaseSync } = require('./apis-strategies-codes');
const SyncFirebase = require('./processSync/SyncFirebase');
const SalOrders = require('../../models/SalOrders');
const Sales = require('../../models/Sales');
const validServicesSync = require('../apis-strategies/processSync/PathServicesSync');
const { applicationPersistence } = require('../category-external-apis-enums');

class Firebase extends ExternalApisContract {
	constructor(data, categoryCode = applicationPersistence) {
		super();
		this.data = data;
		this.categoryCode = categoryCode;
	}

	async configInit() {
		const { newConfigCredentials } = this.data;
		const codeBase64 = newConfigCredentials.privateKey.split(',');
		const newCodeBase64 = codeBase64.length > 1 ? codeBase64[1] : newConfigCredentials.privateKey;
		newConfigCredentials.privateKey = Buffer.from(newCodeBase64, 'base64').toString();
		return newConfigCredentials;
	}

	async create() {
		const { companyId, serviceData, request } = this.data;
		const { id } = request.response.source;
		const { typeRegister } = serviceData;
		const { isSync } = await this._validEntityCreate({ id, companyId, typeRegister });
		if (!isSync) {
			return SyncFirebase.create(companyId, serviceData, request)
				.then(response =>
					this._editEntitySync({
						id,
						companyId,
						typeRegister,
						response:
							response && response.status
								? { status: response.status, data: response.data }
								: response,
					}))
				.catch((error) => {
					// eslint-disable-next-line no-console
					console.log('Error firebase sync ', error);
					return this._editEntitySync({
						id,
						companyId,
						typeRegister,
						response: { status: 400 },
					});
				});
		}
		return Promise.resolve();
	}

	async createComplete() {
		const {
			path, method, request, originPlatform, configSync, companyId,
		} = this.data;
		return (
			validServicesSync({
				path,
				method,
				rawPath: request.path,
				originPlatform,
				configSync,
				source: request.response.source,
			})
				.then((processSync) => {
					if (processSync.eurekaService) {
						const { subsidiaryFilters, serviceSync } = processSync;
						this.data = {
							companyId,
							serviceData: { ...serviceSync, info: request.info, subsidiaryFilters },
							request,
						};
						return this.create({});
					}
					return request.response;
				})
				// eslint-disable-next-line no-console
				.catch(error => console.log('Error process sync config Class ', error))
		);
	}

	async _validEntityCreate({ id, typeRegister, companyId }) {
		let isSync = false;
		if (typeRegister === 'orders' && id) {
			isSync = await SalOrders.isSync({ id, companyId });
		} else if (typeRegister === 'sales') {
			await Sales.editSynStatus({ id, companyId, flagSyncFb: 4 });
		}
		return { isSync: !!isSync };
	}

	async _editEntitySync({
		id, typeRegister, companyId, response = { status: 200 },
	}) {
		if (typeRegister === 'orders' && id) {
			return SalOrders.editSynStatus({ id, companyId });
		} else if (typeRegister === 'sales') {
			const { status } = response || {};
			// eslint-disable-next-line no-console
			const flagSyncFb = status === 200 || status === 201 ? 1 : 3;
			return Sales.editSynStatus({ id, companyId, flagSyncFb });
		}
		return Promise.resolve();
	}
}

module.exports = Firebase;
