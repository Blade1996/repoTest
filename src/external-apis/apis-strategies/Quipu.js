/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const simpleAxios = require('./../../api/shared/simple-axios');
const ExternalApisContract = require('../ExternalApisContract');
const { quipu } = require('./apis-strategies-codes');
const { accounting } = require('../category-external-apis-enums');
const helper = require('../../models/helper');
const ComSubsidiaries = require('../../models/ComSubsidiaries');
const { defaultAxios } = require('../../api/shared/pre');
// const { configInitError } = require('../error-codes/external-apis-error-codes');

class Quipu extends ExternalApisContract {
	constructor(data, categoryCode = accounting) {
		super();
		this.data = data;
		this.categoryCode = categoryCode;
	}

	getUrlApi(env = 'dev') {
		const url = {
			dev: 'https://motordev.perudatos.com',
			prod: 'https://motor.makipos.la',
		};
		return url[env];
	}

	async configInit({ countryId }) {
		this.data.countryId = countryId || 1;
		const { newConfigCredentials: dataAccountant } = this.data;
		const { flagAccountant, codeAccountant } = dataAccountant;
		let responseQuipu = {};
		const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
		if (!flagAccountant) {
			responseQuipu = await simpleAxios({
				url: `${this.getUrlApi(env)}/company`,
				method: 'POST',
				data: {
					name: `${dataAccountant.name} ${dataAccountant.lastname}`,
					nameCompany: `${dataAccountant.name} ${dataAccountant.lastname}`,
					countryId: this.data.countryId,
					flagTypePerson: dataAccountant.flagTypePerson || 1,
					ruc: dataAccountant.documentNumber,
					dni: dataAccountant.documentNumber,
					email: dataAccountant.user,
					user: dataAccountant.user,
					password: dataAccountant.password,
					settings: this._getSetting(),
				},
				validateStatus: () => true,
			});
		} else {
			responseQuipu = await simpleAxios({
				url: `${this.getUrlApi(env)}/company/${codeAccountant}/affiliate`,
				method: 'POST',
				data: {
					settings: this._getSetting(),
				},
				validateStatus: () => true,
			});
		}
		await this._updateSubsidiary();
		return responseQuipu.data || {};
	}

	async _updateSubsidiary() {
		const { subsidiary } = this.data;
		const dataUpdate = {
			flagAccountingEngine: true,
			flagAccountingAutomatic: false,
			flagIntegrations: true,
			configIntegrations: {
				centerCost: {
					data: [],
					flagActive: false,
				},
				accountingPlan: {
					uploadPlan: false,
				},
				accountingConfiguration: {
					data: [
						{
							code: 'sales',
							name: 'Ventas',
							flagActive: true,
							accountingAutomatic: false,
						},
						{
							code: 'purchases',
							name: 'Compras',
							flagActive: true,
							accountingAutomatic: false,
						},
						{
							code: 'CXC',
							name: 'Cuentas por Cobrar',
							flagActive: false,
							accountingAutomatic: false,
						},
					],
				},
			},
		};
		return ComSubsidiaries.edit(subsidiary.id, dataUpdate);
	}

	async create() {
		try {
			const { serviceData, request } = this.data;
			const { credentials } = request.auth;
			const { configIntegrations, codeAccounting } = serviceData;
			delete serviceData.configIntegrations;
			delete serviceData.codeAccounting;
			if (configIntegrations && configIntegrations.accountingConfiguration) {
				const { data } = configIntegrations.accountingConfiguration;
				const config = data.find(i => i.code === codeAccounting && i.flagActive);
				if (config) {
					const hapiAxios = defaultAxios('httpContable', request);
					await hapiAxios.post('/accounting-seats', {
						...serviceData,
						typeAccounting: config.accountingAutomatic ? 1 : 0,
						credentials,
					});
				}
			}
			return serviceData;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_VLAIDATION', error.data);
			return error;
		}
	}

	_getSetting() {
		const {
			subsidiary,
			employee,
			countryId,
			newConfigCredentials: dataAccountant,
			aclCredentials,
		} = this.data;
		return {
			originApp: 'MAKI',
			integrationCode: quipu,
			customerExternalId: subsidiary.companyId,
			customerData: {
				name: subsidiary.company.companyName,
				ruc: subsidiary.company.ruc,
				email: subsidiary.company.email,
				phone: subsidiary.company.phone,
				aclCode: subsidiary.company.aclCode,
				externalId: subsidiary.companyId,
				countryId,
				additionalInformation: {
					logo: subsidiary.company.logo,
					flagTest: subsidiary.company.flagTest,
					comItemId: subsidiary.company.comItemId,
				},
			},
			subsidiaryExternalId: subsidiary.id,
			subsidiaryData: {
				name: subsidiary.sucursalName,
				documentNumber: subsidiary.ruc,
				startDateOperations: helper.localDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
				externalId: subsidiary.id,
				filters: {
					subsidiaryFilters: ComSubsidiaries.getSubsidiaryFilters({ subsidiary }),
					aclCredentials,
				},
			},
			auxiliaryExternalId: employee.id,
			auxiliaryData: {
				userName: `${employee.name} ${employee.lastname}`,
				personId: employee.personId,
				userCode: employee.aclUserCode,
				userId: employee.id,
				status: 1,
				flagAccountant: 1,
				email: dataAccountant.user || dataAccountant.codeAccountant,
				phone: employee.phone,
				numberDocument: employee.documentNumber,
			},
		};
	}
}

module.exports = Quipu;
