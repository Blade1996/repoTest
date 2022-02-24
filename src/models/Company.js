'use strict';

const { Model, transaction, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComEmployee = require('./../models/ComEmployee');
const Customer = require('./../models/Customer');
const TypeDocument = require('./../models/TypeDocument');
const ComSubsidiaries = require('./../models/ComSubsidiaries');
const Terminal = require('./../models/Terminal');
const SalSeries = require('./../models/SalSeries');
const TypePayment = require('./../models/TypePayment');
const SalPriceLists = require('./../models/SalPriceLists');
const CompanyReport = require('./../models/CompanyReport');
const PurTypeExpense = require('./../models/PurTypeExpense');
const Person = require('./../models/Person');
const TypeEntity = require('./../models/TypeEntity');
const ComPerson = require('./../models/ComPerson');
const TypePerson = require('./../models/TypePerson');
const Cash = require('./../models/Cash');
const General = require('./General');
const TypeGeneral = require('./TypeGeneral');
const ModuleCode = require('./../models/ModuleCode');
const TypeTerminal = require('./enums/type-terminals-enum');
const ComSubsidiaryWithholding = require('./ComSubsidiaryWithholding');

class Company extends baseModel {
	static get tableName() {
		return 'com_companies';
	}

	static get relationMappings() {
		return {
			item: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Item.js`,
				join: {
					from: 'com_companies.com_item_id',
					to: 'com_item.id',
				},
			},
			country: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Country.js`,
				join: {
					from: 'com_companies.com_country_id',
					to: 'com_country.id',
				},
			},
			currencies: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComCurrency.js`,
				join: {
					from: 'com_companies.id',
					to: 'com_currency.company_id',
				},
			},
			currencyDefault: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Currency.js`,
				join: {
					from: 'com_companies.currency',
					to: 'ms_currency.id',
				},
			},
			subsidiary: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_companies.id',
					to: 'com_subsidiaries.company_id',
				},
			},
			commerceSubsidiaries: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				filter: query =>
					query
						.select(raw('ANY_VALUE(com_ecommerce_company.warehouses_related) as warehouses_related, ANY_VALUE(com_ecommerce_company.subsidiary_id) as subsidiary_id'))
						.groupBy('com_ecommerce_company.subsidiary_id')
						.limit(2),
				join: {
					from: 'com_companies.id',
					through: {
						modelClass: `${__dirname}/ComEcommerceCompany.js`,
						from: 'com_ecommerce_company.company_id',
						to: 'com_ecommerce_company.subsidiary_id',
					},
					to: 'com_subsidiaries.id',
				},
			},
			salPriceListDefault: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalPriceLists.js`,
				filter: query => query.where('flag_default', true),
				join: {
					from: 'com_companies.id',
					to: 'sal_price_lists.company_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comItemId', 'companyName'],
			properties: {
				comItemId: {
					type: 'integer',
				},
				code: {
					type: 'string',
				},
				credential: {
					type: ['string', 'null'],
				},
				companyName: {
					type: 'string',
				},
				address: {
					type: ['string', 'null'],
				},
				companyRzSocial: {
					type: ['string', 'null'],
				},
				quoationReportCode: {
					type: 'string',
				},
				saleReportCode: {
					type: 'string',
				},
				commerceCode: {
					type: ['string', 'null'],
				},
				areaCode: {
					type: 'string',
				},
				currency: {
					type: ['string', 'null'],
				},
				email: {
					type: 'string',
				},
				languageId: {
					type: 'string',
				},
				languageJson: {
					type: 'object',
				},
				logo: {
					type: ['string', 'null'],
				},
				comCountryId: {
					type: ['integer', 'null'],
				},
				cityId: {
					type: 'integer',
				},
				ruc: {
					type: 'string',
				},
				website: {
					type: 'string',
				},
				websiteDescription: {
					type: 'string',
				},
				companyPlan: {
					type: 'object',
				},
				phone: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: 'array',
				},
				bankAccount: {
					type: 'array',
				},
				weight: {
					type: 'string',
				},
				convertWeightTo: {
					type: 'string',
				},
				settings: {
					type: 'object',
				},
				flagPlan: {
					type: ['boolean', 'integer'],
				},
				taxIgv: {
					type: ['boolean', 'integer'],
				},
				flagBarcodeReader: {
					type: ['boolean', 'integer'],
				},
				flagGeneric: {
					type: ['boolean', 'integer'],
				},
				aclId: {
					type: 'integer',
				},
				aclCode: {
					type: 'string',
				},
				banners: {
					type: 'array',
					default: [],
				},
				theme: {
					type: ['object', 'null'],
					default: {
						primary: '#05579b',
						secondary: '#18324e',
						accent: '#005CAF',
						error: '#FF5253',
						info: '#2DB6F5',
						success: '#4DC68C',
						warning: '#FFB74C',
						pink: '#fe6b7d',
					},
				},
				companyId: {
					type: ['integer', 'null'],
				},
				flagAccount: {
					type: ['boolean', 'integer'],
				},
				socialMedia: {
					type: ['array', 'null'],
				},
				templateCode: {
					type: ['string', 'null'],
				},
				colorCode: {
					type: ['string', 'null'],
				},
				flagTest: {
					type: ['boolean', 'integer', 'null'],
				},
				configIntegration: {
					type: ['object', 'null'],
				},
				flagMaster: {
					type: ['boolean', 'integer', 'null'],
				},
				plans: {
					type: ['object', 'null'],
				},
				flagLoyalti: {
					type: ['boolean', 'integer'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'address',
			'code',
			'com_item_id',
			'company_name',
			'company_rz_social',
			'convert_weight_to',
			'id',
			'flag_barcode_reader',
			'flag_igv',
			'flag_update_price',
			'logo',
			'settings',
			'theme',
			'url_image',
			'weight',
			'credential',
			'ruc',
			'email',
			'phone',
			'currency',
			'acl_id',
			'commerce_code',
			'acl_code',
			'com_country_id',
			'company_id',
			'banners',
			'social_media',
			'template_code',
			'color_code',
			'flag_test',
			'config_integration',
			'flag_master',
			'plans',
			'flag_loyalti',
			'additional_information',
		];
		return otherColumns.concat(columns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder =>
				builder.select(
					'id',
					'company_name',
					'address',
					'ruc',
					'code',
					'acl_code',
					'logo',
					'settings',
					'email',
					'currency',
				),
		};
	}

	$beforeInsert() {
		this.flagBarcodeReader = true;
		this.flagUpdatePrice = true;
		this.weight = 'kb';
		this.convertWeightTo = 'lb';
		this.flagIgv = true;
		this.bankAccount = this.bankAccount ? this.bankAccount : [];
		this.currency = this.currency || 'PEN';
		this.logo = process.env.EMPLOYEE_DEFAULT_IMAGE;
	}

	static getListIds(filter = {}) {
		return this.query()
			.eager('subsidiary(selectColumns)')
			.select('id')
			.skipUndefined()
			.where('id', '>=', filter.companyId);
	}

	static create(
		data,
		{
			newDataTypeDoc,
			typePayments,
			dataTemplates,
			typePersonDefault,
			hapiAxios,
			mastersCatalogSunat,
		},
	) {
		const newData = data;
		const customer = data.dataCustomer;
		delete newData.dataCustomer;
		let UserCodeAcl = '';
		if (newData.aclUserCode) {
			UserCodeAcl = newData.aclUserCode;
			delete newData.aclUserCode;
		}
		let newTerminal;
		const knex = Company.knex();
		let dataGlobal;
		const customerDocNumber = newData.comCountryId === 2 ? '9999999999999' : '00000000';
		const { roleId } = data;
		let flagCompanyDefault = false;
		if (newData.flagCompanyDefault) {
			flagCompanyDefault = true;
		}
		delete newData.roleId;
		delete newData.flagCompanyDefault;
		const txResult = transaction(knex, () =>
			this.query()
				.insertGraph(newData)
				.then((dataCompany) => {
					dataGlobal = dataCompany;
					dataGlobal.comCompanyId = dataCompany.id;
					let dataTypeDocument;
					const newDataTypeDocument = newDataTypeDoc.map((item) => {
						dataTypeDocument = {
							comTypeDocumentId: item.id,
							comCompanyId: dataCompany.id,
						};
						return dataTypeDocument;
					});
					return newDataTypeDocument;
				})
				.then(() => {
					let dataTypeDocument;
					const newDataTypeDocument = newDataTypeDoc.map((item) => {
						dataTypeDocument = {
							comTypeDocumentId: item.id,
							comCompanyId: dataGlobal.comCompanyId,
						};
						return dataTypeDocument;
					});
					return TypeDocument.createMultiple(newDataTypeDocument);
				})
				.then(() => {
					const defaultPayments = typePayments.map(item => ({
						comTypePaymentId: item.id,
						comCompanyId: dataGlobal.comCompanyId,
					}));
					return TypePayment.createMultiple(defaultPayments);
				})
				.then(() => {
					const dataTypeExpense = {
						name: 'General',
						code: 'GNRAL',
						description: 'tipo de gasto general',
						companyId: dataGlobal.comCompanyId,
					};
					return PurTypeExpense.create(dataTypeExpense);
				})
				.then(() => {
					const dataSubsidiaries = {
						sucursalName: `SUCURSAL ${data.companyName}`,
						ruc: dataGlobal.ruc,
						rzSocial: dataGlobal.companyName,
						latitude: 1,
						longitude: 1,
						ubigeo: '1093',
						sucursalCode: '001',
						phone: ' ',
						address: ' ',
						contactName: ' ',
						contactLastname: ' ',
						email: ' ',
						urlImage: '/sucursal.png',
						websiteDescription: '[]',
						companyId: dataGlobal.comCompanyId,
						flagCompanyDefault,
					};
					return ComSubsidiaries.createOnly(dataSubsidiaries);
				})
				.then((newSubsidiary) => {
					dataGlobal.subsidiaries = newSubsidiary.id;
					const warehouseConfig = {
						countryId: dataGlobal.comCountryId || 1,
						subsidiaryId: newSubsidiary.id,
						companyId: newSubsidiary.companyId,
						name: `Almacen ${data.companyName}`,
						code: `codigo_${data.companyName}`,
					};
					return hapiAxios.post('/type-documents/init', warehouseConfig);
				})
				.then(warehouseConfig => warehouseConfig.data)
				.then((newSubsidiaries) => {
					dataGlobal.warehouseId = newSubsidiaries.warehouse.id;
					const dataTerminals = {
						comSubsidiariesId: dataGlobal.subsidiaries,
						warWarehousesId: newSubsidiaries.warehouse.id,
						salTypeTerminalsId: TypeTerminal.sale,
						typeTerminal: 1,
						code: 'codigo',
						sunatCode: 'codigo sunat',
						name: 'terminal',
						description: 'descripcion terminal',
						printCode: 'color code',
						flagAdmin: true,
						companyId: dataGlobal.comCompanyId,
					};
					return Terminal.create(dataTerminals);
				})
				.then((terminal) => {
					newTerminal = terminal;
					dataGlobal.terminalId = newTerminal.id;
					return Person.getByDocument(dataGlobal.ruc);
				})
				.then((dataPerson) => {
					if (dataPerson) {
						const dataComPerson = {
							personId: dataPerson.id,
							companyId: dataGlobal.comCompanyId,
							aclCode: UserCodeAcl,
							typeEntity: TypeEntity.employee,
							aclId: null,
							email: dataGlobal.email,
						};
						return ComPerson.create(dataComPerson);
					}
					const dataComPerson = {
						companyId: dataGlobal.comCompanyId,
						aclCode: UserCodeAcl,
						typeEntity: TypeEntity.employee,
						aclId: null,
						email: dataGlobal.email,
						person: {
							documentNumber: dataGlobal.ruc,
							fullname: dataGlobal.companyName,
							flagTypePerson: TypePerson.juridica,
							nationality: null,
							email: dataGlobal.email,
						},
					};
					return ComPerson.createMultiple(dataComPerson);
				})
				.then((person) => {
					dataGlobal.personId = person.personId;
					const dataCash = {
						name: 'CAJA GENERAL',
						code: 'CAJA1',
						description: 'CAJA GENERAL',
						account: null,
						warWarehousesId: dataGlobal.warehouseId,
						subsidiaryId: dataGlobal.subsidiaries,
						type: 'POST',
						flagGeneral: 1,
						companyId: dataGlobal.comCompanyId,
					};
					const serieData = {
						salTerminalsId: newTerminal.id,
						comSubsidiariesId: dataGlobal.subsidiaries,
						comCompanyId: dataGlobal.comCompanyId,
						countryId: dataGlobal.comCountryId,
					};
					return Cash.create(dataCash, serieData);
				})
				.then((cash) => {
					const dataEmployee = {
						aclUserCode: UserCodeAcl,
						comSubsidiariesId: dataGlobal.subsidiaries,
						warWarehousesId: dataGlobal.warehouseId,
						salTerminalsId: dataGlobal.terminalId,
						code: UserCodeAcl,
						name: `Empleado ${data.email}`,
						lastname: `Empleado ${data.email}`,
						nationality: 'peruana',
						email: data.email,
						phone: ' ',
						urlImage: process.env.EMPLOYEE_DEFAULT_IMAGE,
						flagAdmin: 1,
						companyId: dataGlobal.comCompanyId,
						personId: dataGlobal.personId,
						cashId: cash.id,
						flagTypePerson: typePersonDefault && typePersonDefault.id,
						roleId,
					};
					return ComEmployee.create(dataEmployee);
				})
				.then((newEmployee) => {
					dataGlobal.employee = newEmployee.id;
					const dataCustomer = {
						flagTypePerson: typePersonDefault && typePersonDefault.id,
						name: customer && customer.name ? customer.name : 'Cliente',
						lastname: customer && customer.lastname ? customer.lastname : 'Genérico',
						dni: customer && customer.dni ? customer.dni : customerDocNumber,
						email: customer && customer.email ? customer.email : 'cliente-generico@gmail.com',
						phone: '970127070',
						gender: 1,
						userId: newEmployee.id,
						comCompaniesId: dataGlobal.comCompanyId,
						flagGeneric: true,
					};
					return Customer.create(dataCustomer);
				})
				.then(() => {
					const { dataSalSeries, ntcNtd } = newDataTypeDoc.reduce(
						(acc, item) => {
							if (
								(item.flagType !== ModuleCode.purchases && item.code !== 'RC') ||
								item.code === 'CRT'
							) {
								if (item.code === 'NTC' || item.code === 'NTD') {
									acc.ntcNtd.push({
										comSubsidiariesId: dataGlobal.subsidiaries,
										salTerminalsId: newTerminal.id,
										salTypeDocumentsId: item.id,
										companyId: dataGlobal.comCompanyId,
									});
									return acc;
								}
								acc.series += 1;
								acc.dataSalSeries.push({
									comSubsidiariesId: dataGlobal.subsidiaries,
									salTerminalsId: newTerminal.id,
									salTypeDocumentsId: item.id,
									serie: `0${acc.series}`,
									number: '0',
									companyId: dataGlobal.comCompanyId,
									flagIncludeNotes: item.flagIncludeNotes,
								});
							}
							return acc;
						},
						{ series: 0, dataSalSeries: [], ntcNtd: [] },
					);
					const seriestoCreate = dataSalSeries.map((item) => {
						const newItem = { ...item };
						delete newItem.flagIncludeNotes;
						if (item.flagIncludeNotes) {
							return {
								...newItem,
								details: ntcNtd.map(note => ({ ...note, serie: item.serie, number: item.number })),
							};
						}
						return newItem;
					});
					return SalSeries.createMultiple(seriestoCreate);
				})
				.then(() => {
					const dataSalPriceLists = {
						warWarehousesId: null,
						comEmployeeId: null,
						comCustomersId: null,
						name: 'Lista de precios por defecto',
						description: 'Lista de precios por defecto',
						flagDefault: true,
						companyId: dataGlobal.comCompanyId,
					};
					return SalPriceLists.create(dataSalPriceLists);
				})
				.then(() => {
					let dataTemplate;
					const newsTemplates = dataTemplates.map((item) => {
						dataTemplate = {
							companyId: dataGlobal.comCompanyId,
							name: item.name,
							code: item.code,
							recipe: item.recipe,
							template: item.template,
						};
						if (item.typeDocumentId) {
							dataTemplate.typeDocumentId = item.typeDocumentId;
						}
						return dataTemplate;
					});
					return CompanyReport.createMultiple(newsTemplates);
				})
				.then(() => {
					const dataGeneral = [
						{
							name: 'Exportación',
							code: 'EXP',
							typeGeneralId: TypeGeneral.typeTransactionSupplier,
							companyId: dataGlobal.comCompanyId,
						},
						{
							name: 'Local',
							code: 'LOC',
							typeGeneralId: TypeGeneral.typeTransactionSupplier,
							companyId: dataGlobal.comCompanyId,
						},
						{
							name: 'SUPPLIER',
							code: 'SUPPLIER',
							typeGeneralId: TypeGeneral.codes,
							companyId: dataGlobal.comCompanyId,
							number: 0,
						},
					];
					return General.createMultiple(dataGeneral);
				})
				.then(() => {
					let catalogSunatCompany = [];
					if (mastersCatalogSunat && mastersCatalogSunat.length > 0) {
						catalogSunatCompany = mastersCatalogSunat.map((item) => {
							const newItem = item;
							newItem.companyId = dataGlobal.comCompanyId;
							newItem.msCatalogSunatId = newItem.id;
							newItem.msCatalogHeaderCode = newItem.catalogSunatCode;
							delete newItem.id;
							delete newItem.catalogSunatCode;
							delete newItem.catalogSunatId;
							return newItem;
						});
					}
					return ComSubsidiaryWithholding.createMultiple(catalogSunatCompany);
				})
				.then(() => dataGlobal));
		return txResult
			.then(response => Promise.resolve(response))
			.catch(error => Promise.reject(error));
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[item(selectColumns), country(selectColumns), currencies(selectColumns), currencyDefault(selectColumns)]')
			.findById(id);
	}

	static getByAclCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[item(selectColumns), country(selectColumns), currencies(selectColumns), currencyDefault(selectColumns), salPriceListDefault(selectColumns), commerceSubsidiaries(simpleColumns)]')
			.where('acl_code', code)
			.first();
	}

	static getByAclCodes(codes, flagSubsidiary = false) {
		let query = this.query()
			.select(this.defaultColumns())
			.whereIn('acl_code', codes);

		if (flagSubsidiary) {
			query = query.eager('subsidiary(selectColumns)');
		}
		return query;
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static editEcommerce(data, companyId) {
		return this.query()
			.patch(data)
			.where('id', companyId);
	}
}
module.exports = Company;
