'use strict';

const { Model, transaction, raw } = require('objection');
const baseModel = require('./base');
const Terminal = require('./../models/Terminal');
const SalSeries = require('./../models/SalSeries');
const helper = require('./helper');
const { isDevOrProd } = require('./../shared/helper');
const SyncFirebase = require('../external-apis/apis-strategies/processSync/SyncFirebase');
const { isNullOrUndefined } = require('util');

class ComSubsidiaries extends baseModel {
	static get tableName() {
		return 'com_subsidiaries';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_subsidiaries.company_id',
					to: 'com_companies.id',
				},
			},
			commerces: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_subsidiaries.id',
					to: 'com_ecommerce_company.subsidiary_id',
				},
			},
			orders: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_subsidiaries.id',
					to: 'sal_orders.subsidiary_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['sucursalName', 'sucursalCode'],
			properties: {
				sucursalName: {
					type: 'string',
				},
				latitude: {
					type: ['integer', 'null'],
				},
				longitude: {
					type: ['integer', 'null'],
				},
				location: {
					type: ['string', 'null'],
				},
				ubigeo: {
					type: ['string', 'null'],
				},
				sucursalCode: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				address: {
					type: ['string', 'null'],
				},
				departmentId: {
					type: ['integer', 'null'],
				},
				provinceId: {
					type: ['integer', 'null'],
				},
				districtId: {
					type: ['integer', 'null'],
				},
				contactName: {
					type: ['string', 'null'],
				},
				contactLastname: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				ruc: {
					type: ['string', 'null'],
				},
				rzSocial: {
					type: ['string', 'null'],
				},
				flagTaxes: {
					type: ['integer', 'null'],
					default: 0,
				},
				typeAmbientTax: {
					type: ['integer', 'null'],
				},
				flagCreditDispatch: {
					type: ['boolean', 'integer'],
					default: true,
				},
				debtsSales: {
					type: ['object', 'null'],
					default: {},
				},
				specialContributor: {
					type: ['string', 'null'],
				},
				flagAccount: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				flagDefault: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				rise: {
					type: ['string', 'null'],
				},
				tokenStore: {
					type: ['string', 'null'],
				},
				flagAccountingEngine: {
					type: ['boolean', 'null'],
					default: false,
				},
				flagAccountingAutomatic: {
					type: ['boolean', 'null'],
					default: false,
				},
				urlLogo: {
					type: ['string', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				distributorCustomerId: {
					type: ['integer', 'null'],
				},
				settings: {
					type: ['object', 'null'],
					default: {},
				},
				flagIntegrations: {
					type: ['boolean', 'null'],
					default: false,
				},
				subsidiaryAclCode: {
					type: ['string', 'null'],
				},
				configIntegrations: {
					type: ['object', 'null'],
				},
				flagCompanyDefault: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				warehousesRelated: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			configColumns: builder => builder.select('id', 'ruc', 'config_integrations'),
			simpleColumns: builder => builder.select(`${this.tableName}.subsidiary_acl_code`, 'ruc'),
			basicColumns: builder => builder.select('id', 'ruc'),
			reportColumns: builder => builder.select(this.reportColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'sucursal_name',
			'location',
			'ubigeo',
			'sucursal_code',
			'phone',
			'address',
			'department_id',
			'province_id',
			'district_id',
			'contact_name',
			'contact_lastname',
			'email',
			'url_image',
			'website_description',
			'ruc',
			'rz_social',
			'flag_taxes',
			'type_ambient_tax',
			'flag_credit_dispatch',
			'debts_sales',
			'special_contributor',
			'flag_account',
			'rise',
			'settings',
			'flag_accounting_engine',
			'flag_accounting_automatic',
			'url_logo',
			'company_id',
			'subsidiary_id',
			'distributor_customer_id',
			'flag_integrations',
			'subsidiary_acl_code',
			'config_integrations',
			'flag_company_default',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static reportColumns(otherColumns = []) {
		const columns = [
			'id',
			'sucursal_name',
			'location',
			'ubigeo',
			'sucursal_code',
			'phone',
			'address',
			'ruc',
			'rz_social',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['rucName'];
	}

	get rucName() {
		return `${this.ruc} - ${this.sucursalName}`;
	}

	static getReportData(subsidiaryId, companyId, filter = {}) {
		const query = this.query()
			.select(this.reportColumns())
			.eager('orders(selectColumns)');
		if (filter) {
			query.modifyEager('pedidos', (builder) => {
				// if (filter.liquidDate) {
				// 	builder.where('liquid_date', filter.liquidDate);
				// }
				// if (filter.liquidStatus) {
				// 	builder.where('liquid_status', filter.liquidStatus);
				// }
				if (filter.commerceId) {
					builder.where('commerce_id', filter.commerceId);
				}
			});
		}
		query.where(`${this.tableName}.id`, subsidiaryId);
		query.where('company_id', companyId);
		return query;
	}

	static getAll(filter = {}, companyId, aclFilters = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.aclFilter(aclFilters.subsidiaries)
			.where('flag_active', true)
			.where('company_id', companyId);

		if (filter.flagIntegrations) {
			query.where('flag_integrations', 1);
		}

		if (filter.flagCompanyDefault) {
			query.where('flag_company_default', filter.flagCompanyDefault);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getQuantityOfSubsidiaries(companyId) {
		return this.query()
			.where('company_id', companyId)
			.count('*')
			.first();
	}

	static getByCompanyDefault(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('flag_company_default', true)
			.first();
	}

	static getByIds(ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('id', ids);
	}

	static getById(id, params = {}) {
		const { columns } = params;
		return this.query()
			.eager('[commerces(basicColumns), company(selectColumns)]')
			.select(this.defaultColumns(columns))
			.findById(id);
	}

	static getByCode(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sucursal_code', code)
			.where('company_id', companyId)
			.first();
	}

	static getBySubsidiaryAclCode(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('subsidiary_acl_code', code)
			.where('company_id', companyId)
			.first();
	}

	static getByIdAndCompany(id, companyId, eager = []) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
		query = this.includeFilterEager(query, eager, 'fairColumns');
		return query;
	}

	static getByCompany(id) {
		return this.query().where(`${this.tableName}.company_id`, id);
	}

	static getByRuc(ruc, companyId, eager = []) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('ruc', ruc)
			.where('company_id', companyId)
			.first();
		query = this.includeFilterEager(query, eager, 'fairColumns');
		return query;
	}

	static getByRucPublic(ruc) {
		return this.query()
			.select(this.defaultColumns())
			.where('ruc', ruc)
			.first();
	}

	static async createOnly(data, httpNewProducts, trx) {
		const newData = Object.assign({}, data);
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		delete newData.latitude;
		delete newData.longitude;
		delete newData.isPublic;
		const subsidiary = await this.query(trx).insert(newData);
		if (isDevOrProd() && httpNewProducts) {
			if (!data.isPublic) {
				await httpNewProducts.post(`/warehouses-series/${subsidiary.id}/subsidiaries`, {});
			} else {
				await httpNewProducts.post(`/warehouses-series/${subsidiary.id}/subsidiaries/public`, {});
			}
		}
		return subsidiary;
	}

	static create(warehousesId, typeDocument, data) {
		const newData = Object.assign({}, data);
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		delete newData.latitude;
		delete newData.longitude;
		let newSubsidiary;
		const company = newData.companyId;
		const knex = ComSubsidiaries.knex();
		return transaction(knex, () =>
			this.query()
				.insert(newData)
				.then((newRecord) => {
					newSubsidiary = newRecord;
					const dataTerminals = {
						comSubsidiariesId: newSubsidiary.id,
						warWarehousesId: warehousesId,
						salTypeTerminalsId: 1,
						typeTerminal: 1,
						code: 'codigo',
						sunatCode: 'codigo sunat',
						name: `Terminal-${newData.sucursalName}`,
						description: 'descripcion terminal',
						printCode: 'color code',
						companyId: company,
					};
					return Terminal.create(dataTerminals);
				})
				.then((newTerminal) => {
					let dataSalSeries;
					newSubsidiary.terminalId = newTerminal.id;
					const newDataSalSeries = typeDocument.map((item) => {
						dataSalSeries = {
							comSubsidiariesId: newSubsidiary.id,
							salTerminalsId: newTerminal.id,
							salTypeDocumentsId: item.id,
							number: '0',
							companyId: company,
							serie: `0${item.id}`,
						};
						return dataSalSeries;
					});
					return SalSeries.createMultiple(newDataSalSeries);
				})
				.then(() => newSubsidiary));
	}

	static edit(id, data) {
		const newData = Object.assign({}, data);
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		delete newData.latitude;
		delete newData.longitude;
		return this.query()
			.patch(newData)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static async editDebtsSales({ debtsSales = 0, currency }, id, companyId) {
		const data = await this.getById(id);
		data.debtsSales = data.debtsSales || {};
		data.debtsSales[currency] = data.debtsSales[currency]
			? data.debtsSales[currency] + debtsSales
			: debtsSales;
		return this.query()
			.patch({ debtsSales: data.debtsSales })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getDefault(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_default', true)
			.where('company_id', companyId)
			.first();
	}

	static getFirstOne(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.first();
	}

	static editFlagDefault(id, flagDefault, companyId) {
		return this.query()
			.patch({ flagDefault })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByTokenStore(tokenStore) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[company(selectColumns).country(selectColumns)]')
			.where('token_store', tokenStore)
			.first();
	}

	static getAllPublic(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getSubsidiaryCompany(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_active', true)
			.where('company_id', companyId);
	}

	static async buildAndCreateWarehouse(data, subsidiaryId, companyId, httpNewProducts) {
		if (data.warehouseId) {
			const { data: warehouse } = await httpNewProducts.get(`/warehouses/${data.warehouseId}?simple=true`);
			return warehouse;
		}
		const warehouseBuilt = {
			subsidiaryId,
			name: data.warehouseName || `ALMACEN ${data.commerceName}`,
			code: `WAREHOUSE-${data.commerceName}-${data.documentNumber}`,
			longitude: data.longitude,
			latitude: data.latitude,
			address: data.address,
			companyId,
		};
		const { data: warehouse } = await httpNewProducts.post('/warehouses/public', warehouseBuilt);
		return warehouse;
	}

	static async getAccountingIntegration(companyId) {
		const subsidiaries = await ComSubsidiaries.getAll({ flagIntegrations: true }, companyId);
		return { flagSubsidiaryConfig: !!subsidiaries.length > 0, subsidiaryConfig: subsidiaries };
	}

	static getSubsidiaryFilters({ subsidiary }) {
		if (subsidiary.subsidiaryAclCode) {
			return {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				ruc: subsidiary.ruc,
				integrationCode: 'firebase_sync',
				categoryCode: 'APPLICATION_PERSISTENCE',
			};
		}
		return null;
	}

	static async createAccountingConfiguration({
		credentials,
		source,
		companyId,
		subsidiaryFilters,
		flagGetData = false,
	}) {
		const initSource = [
			{
				accountingAutomatic: false,
				code: 'sales',
				flagActive: false,
				id: 1,
				name: 'Ventas',
			},
			{
				accountingAutomatic: false,
				code: 'purchases',
				flagActive: false,
				id: 2,
				name: 'Compras',
			},
			{
				accountingAutomatic: false,
				code: 'CXC',
				flagActive: false,
				id: 3,
				name: 'Cuentas por Cobrar',
			},
			{
				accountingAutomatic: false,
				code: 'CXP',
				flagActive: false,
				id: 4,
				name: 'Cuentas por Pagar',
			},
			{
				accountingAutomatic: false,
				code: 'cash',
				flagActive: false,
				id: 5,
				name: 'Caja',
			},
			{
				accountingAutomatic: false,
				code: 'bank',
				flagActive: false,
				id: 6,
				name: 'Banco',
			},
		];
		const fakeRequest = {
			auth: { credentials },
			response: {
				source: source || initSource,
			},
		};
		await SyncFirebase.createMultiple(
			companyId,
			{
				typeRegister: 'accountingConfiguration',
				subsidiaryFilters,
			},
			fakeRequest,
		);
		if (flagGetData) {
			return this.getAccountingConfiguration({ companyId, subsidiaryFilters, credentials });
		}
		return { data: source || initSource };
	}

	static async getAccountingConfiguration({ companyId, subsidiaryFilters, credentials }) {
		let dataResult = await SyncFirebase.getByEntity(companyId, {
			typeRegister: 'accountingConfiguration',
			subsidiaryFilters,
			credentials,
		});
		if (dataResult) {
			dataResult = JSON.parse(JSON.stringify(dataResult));
			if (!isNullOrUndefined(dataResult)) {
				return { data: SyncFirebase.formatArray(dataResult) };
			}
		}
		return { data: [] };
	}

	static getByIdSimple(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static getAssignedForCommerce(subsidiaryBuilt, httpNewProducts, trx) {
		if (subsidiaryBuilt.id) {
			return subsidiaryBuilt;
		}
		return ComSubsidiaries.createOnly(subsidiaryBuilt, httpNewProducts, trx);
	}

	static editFlagActive(id, companyId) {
		return this.query()
			.patch({ flagActive: true })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getFlagCompanyDefault(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('id', id)
			.where('flag_company_default', true)
			.where('company_id', companyId)
			.first();
	}

	static updateLoyalti(id, settings, companyId) {
		return this.query()
			.patch({ settings })
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByIdCompany(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static async getDefaultOrFirst(companyId) {
		const defaultOne = await this.getDefault(companyId);
		if (defaultOne) {
			return defaultOne;
		}
		const firstOne = await this.getFirstOne(companyId);
		return firstOne;
	}

	static editSalesCronDate(id, companyId) {
		return this.query()
			.patch({ salesCronDate: raw('NOW()') })
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = ComSubsidiaries;
