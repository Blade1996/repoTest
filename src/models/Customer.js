'use strict';

const baseModel = require('./base');
const { isNullOrUndefined } = require('util');
const simpleAxios = require('./../api/shared/simple-axios');
const { Model, raw, transaction } = require('objection');
const helper = require('./helper');
const Sales = require('./Sales');
const Person = require('./Person');
const SalOrders = require('./SalOrders');
const SalesStates = require('./SalesStates');
const MsTypeDocument = require('./MsTypeDocument');
const SaleDocumentsDetail = require('./SaleDocumentsDetail');
const ComPerson = require('./ComPerson');
const CustomersAddress = require('./CustomersAddress');
const TypeEntity = require('./TypeEntity');
const TypePerson = require('./TypePerson');
const { juridica } = require('./TypePerson');
const Subsidiary = require('./ComSubsidiaries');
const SubsidiaryCustomer = require('./SubsidiaryCustomer');
const { isDevOrProd } = require('../shared/helper');
const { peru } = require('./CountryCode');
const { pending, partial, payOut } = require('./PaymentState');
const { taxAddress } = require('./enums/type-address-enums');
const { aclUserInactiveError } = require('../api/shared/error-codes');

class Customer extends baseModel {
	static get tableName() {
		return 'com_customers';
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comCompaniesId'],
			properties: {
				comCompaniesId: {
					type: 'integer',
				},
				name: {
					type: ['string', 'null'],
				},
				lastname: {
					type: ['string', 'null'],
				},
				rzSocial: {
					type: ['string', 'null'],
				},
				websiteAddress: {
					type: 'string',
				},
				nationality: {
					type: 'string',
				},
				email: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				ruc: {
					type: 'string',
				},
				dni: {
					type: 'string',
				},
				gender: {
					type: ['integer', 'null'],
				},
				dateBirth: {
					type: 'timestamp',
				},
				civilStatus: {
					type: ['integer', 'null'],
				},
				sonNumber: {
					type: ['integer', 'null'],
				},
				contact: {
					type: ['string', 'null'],
					maxLength: 100,
				},
				address: {
					type: ['string', 'null'],
				},
				geoPosition: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: 'string',
				},
				flagTypePerson: {
					type: 'integer',
				},
				flagGeneric: {
					type: 'boolean',
				},
				additionalInformation: {
					type: 'object',
				},
				prospect: {
					type: 'boolean',
				},
				customerItemId: {
					type: 'integer',
				},
				personId: {
					type: ['integer', 'null'],
				},
				externalData: {
					type: ['object', 'null'],
				},
				totalSales: {
					type: ['object', 'null'],
					default: {},
				},
				salesQuantity: {
					type: ['integer', 'null'],
					default: 0,
				},
				flagAccounting: {
					type: ['integer', 'null'],
				},
				debtsSales: {
					type: ['object', 'null'],
					default: {},
				},
				flagDetraction: {
					type: ['integer', 'null'],
				},
				typeDestinationId: {
					type: ['integer', 'null'],
				},
				originIncomeId: {
					type: ['integer', 'null'],
				},
				phoneNumbers: {
					type: ['array', 'null'],
					default: [],
				},
				flagExemptTaxes: {
					type: ['integer', 'null'],
				},
				flagSpecialContributor: {
					type: ['integer', 'null'],
				},
				flagRetentionAgent: {
					type: ['integer', 'null'],
				},
				flagItemsWithoutRetainer: {
					type: ['integer', 'null'],
				},
				creditLimitationBalance: {
					type: ['number', 'null'],
					default: 0,
				},
				limitAmountCredit: {
					type: ['number', 'null'],
					default: 0,
				},
				creditLimitDays: {
					type: ['integer', 'null'],
					default: 0,
				},
				paymentMethodId: {
					type: ['integer', 'null'],
				},
				accountingCode: {
					type: ['string', 'null'],
				},
				accountAdvanceAccount: {
					type: ['string', 'null'],
				},
				countryId: {
					type: ['integer', 'null'],
				},
				customerType: {
					type: ['string', 'null'],
				},
				flagPostDatedCredit: {
					type: ['integer', 'null'],
				},
				flagRelatedCustomer: {
					type: ['integer', 'null'],
				},
				latitude: {
					type: ['number', 'null'],
				},
				longitude: {
					type: ['number', 'null'],
				},
				location: {
					type: ['string', 'null'],
				},
				provinceId: {
					type: ['integer', 'null'],
				},
				cityId: {
					type: ['integer', 'null'],
				},
				parishId: {
					type: ['integer', 'null'],
				},
				zone: {
					type: ['string', 'null'],
				},
				postalCode: {
					type: ['string', 'null'],
				},
				establishmentCode: {
					type: ['string', 'null'],
				},
				groupId: {
					type: ['integer', 'null'],
				},
				flagEcommerce: {
					type: ['boolean', 'integer', 'null'],
					default: false,
				},
				flagInvolveStock: {
					type: ['boolean', 'null'],
					default: true,
				},
				aclCode: {
					type: ['string', 'null'],
				},
				flagDebts: {
					type: ['integer', 'null'],
					default: 2,
				},
				commerceSubsidiaryId: {
					type: ['integer', 'null'],
				},
				commerceId: {
					type: ['integer', 'null'],
				},
				limitAmountSale: {
					type: ['number', 'null'],
				},
				discount: {
					type: ['number', 'null'],
				},
				salPriceListId: {
					type: ['integer', 'null'],
				},
				flagTypeUser: {
					type: ['integer', 'null'],
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				point: {
					type: ['string', 'null'],
				},
				...defaultsPropiertes,
			},
		};
		return schema;
	}

	static get relationMappings() {
		return {
			item: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CustomerItem.js`,
				join: {
					from: 'com_customers.customer_item_id',
					to: 'com_customers_items.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_customers.user_id',
					to: 'com_employee.id',
				},
			},
			person: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Person.js`,
				join: {
					from: 'com_customers.person_id',
					to: 'ms_person.id',
				},
			},
			msTypePerson: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypePerson.js`,
				join: {
					from: 'com_customers.flag_type_person',
					to: 'ms_type_person.id',
				},
			},
			salPricelist: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalPriceLists.js`,
				join: {
					from: 'com_customers.sal_price_list_id',
					to: 'sal_price_lists.id',
				},
			},
			group: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_customers.group_id',
					to: 'com_general.id',
				},
			},
			subsidiaryCustomer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SubsidiaryCustomer.js`,
				join: {
					from: 'com_customers.id',
					to: 'com_subsidiary_customers.customer_id',
				},
			},
			customerAddress: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CustomersAddress.js`,
				join: {
					from: 'com_customers.id',
					to: 'com_customers_address.customer_id',
				},
			},
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_customers.com_companies_id',
					to: 'com_companies.id',
				},
			},
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_customers.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
			salesCustomers: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'com_customers.id',
					to: 'sal_documents.customer_id',
				},
			},
			documentAccountStatusCustomer: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/DocumentAccountStatus.js`,
				join: {
					from: 'com_customers.id',
					to: 'com_document_account_status.customer_id',
				},
			},
		};
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			selectColumnsVendor: builder => builder.select(this.defaultColumnsVendor()),
			onlyVirtualAttributes: builder => builder.select(this.onlyVirtualAttributes()),
			basicColumns: builder => builder.select('name', 'lastname', 'id'),
		};
	}

	static get virtualAttributes() {
		return ['typePerson', 'autocomplete', 'formatDocuments'];
	}

	get typePerson() {
		const result = {
			documentName: 'RUC',
			documentNumber: this.ruc,
			fullName: this.rzSocial,
			documentTitle: 'Razon social',
		};
		if (
			this.flagTypePerson !== TypePerson.juridica &&
			this.flagTypePerson !== TypePerson.ruc &&
			this.flagTypePerson !== TypePerson.rucNatural
		) {
			if (this.flagTypePerson === TypePerson.natural) {
				result.documentName = 'DNI';
			} else if (this.flagTypePerson === TypePerson.carnetExt) {
				result.documentName = 'CE';
			} else if (this.flagTypePerson === TypePerson.pasaportePer) {
				result.documentName = 'Pasaporte';
			} else if (this.flagTypePerson === TypePerson.cedulaIdenPer) {
				result.documentName = 'CI País Residencia';
			} else if (this.flagTypePerson === TypePerson.otrosTip) {
				result.documentName = 'Otros tipos de documento';
			} else if (this.flagTypePerson === TypePerson.cedulaIdenEcu) {
				result.documentName = 'Cédula de Identidad';
			} else if (this.flagTypePerson === TypePerson.pasaporteEcu) {
				result.documentName = 'Pasaporte';
			} else if (this.flagTypePerson === TypePerson.ventaConFin) {
				result.documentName = 'Venta a consumidor final';
			} else if (this.flagTypePerson === TypePerson.identifExt) {
				result.documentName = 'Identificación del exterior';
			} else if (this.flagTypePerson === TypePerson.placa) {
				result.documentName = 'Placa';
			}
			result.documentNumber = this.dni;
			result.fullName = `${this.name} ${this.lastname}`;
			result.documentTitle = 'Señor(es)';
		}
		return result;
	}

	get autocomplete() {
		let fullname;
		let documentNumber;
		if (
			this.flagTypePerson !== TypePerson.juridica &&
			this.flagTypePerson !== TypePerson.ruc &&
			this.flagTypePerson !== TypePerson.rucNatural
		) {
			const dni = this.dni ? this.dni : '';
			const name = this.name ? this.name : '';
			const lastname = this.lastname ? this.lastname : '';
			fullname = `${name} ${lastname}`;
			documentNumber = dni;
		} else if (
			this.flagTypePerson === TypePerson.juridica ||
			this.flagTypePerson === TypePerson.ruc ||
			this.flagTypePerson === TypePerson.rucNatural
		) {
			fullname = this.rzSocial ? this.rzSocial : '';
			const ruc = this.ruc ? this.ruc : '';
			documentNumber = ruc;
		}
		const email = this.email ? this.email : '';

		const autocomplete = `${fullname} ${documentNumber} ${email}`;
		return autocomplete;
	}
	get formatDocuments() {
		let totalAmountSale = 0;
		let totalIvaSale = 0;
		let totalSubIvaSale = 0;
		let totalSubTotalSale = 0;
		let totalSubExIvaSale = 0;
		let totalDiscountSale = 0;
		let totalFac = 0;
		if (this.salesCustomers && this.salesCustomers.length >= 0) {
			totalFac = this.salesCustomers.length;
			this.salesCustomers.forEach((element) => {
				if (element.vatTaxes && element.vatTaxes.total) {
					totalAmountSale += element.vatTaxes.total ? Number(element.vatTaxes.total) : 0;
					totalIvaSale += element.vatTaxes.iva ? Number(element.vatTaxes.iva) : 0;
					totalSubTotalSale += element.vatTaxes.subTotal ? Number(element.vatTaxes.subTotal) : 0;
					totalSubIvaSale += element.vatTaxes.subIva ? Number(element.vatTaxes.subIva) : 0;
					totalSubExIvaSale += element.vatTaxes.subNotIva ? Number(element.vatTaxes.subNotIva) : 0;
					totalDiscountSale += element.vatTaxes.discount ? Number(element.vatTaxes.discount) : 0;
				}
			});
		}
		return {
			totalAmountSales: totalAmountSale.toFixed(2),
			totalIvaSales: totalIvaSale.toFixed(2),
			totalSubTotalSales: totalSubTotalSale.toFixed(2),
			totalSubIvaSales: totalSubIvaSale.toFixed(2),
			totalSubExIvaSales: totalSubExIvaSale.toFixed(2),
			totalDiscountSales: totalDiscountSale.toFixed(2),
			totalFac,
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'dni',
			'ruc',
			'email',
			'phone',
			'flag_type_person',
			'com_companies_id',
			'flag_active',
			'address',
			'contact',
			'name',
			'lastname',
			'user_id',
			'rz_social',
			'url_image',
			'additional_information',
			'prospect',
			'customer_item_id',
			'flag_generic',
			'created_at',
			'person_id',
			'external_data',
			'total_sales',
			'sales_quantity',
			'flag_accounting',
			'debts_sales',
			'type_destination_id',
			'origin_income_id',
			'phone_numbers',
			'flag_exempt_taxes',
			'flag_special_contributor',
			'flag_retention_agent',
			'flag_items_without_retainer',
			'credit_limitation_balance',
			'limit_amount_credit',
			'credit_limit_days',
			'payment_method_id',
			'accounting_code',
			'account_advance_account',
			'country_id',
			'customer_type',
			'flag_post_dated_credit',
			'flag_related_customer',
			'latitude',
			'longitude',
			'location',
			'province_id',
			'city_id',
			'parish_id',
			'zone',
			'postal_code',
			'establishment_code',
			'flag_detraction',
			'date_birth',
			'civil_status',
			'gender',
			'geo_position',
			'group_id',
			'limit_amount_sale',
			'flag_ecommerce',
			'flag_debts',
			'flag_involve_stock',
			'discount',
			'sal_price_list_id',
			'flag_type_user',
			'acl_code',
			'accounting_account',
			'point',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static onlyVirtualAttributes(otherColumns = []) {
		let columns = ['id', 'dni', 'ruc', 'flag_type_person', 'name', 'lastname', 'rz_social'].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static defaultColumnsVendor(otherColumns = []) {
		const columns = [
			'id',
			'dni',
			'ruc',
			'email',
			'phone',
			'flag_type_person',
			'com_companies_id',
			'flag_active',
			'address',
			'name',
			'lastname',
			'user_id',
			'rz_social',
			'created_at',
			'person_id',
			'total_sales',
			'sales_quantity',
			'debts_sales',
			'phone_numbers',
			'limit_amount_credit',
			'credit_limit_days',
			'latitude',
			'longitude',
			'province_id',
			'city_id',
			'parish_id',
			'flag_generic',
			'geo_position',
			'url_image',
			'discount',
			'flag_type_user',
			'accounting_account',
			'website_address',
		].map(c => `${this.tableName}.${c}`);

		return columns.concat(otherColumns);
	}

	static match(query, search, likeSearch) {
		if (!likeSearch) {
			query.whereRaw('MATCH(name, lastname, dni, ruc, rz_social, email) AGAINST(?)', [search]);
		} else {
			const fields = [
				'name',
				'lastname',
				'dni',
				'ruc',
				'rz_social',
				'email',
				'phone_numbers',
				'phone',
			];
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(field, 'like', `%${search}%`);
				});
			});
		}
		return query;
	}

	static getAllSync(companyId, filter = {}) {
		const { search } = filter;
		let query = this.query()
			.eager('[msTypePerson(selectColumns), salPricelist(selectColumns)]')
			.select(this.defaultColumns())
			.where('com_companies_id', companyId);

		if (filter.updatedAt) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.updated_at, "+05:00", "+00:00")) >= ?`,
				filter.updatedAt,
			);
		}
		if (filter.deletedAt) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.delete_at, "+05:00", "+00:00")) >= ?`,
				filter.deletedAt,
			);
		}
		if (filter.createdAt) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.createdAt,
			);
		}
		query = this.commerceFilter(query, filter);
		if (search) {
			query = this.match(query, search);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static getAll(filter = {}, companyId) {
		const { search } = filter;
		const { aclFilters = {} } = filter;
		const columns = filter.vendor ? this.defaultColumnsVendor() : this.defaultColumns();
		let query = this.query()
			.eager('[item(selectColumns), employee(selectColumns), person(selectColumns), msTypePerson(selectColumns), salPricelist(selectColumns), group(selectColumns), customerAddress(selectColumns)]')
			.select(columns)
			.skipUndefined()
			.where('user_id', filter.userId)
			.aclFilter(aclFilters.customers, this.tableName)
			.skipUndefined()
			.where('flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('flag_generic', filter.flagGeneric)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.skipUndefined()
			.where('flag_debts', filter.flagDebts)
			.skipUndefined()
			.where('flag_ecommerce', filter.flagEcommerce)
			.skipUndefined()
			.where('province_id', filter.provinceId)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('parish_id', filter.parishId)
			.where('com_companies_id', companyId);
		if (filter.subsidiaryId) {
			query.join('com_subsidiary_customers as sc', 'sc.customer_id', `${this.tableName}.id`);
			query.where('sc.subsidiary_id', filter.subsidiaryId);
		}
		if (filter.initialPoint && filter.lastPoint) {
			query.where(`${this.tableName}.point`, '>=', filter.lastPoint);
			query.where(`${this.tableName}.point`, '<=', filter.initialPoint);
		}
		if (search) {
			query = this.match(query, search, true);
		}
		if (filter.prospect) {
			query.where('prospect', filter.prospect);
		}
		if (filter.vendor) {
			query.whereNotNull('location');
		}
		query = this.commerceFilter(query, filter);
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static commerceFilter(query, filter) {
		const { aclFilters } = filter;
		let { commercesId } = filter;
		if (!commercesId) {
			const commercesValues =
				aclFilters &&
				aclFilters.commerces &&
				aclFilters.commerces.commerces &&
				aclFilters.commerces.commerces.values;
			if (commercesValues && Array.isArray(commercesValues) && commercesValues.length > 0) {
				commercesId = commercesValues.join(',');
			}
		}
		if (commercesId) {
			query
				.innerJoin(
					'com_commerce_customers',
					'com_commerce_customers.customer_id',
					`${this.tableName}.id`,
				)
				.whereIn('com_commerce_customers.commerce_id', commercesId.split(','));
		}
		return query;
	}

	static getCustomerByPoligony(poligony, companyId, filter) {
		const query = this.query()
			.eager('[person(selectColumns), msTypePerson(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('province_id', filter.provinceId)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('parish_id', filter.parishId)
			.where('com_companies_id', companyId);

		if (poligony) {
			query.whereRaw(`ST_CONTAINS(${poligony}, location)`);
		}
		return query;
	}

	static getAllProduction(filter = {}, companyId, ids) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.whereIn('id', ids)
			.where('com_companies_id', companyId);

		if (search) {
			query = this.match(query, search);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static getAllAmountPdf(filter = {}, companyId) {
		const { search } = filter;
		const columms = [
			raw(`FORMAT(JSON_EXTRACT(com_customers.debts_sales, "$.${
				filter.currency
			}"), 2) as amountCustomer`),
			raw(Customer.generateRawCase(filter.countryCode)),
		];
		let query = this.query()
			.select(columms)
			.where('com_customers.com_companies_id', companyId)
			.skipUndefined()
			.where('user_id', filter.userId)
			.skipUndefined()
			.where('flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.skipUndefined()
			.where('flag_debts', filter.flagDebts)
			.whereRaw(`JSON_EXTRACT(com_customers.debts_sales, "$.${filter.currency}") IS NOT NULL`)
			.whereRaw(`JSON_EXTRACT(com_customers.debts_sales, "$.${filter.currency}") > 0`)
			.orderBy('amountCustomer', 'desc');

		if (search) {
			query = this.match(query, search);
		}
		return query;
	}

	static getAllAmountTotal(filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(raw(`FORMAT(SUM(IF(JSON_EXTRACT(com_customers.debts_sales, "$.${
				filter.currency
			}") > 0, JSON_EXTRACT(com_customers.debts_sales, "$.${
				filter.currency
			}"), 0)), 2) as totalSales`))
			.where('com_customers.com_companies_id', companyId)
			.skipUndefined()
			.where('user_id', filter.userId)
			.skipUndefined()
			.where('flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.skipUndefined()
			.where('flag_debts', filter.flagDebts);
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (search) {
			query = this.match(query, search, true);
		}
		return query;
	}

	static getAllAmount(idFin, typeDocument, filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[item(selectColumns), employee(selectColumns), person(selectColumns), msTypePerson(selectColumns), salPricelist(selectColumns), group(selectColumns)]')
			.sum('sal_documents.amount as amountCustomer')
			.leftJoin(raw(
				'sal_documents on com_customers.id = sal_documents.customer_id and sal_documents.sal_states_id = ? and sal_documents.sal_type_document_id != ?',
				[idFin, typeDocument],
			))
			.where(`${this.tableName}.com_companies_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.user_id`, filter.userId)
			.skipUndefined()
			.where(`${this.tableName}.flag_type_person`, filter.flagTypePerson)
			.skipUndefined()
			.where(`${this.tableName}.group_id`, filter.groupId)
			.skipUndefined()
			.where(`${this.tableName}.flag_debts`, filter.flagDebts)
			.groupBy(`${this.tableName}.id`)
			.orderBy('amountCustomer', 'desc');

		if (filter.subsidiaryId) {
			query
				.join(
					'com_subsidiary_customers',
					'com_subsidiary_customers.customer_id',
					`${this.tableName}.id`,
				)
				.where('com_subsidiary_customers.subsidiary_id', filter.subsidiaryId);
		}

		if (search) {
			query = this.match(query, search, true);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static generateRawCase(countryCode = peru) {
		const dniTypePerson = countryCode === peru ? 1 : 8;
		const rucTypePerson = countryCode === peru ? 2 : 7;
		let caseSql = `CASE WHEN com_customers.flag_type_person = ${dniTypePerson} THEN CONCAT(com_customers.name, " ", com_customers.lastname)`;
		caseSql += ` WHEN com_customers.flag_type_person = ${rucTypePerson} THEN com_customers.rz_social`;
		caseSql += ' ELSE "-" END as customer_name,';
		caseSql += ` CASE WHEN com_customers.flag_type_person = ${dniTypePerson} THEN com_customers.dni`;
		caseSql += ` WHEN com_customers.flag_type_person = ${rucTypePerson} THEN com_customers.ruc`;
		caseSql += ' ELSE "-" END as customer_document_number';
		return caseSql;
	}

	static getAllSales(states, typeDocumentId, filter = {}, companyId) {
		const salesTable = 'sal_documents';
		return this.query()
			.select(this.defaultColumns())
			.sum(`${salesTable}.amount as amountCustomer`)
			.count(`${salesTable}.id as quantitySales`)
			.leftJoin(raw(
				`${salesTable} on ${
					this.tableName
				}.id = ${salesTable}.customer_id and ${salesTable}.sal_states_id = ? and ${salesTable}.sal_type_document_id != ? and DATE(CONVERT_TZ(${salesTable}.created_at, "+05:00", "+00:00")) >= ? and DATE(CONVERT_TZ(${salesTable}.created_at, "+05:00", "+00:00")) <= ?`,
				[states, typeDocumentId, filter.startDate, filter.endDate],
			))
			.where(`${this.tableName}.com_companies_id`, companyId)
			.groupBy(`${this.tableName}.id`)
			.orderBy('amountCustomer', 'desc');
	}

	static getAllDebts(idAnulado, paymentMethod, filter = {}, companyId) {
		const isArrayData = Array.isArray(idAnulado) ? idAnulado : [idAnulado];
		const { search } = filter;
		let query = this.query()
			.select(raw(`${this.defaultColumns()}, sum(sal_documents.amount - sal_documents.due_amount) as debtAmount`))
			.innerJoin(raw(`sal_documents on com_customers.id = sal_documents.customer_id and sal_documents.sal_states_id not in (${isArrayData}) and sal_documents.payment_method_id = ${paymentMethod}`))
			.where('com_customers.com_companies_id', companyId)
			.where(raw('sal_documents.amount > sal_documents.due_amount'))
			.groupBy('com_customers.id')
			.orderBy('debtAmount', 'desc');

		if (search) {
			query = this.match(query, search);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data) {
		const newData = data;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		return this.query().insert(newData);
	}

	static isNaturalPerson(data) {
		return data.flagTypePerson !== 2 && data.flagTypePerson !== 7 && data.flagTypePerson !== 18;
	}

	async $afterInsert(queryContext) {
		try {
			if (this.address && this.phone) {
				let addressName = '';
				if (this.additionalInformation) {
					const { alias } = this.additionalInformation;
					addressName = alias;
				}
				const dataAddress = {
					type: taxAddress,
					addressLine1: this.address,
					phone: this.phone,
					latitude: this.latitude,
					longitude: this.longitude,
					isFavorite: false,
					parishId: this.parishId,
					cityId: this.cityId,
					provinceId: this.provinceId,
					customerId: this.id,
					companyId: this.comCompaniesId,
					name: addressName,
				};
				await CustomersAddress.create(dataAddress);
			}
			const isNaturalPerson =
				this.flagTypePerson !== 2 && this.flagTypePerson !== 7 && this.flagTypePerson !== 18;
			const documentNumber = isNaturalPerson ? this.dni : this.ruc;
			const name = isNaturalPerson ? `${this.name} ${this.lastname}` : this.rzSocial;
			const person = await ComPerson.createPerson(
				queryContext.transaction,
				Customer,
				documentNumber,
				TypeEntity.customer,
				{
					id: this.id,
					code: this.aclCode,
					email: this.email,
					fullname: name,
					flagTypePerson: this.flagTypePerson,
				},
				this.comCompaniesId,
			);
			await SubsidiaryCustomer.createByCustomer(
				{
					trx: queryContext.transaction,
					employeeId: this.userId || null,
					customerId: this.id,
					commerceSubsidiaryId: this.commerceSubsidiaryId,
				},
				this.comCompaniesId,
			);
			return person;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static createMultiple(data) {
		const newData = data.map((item) => {
			const obj = { ...item };
			if (item.latitude && item.longitude) {
				const point = `"POINT(${item.latitude} ${item.longitude})"`;
				obj.location = this.raw(`GeomFromText(${point})`);
			}
			return obj;
		});
		return this.query().insertGraph(newData);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[item(selectColumns), employee(selectColumns), person(selectColumns), msTypePerson(selectColumns), salPricelist(selectColumns), group(selectColumns)]')
			.findById(id)
			.where('com_companies_id', companyId);
	}

	static getByIds(ids, companyId) {
		return this.query()
			.select(this.defaultColumnsVendor())
			.whereIn('id', ids)
			.where('com_companies_id', companyId);
	}

	static getByGeneric(companyId) {
		return this.query()
			.select('id')
			.where('flag_generic', true)
			.where('com_companies_id', companyId)
			.first();
	}

	static getBylimitAmount(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.where('com_companies_id', companyId)
			.first();
	}

	static getByDocument(dni, ruc, companyId, flagTypePerson) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('ruc', ruc)
			.skipUndefined()
			.where('dni', dni)
			.skipUndefined()
			.where('flag_type_person', flagTypePerson)
			.where('com_companies_id', companyId)
			.first();
	}

	static async edit(id, data, companyId, tx) {
		const newData = data;
		const { flagAddress } = newData;
		delete newData.flagAddress;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		if (flagAddress) {
			const customerAddress = await CustomersAddress.getByCustomerId(undefined, id, companyId);
			let addressName = '';
			if (newData.additionalInformation) {
				const { alias } = newData.additionalInformation;
				addressName = alias;
			}
			const dataAddress = {
				type: taxAddress,
				addressLine1: newData.address,
				phone: newData.phone,
				latitude: newData.latitude,
				longitude: newData.longitude,
				isFavorite: false,
				parishId: newData.parishId,
				cityId: newData.cityId,
				provinceId: newData.provinceId,
				customerId: id,
				companyId,
				name: addressName,
			};
			if (customerAddress) {
				delete dataAddress.companyId;
				delete dataAddress.customerId;
				await CustomersAddress.edit(customerAddress.id, dataAddress, id, companyId);
			} else {
				await CustomersAddress.create(dataAddress);
			}
		}
		if (data.flagTypePerson && data.personId) {
			await Person.edit(data.personId, {
				documentNumber: this.isNaturalPerson(data) ? this.dni : this.ruc,
			});
		}
		return this.query(tx)
			.patch(newData)
			.where('id', id)
			.where('com_companies_id', companyId);
	}

	static async editDocumentNumber(customerData, documentNumber, companyId) {
		const newData = {};
		const isNaturalPerson = this.isNaturalPerson(customerData);
		if (isNaturalPerson) {
			newData.dni = documentNumber;
		} else {
			newData.ruc = documentNumber;
		}
		await Person.edit(customerData.personId, {
			documentNumber,
		});
		return this.query()
			.patch(newData)
			.where('id', customerData.id)
			.where('com_companies_id', companyId);
	}

	static async remove(id, { companyId, aclCode, authorization }) {
		if (isNullOrUndefined(aclCode)) {
			return this.query()
				.softDelete()
				.where('id', id)
				.where('com_companies_id', companyId);
		}
		const { status } = await Customer.removeUserAcl({ aclCode, authorization });
		if (status >= 200 && status < 300) {
			return this.query()
				.softDelete()
				.where('id', id)
				.where('com_companies_id', companyId);
		}
		return aclUserInactiveError;
	}

	static async removeUserAcl({ aclCode, authorization }) {
		const { status } = await simpleAxios({
			url: `${process.env.ACL_URL}/users`,
			method: 'PATCH',
			headers: {
				authorization,
			},
			data: {
				codeUser: aclCode,
				flagActive: false,
				flagDelete: true,
			},
			validateStatus: () => true,
		});
		return { status };
	}

	static getCustomerRepeated(companyId, {
		id, dni, ruc, flagTypePerson,
	}) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_companies_id', companyId)
			.where('flag_type_person', flagTypePerson)
			.skipUndefined()
			.whereNot('id', id)
			.skipUndefined()
			.where('dni', dni)
			.skipUndefined()
			.where('ruc', ruc)
			.first();
	}

	static getAllReport(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.where('com_companies_id', companyId);
	}

	static async getReportTopSales(
		companyId,
		hapiAxios,
		filter,
		categoryId,
		products = [],
		top = 10,
	) {
		const states = await SalesStates.getId('FIN');
		const typeDocument = await MsTypeDocument.getById(undefined, 'COT', {
			comCountryId: filter.comCountryId,
		});
		let dataSales = [];
		let report = [];
		if (categoryId) {
			dataSales = await Sales.getListReport(
				typeDocument.id,
				companyId,
				states.id,
				undefined,
				filter,
			);
			let newSales = dataSales;
			if (isDevOrProd()) {
				newSales = await Sales.setProductsToSales(
					dataSales,
					{ hapiAxios },
					true,
					'/p/products/by-ids',
				);
			}
			const saleProducts = [];
			const customers = [];
			let salesTotal = 0;
			newSales.forEach((item) => {
				item.details.forEach((item2) => {
					if (item2.product) {
						if (item2.product.categoryId) {
							const auxCustomer = customers.find(element => element === item.customerId);
							if (!auxCustomer) {
								customers.push(item.customerId);
							}
							let amount = item2.price - item2.discount;
							amount *= item2.quantity;
							saleProducts.push({
								customerId: item.customerId,
								categoryId: item2.product.categoryId,
								quantity: item2.quantity,
								saleAmount: amount,
							});
							salesTotal += amount;
						}
					}
				});
			});
			let dataCustomers = [];
			if (customers.length > 0) {
				dataCustomers = await this.getAllProduction(undefined, companyId, customers);
			}
			report = dataCustomers.map((element) => {
				const newElement = element;
				let customerProducts = 0;
				let customerSales = 0;
				let customerPercentage = 0;
				saleProducts.forEach((item) => {
					if (item.customerId === newElement.id) {
						customerProducts += item.quantity;
						customerSales += item.saleAmount;
					}
				});
				customerPercentage = salesTotal > 0 ? customerSales / salesTotal : 0;
				customerPercentage *= 100;
				customerPercentage = Math.round(customerPercentage * 100) / 100;
				newElement.quantityProducts = customerProducts;
				newElement.salesAmount = customerSales;
				newElement.percentage = customerPercentage;
				return newElement;
			});
			const auxReport = report.sort((a, b) => {
				if (a.salesAmount > b.salesAmount) {
					return 1;
				}
				if (a.salesAmount < b.salesAmount) {
					return -1;
				}
				return 0;
			});
			report = auxReport || [];
		} else if (products.length > 0) {
			const auxDataSales = await SaleDocumentsDetail.getSalesCustomer(
				typeDocument.id,
				companyId,
				states.id,
				products,
				filter,
			);
			dataSales = auxDataSales.filter(item => item.customerId);
			const customers = dataSales.map(item => item.customerId);
			const salesTotal = dataSales.reduce((acum, item) => acum + item.salesAmount, 0);
			let dataCustomers = [];
			if (customers.length > 0) {
				dataCustomers = await this.getAllProduction(undefined, companyId, customers);
			}
			report = dataSales.map((element) => {
				let newElement = element;
				let customerPercentage = 0;
				const customer = dataCustomers.find(item => item.id === newElement.customerId);
				if (customer) {
					newElement = Object.assign(newElement, customer);
				}
				customerPercentage = salesTotal > 0 ? newElement.salesAmount / salesTotal : 0;
				customerPercentage *= 100;
				customerPercentage = Math.round(customerPercentage * 100) / 100;
				newElement.percentage = customerPercentage;
				return newElement;
			});
		}
		const auxReport = report.filter(item => item.salesAmount > 0);
		const newReport = auxReport.filter((item, index) => index < top);

		return newReport;
	}

	static async getReportTop(companyId, filter, top = 10) {
		const dataOrders = await SalOrders.getListReport(companyId, filter);
		const saleProducts = {};
		const orderCustomerProducts = [];
		const customers = [];
		let salesTotal = 0;
		const paymentStateAmount = {
			quantity: 0,
			pending: 0,
			partial: 0,
			costShipping: 0,
			payOut: 0,
			total: 0,
			cancel: 0,
		};
		dataOrders.forEach((item) => {
			const auxCustomer = customers.find(element => element === item.customerId);
			if (!auxCustomer) {
				customers.push(item.customerId);
				orderCustomerProducts[item.customerId] = [];
			}
			paymentStateAmount.costShipping += item.costShipping;
			let shipping = item.costShipping;
			item.details.forEach((item2) => {
				const amount = item2.total;
				orderCustomerProducts[item.customerId].push({
					customerId: item.customerId,
					categoryId: item2.categoryId,
					quantity: item2.quantity,
					costShipping: shipping,
					salesAmount: amount,
				});
				if (!saleProducts[item2.productId]) {
					saleProducts[item2.productId] = {};
					saleProducts[item2.productId].name = item2.productName;
					saleProducts[item2.productId].code = item2.code;
					saleProducts[item2.productId].quantity = item2.quantity;
					saleProducts[item2.productId].salesAmount = amount;
					saleProducts[item2.productId].unit = {};
					saleProducts[item2.productId].unit[item2.unitId] = {
						id: item2.unitId,
						name: item2.unitName,
						quantity: item2.quantity,
						salesAmount: amount,
					};
				} else {
					saleProducts[item2.productId].quantity += item2.quantity;
					saleProducts[item2.productId].salesAmount += amount;
					const unit = saleProducts[item2.productId].unit[item2.unitId];
					saleProducts[item2.productId].unit[item2.unitId] = {
						id: item2.unitId,
						name: item2.unitName,
						quantity: unit ? unit.quantity + item2.quantity : item2.quantity,
						salesAmount: unit ? unit.salesAmount + amount : amount,
					};
				}
				salesTotal += amount;
				shipping = 0;
			});
			paymentStateAmount.pending += item.paymentStateId === pending ? item.total : 0;
			paymentStateAmount.partial += item.paymentStateId === partial ? item.total : 0;
			paymentStateAmount.payOut += item.paymentStateId === payOut ? item.total : 0;
			paymentStateAmount.cancel += item.orderStateId === 4 ? item.total : 0;
			paymentStateAmount.quantity += 1;
			paymentStateAmount.total += item.total;
		});
		let dataCustomers = [];
		if (customers.length > 0) {
			dataCustomers = await this.getAllProduction(undefined, companyId, customers);
		}
		let report = dataCustomers.map((element) => {
			const newElement = element;
			let customerProducts = 0;
			let customerSales = 0;
			let customerPercentage = 0;
			orderCustomerProducts[element.id].forEach((item) => {
				if (item.customerId === newElement.id) {
					customerProducts += item.quantity;
					customerSales += item.salesAmount + item.costShipping;
				}
			});
			customerPercentage = salesTotal > 0 ? customerSales / salesTotal : 0;
			customerPercentage *= 100;
			customerPercentage = Math.round(customerPercentage * 100) / 100;
			newElement.quantityProducts = customerProducts;
			newElement.salesAmount = customerSales;
			newElement.percentage = customerPercentage;
			return newElement;
		});
		report = report.sort((a, b) => {
			if (a.salesAmount < b.salesAmount) {
				return 1;
			}
			if (a.salesAmount > b.salesAmount) {
				return -1;
			}
			return 0;
		});
		const auxReport = report.filter(item => item.salesAmount > 0);
		const newReportCustomer = auxReport.filter((item, index) => index < top);
		paymentStateAmount.total -= paymentStateAmount.cancel;
		return { newReportCustomer, saleProducts, paymentStateAmount };
	}

	static getSalesAmountById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('com_companies_id', companyId);
	}

	static async updateSalesQuantity(
		id,
		companyId,
		{
			currency,
			saleAmount = 0,
			saleQuantity = 0,
			debtsSales = 0,
			subsidiaryId,
			creditLimitationBalance = 0,
			flagDiscountBalance = false,
		},
	) {
		if (subsidiaryId) {
			await Subsidiary.query()
				.patch({
					debtsSales: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, JSON_SET(debts_sales, "$.${currency}", JSON_EXTRACT(debts_sales, "$.${currency}")+${debtsSales}), JSON_SET(debts_sales, "$.${currency}", ${debtsSales}))`),
				})
				.where('id', subsidiaryId)
				.where('company_id', companyId);
			const subsidiaryCustomer = await SubsidiaryCustomer.query()
				.select(SubsidiaryCustomer.defaultColumns())
				.where('customer_id', id)
				.where('subsidiary_id', subsidiaryId)
				.where('company_id', companyId)
				.first();
			let record = {};
			if (!subsidiaryCustomer) {
				record = {
					totalSales: { [currency]: saleAmount },
					totalDebts: { [currency]: debtsSales },
					companyId,
					subsidiaryId,
					customerId: id,
				};
				await SubsidiaryCustomer.query().insert(record);
			} else {
				await SubsidiaryCustomer.query()
					.patch({
						totalSales: raw(`if(JSON_EXTRACT(total_sales, "$.${currency}") > 0, JSON_SET(total_sales, "$.${currency}", JSON_EXTRACT(total_sales, "$.${currency}")+${saleAmount}), JSON_SET(total_sales, "$.${currency}", ${saleAmount}))`),
						totalDebts: raw(`if(JSON_EXTRACT(total_debts, "$.${currency}") > 0, JSON_SET(total_debts, "$.${currency}", JSON_EXTRACT(total_debts, "$.${currency}")+${debtsSales}), JSON_SET(total_debts, "$.${currency}", ${debtsSales}))`),
					})
					.where('id', subsidiaryCustomer.id)
					.where('company_id', companyId);
			}
		}
		const totalBalance = flagDiscountBalance ? debtsSales : creditLimitationBalance;
		return this.query()
			.patch({
				totalSales: raw(`if(JSON_EXTRACT(total_sales, "$.${currency}") > 0, JSON_SET(total_sales, "$.${currency}", JSON_EXTRACT(total_sales, "$.${currency}")+${saleAmount}), JSON_SET(total_sales, "$.${currency}", ${saleAmount}))`),
				salesQuantity: raw('sales_quantity+??', [saleQuantity]),
				debtsSales: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, JSON_SET(debts_sales, "$.${currency}", JSON_EXTRACT(debts_sales, "$.${currency}")+${debtsSales}), JSON_SET(debts_sales, "$.${currency}", ${debtsSales}))`),
				flagDebts: raw(`if(JSON_EXTRACT(debts_sales, "$.${currency}") > 0, true, false)`),
				creditLimitationBalance: raw('credit_limitation_balance+??', [totalBalance]),
			})
			.where('id', id)
			.where('com_companies_id', companyId);
	}

	static async updateDiscountBalanceMultiple(customerUpdate = {}, subsidiary = {}, companyId) {
		const customerIds = Object.keys(customerUpdate);
		const data = customerIds.map((id) => {
			const idNumber = Number(id);
			const newData = customerUpdate[id];
			const customer = {
				id: idNumber,
				comCompaniesId: companyId,
				salesQuantity: raw('sales_quantity-??', [newData.saleQuantity]),
				creditLimitationBalance: raw('credit_limitation_balance-??', [
					newData.creditLimitationBalance,
				]),
			};
			if (newData.subsidiaryCustomerId) {
				customer.subsidiaryCustomer = {
					id: newData.subsidiaryCustomerId,
					subsidiaryId: subsidiary.id,
					customerId: idNumber,
					companyId,
				};
			}
			const currenciesDebtsSales = Object.keys(newData.debtsSales || {});
			if (currenciesDebtsSales && currenciesDebtsSales.length > 0) {
				customer.debtsSales = raw(`JSON_SET(debts_sales ${currenciesDebtsSales.reduce(
					(a, c) => `${a}, "$.${c}", debts_sales->>"$.${c}" - ${newData.debtsSales[c]}`,
					'',
				)})`);
				if (customer.subsidiaryCustomer) {
					customer.subsidiaryCustomer.totalDebts = raw(`JSON_SET(total_debts ${currenciesDebtsSales.reduce(
						(a, c) => `${a}, "$.${c}", total_debts->>"$.${c}" - ${newData.debtsSales[c]}`,
						'',
					)})`);
				}
			}
			const currenciesTotalSales = Object.keys(newData.totalSales || {});
			if (currenciesTotalSales && currenciesTotalSales.length > 0) {
				customer.totalSales = raw(`JSON_SET(total_sales ${currenciesTotalSales.reduce(
					(a, c) => `${a}, "$.${c}", total_sales->>"$.${c}" - ${newData.totalSales[c]}`,
					'',
				)})`);
				if (customer.subsidiaryCustomer) {
					customer.subsidiaryCustomer.totalSales = customer.totalSales;
				}
			}
			return customer;
		});

		if (subsidiary.id && subsidiary.id > 0 && data[0].subsidiaryCustomer) {
			const subsidiaryNew = { ...subsidiary };
			const currenciesDebtsSales = Object.keys(subsidiary.debtsSales || {});
			subsidiaryNew.debtsSales = raw(`JSON_SET(debts_sales ${currenciesDebtsSales.reduce(
				(a, c) => `${a}, "$.${c}", debts_sales->>"$.${c}" - ${subsidiary.debtsSales[c]}`,
				'',
			)})`);
			data[0].subsidiaryCustomer.subsidiary = subsidiaryNew;
		}
		return this.query().upsertGraph(data, {
			noDelete: true,
			unrelate: false,
		});
	}

	static isIn(customer, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('dni', customer.dni)
			.skipUndefined()
			.where('ruc', customer.ruc)
			.where('com_companies_id', companyId)
			.first();
	}

	static getByDocumentNumber(documentNumber) {
		return this.query()
			.select(this.defaultColumns())
			.where('dni', documentNumber)
			.orWhere('ruc', documentNumber)
			.first();
	}

	static getByDocumentNumbers(documentNumber) {
		return this.query()
			.select(this.defaultColumnsVendor())
			.whereIn('dni', documentNumber)
			.orWhereIn('ruc', documentNumber);
	}

	static getCustomersRepeated(companyId, documentNumber) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_companies_id', companyId)
			.where((builder) => {
				builder.whereIn('dni', documentNumber).orWhereIn('ruc', documentNumber);
			});
	}

	static createMultipleCustomer(data, companyId) {
		const newData = data.map((item) => {
			const obj = {};
			obj.comCompaniesId = companyId;
			const isNaturalPerson = item.tipoPersona !== 2 && item.tipoPersona !== 7;
			if (isNaturalPerson) {
				obj.name = item.nombre;
				obj.lastname = item.apellido;
				obj.dni = `${item.numeroDocumento}`;
			} else {
				obj.rzSocial = item.razonSocial;
				obj.ruc = `${item.numeroDocumento}`;
			}
			if (item.latitude && item.longitude) {
				const point = `"POINT(${item.latitude} ${item.longitude})"`;
				obj.location = this.raw(`GeomFromText(${point})`);
			}
			obj.address = item.direccion;
			obj.email = item.email;
			obj.flagTypePerson = item.tipoPersona;
			obj.phoneNumbers = [item.telefono];
			return obj;
		});
		const knex = Customer.knex();
		return transaction(knex, async () => {
			await this.query().insertGraph(newData);
		});
	}

	static getCustomerByEmail(email, companyId, id, provider) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('id', '!=', id)
			.skipUndefined()
			.where('provider', provider)
			.where('email', email)
			.where('flag_ecommerce', true)
			.where('com_companies_id', companyId)
			.first();
	}

	static getByAclCode(aclCode, codeCompany) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[salPricelist(selectColumns), commerce(selectColumns).[wayPaymentCommerce(selectColumns).wayPayment(selectColumns)]]')
			.where(`${this.tableName}.acl_code`, aclCode)
			.where(`${this.tableName}.flag_ecommerce`, true);
		if (codeCompany) {
			query
				.join('com_companies', 'com_companies.id', `${this.tableName}.com_companies_id`)
				.where('com_companies.code', codeCompany);
		}
		return query.first();
	}

	static findByRucDni(dato, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where((builder) => {
				builder
					.whereIn(`${this.tableName}.dni`, dato.arrayDni)
					.where(`${this.tableName}.flag_type_person`, '!=', juridica);
			})
			.orWhere((builder) => {
				builder
					.whereIn(`${this.tableName}.ruc`, dato.arrayRuc)
					.where(`${this.tableName}.flag_type_person`, juridica);
			})
			.where('com_companies_id', companyId);
	}

	static generateRawCaseCustomer(countryCode = peru) {
		const rucTypePerson = countryCode === peru ? 2 : 7;
		const caseSql = `CASE WHEN com_customers.flag_type_person = ${rucTypePerson} THEN ruc  ELSE dni END AS docNumber`;
		return caseSql;
	}

	static exportExcel({
		companyId,
		userId,
		flagTypePerson,
		flagActive,
		groupId,
		flagDebts,
		flagEcommerce,
		parishId,
		cityId,
		provinceId,
		startDate,
		endDate,
		countryCode = peru,
		typeCurrency = 'PEN',
	}) {
		const customerColums = [
			'id as id',
			'address as nameAddress',
			'email as email',
			'gender as gender',
			'sales_quantity as salesQuantity',
			'credit_limit_days as creditLimitDays',
			'credit_limitation_balance as creditLimitationBalance',
			'limit_amount_credit as limitAmountCredit',
		].map(c => `${this.tableName}.${c}`);
		const rawColumns = [
			raw(`DATE_FORMAT(DATE(${this.tableName}.created_at), '%Y-%m-%d') as createdAt`),
			raw(`JSON_EXTRACT(com_customers.total_sales, '$.${typeCurrency}') as amountCustomer`),
			raw(`JSON_EXTRACT(com_customers.debts_sales, '$.${typeCurrency}') as debtsSales`),
			raw("GROUP_CONCAT(com_customers.phone_numbers SEPARATOR ', ') as phoneNumbers"),
			raw('ANY_VALUE(CASE WHEN com_customers.gender = 1 THEN "MASCULINO" ELSE "FEMENINO" END) as genderName'),
			raw('p.fullname as fullname'),
			raw('tp.name as documentName'),
			raw('p.document_number as documentData'),
			raw(`DATE_FORMAT(DATE(${this.tableName}.created_at), '%Y-%m-%d') as dateCustomers`),
			raw(Customer.generateRawCaseCustomer(countryCode)),
		];
		const columns = customerColums.concat(rawColumns);
		const query = this.query()
			.select(columns)
			.join('ms_person as p', 'p.id', 'com_customers.person_id')
			.join('ms_type_person as tp', 'tp.id', 'com_customers.flag_type_person')
			.skipUndefined()
			.where('user_id', userId)
			.skipUndefined()
			.where('flag_type_person', flagTypePerson)
			.skipUndefined()
			.where('flag_active', flagActive)
			.skipUndefined()
			.where('group_id', groupId)
			.skipUndefined()
			.where('flag_debts', flagDebts)
			.skipUndefined()
			.where('flag_ecommerce', flagEcommerce)
			.skipUndefined()
			.where('parish_id', parishId)
			.skipUndefined()
			.where('city_id', cityId)
			.skipUndefined()
			.where('province_id', provinceId)
			.where(`${this.tableName}.com_companies_id`, companyId)
			.groupBy(`${this.tableName}.id`);
		if (startDate && endDate) {
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) >= ?', startDate);
			query.whereRaw('DATE(CONVERT_TZ(p.created_at, "+05:00", "+00:00")) <= ?', endDate);
		}
		return query;
	}

	static updateGroup(ids, groupId, companyId) {
		return this.query()
			.patch({ groupId })
			.whereIn('id', ids)
			.where('com_companies_id', companyId);
	}

	static updatePriceList(customersId, salPriceListId, companyId) {
		return this.query()
			.patch({ salPriceListId })
			.whereIn('id', customersId)
			.where('com_companies_id', companyId);
	}

	static getByGroupId(groupId, companyId) {
		return this.query()
			.select(this.onlyVirtualAttributes())
			.where('group_id', groupId)
			.where('com_companies_id', companyId);
	}

	static async getCustomersReportPdf(filter = {}, companyId) {
		const { search } = filter;
		const colummsRaw = [
			raw(`FORMAT(JSON_EXTRACT(com_customers.debts_sales, "$.${filter.currency}"), 2) as balance`),
			raw(Customer.generateRawCase(filter.countryCode)),
		];
		const customerColums = ['id', 'name'].map(c => `${this.tableName}.${c}`);
		const columns = colummsRaw.concat(customerColums);
		let query = this.query()
			.select(columns)
			.skipUndefined()
			.where('com_customers.com_companies_id', companyId)
			.skipUndefined()
			.where('user_id', filter.userId)
			.skipUndefined()
			.where('flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('group_id', filter.groupId)
			.skipUndefined()
			.where('flag_debts', filter.flagDebts);
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		if (search) {
			query = this.match(query, search, true);
		}
		const result = this.includePaginationAndSort(query, filter);
		const data = await result;
		const totalsData = await this.getAllAmountTotal(filter, companyId);
		const concatData = data.concat(totalsData);
		return concatData;
	}

	static getCustomerByCif(codeExternal, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where((builder) => {
				builder
					.where('ruc', codeExternal)
					.orWhere('dni', codeExternal)
					.orWhere('email', codeExternal)
					.orWhere('website_address', codeExternal); // crear migrate en desarrollo a code_external
			})
			.where('com_companies_id', companyId)
			.first();
	}

	static getCustomerInvoicePdf(filter = {}, companyId, warehouseIds) {
		const { search } = filter;
		let query = this.query()
			.eager('[salesCustomers(selectColumns), subsidiaryCustomer(selectColumns).subsidiaryOneRelation(selectColumns), person(selectColumns)]')
			.select(this.defaultColumns())
			.join('sal_documents', 'sal_documents.customer_id', `${this.tableName}.id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal_documents.id')
			.skipUndefined()
			.where('com_customers.user_id', filter.userId)
			.skipUndefined()
			.where('com_customers.flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('com_customers.flag_active', filter.flagActive)
			.skipUndefined()
			.where('com_customers.group_id', filter.groupId)
			.skipUndefined()
			.where('com_customers.flag_debts', filter.flagDebts)
			.skipUndefined()
			.where('com_customers.flag_ecommerce', filter.flagEcommerce)
			.skipUndefined()
			.where('com_customers.province_id', filter.provinceId)
			.skipUndefined()
			.where('com_customers.city_id', filter.cityId)
			.skipUndefined()
			.where('com_customers.parish_id', filter.parishId)
			.where('com_customers.com_companies_id', companyId)
			.groupBy(`${this.tableName}.id`);
		query.modifyEager('salesCustomers', (builder) => {
			builder
				.select(
					raw('ANY_VALUE(DATE_FORMAT(sal_documents.date_emission, "%d-%m-%Y")) AS formatDateEmission'),
					raw('ANY_VALUE(CONCAT(SUBSTRING_INDEX(tt.code, 1, -2), "-", sal_documents.document_number)) AS typeAndDocumentNumber'),
				)
				.join('com_ms_type_documents as tt', 'tt.id', 'sal_documents.sal_type_document_id');
		});
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal_documents.warehouse_id', warehouseIds);
		}
		if (filter.comSubsidiaryId) {
			query.join('com_subsidiary_customers as sc', 'sc.customer_id', `${this.tableName}.id`);
			query.where('sc.subsidiary_id', filter.comSubsidiaryId);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (filter.initialPoint && filter.lastPoint) {
			query.where(`${this.tableName}.point`, '>=', filter.lastPoint);
			query.where(`${this.tableName}.point`, '<=', filter.initialPoint);
		}
		if (search) {
			query = this.match(query, search);
		}
		if (filter.prospect) {
			query.where('com_customers.prospect', filter.prospect);
		}
		if (filter.vendor) {
			query.whereNotNull('com_customers.location');
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		query = this.commerceFilter(query, filter);
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static async getCustomerInvoiceTotalPdf(companyId, filter = {}, warehouseIds) {
		const { search } = filter;
		let query = this.query()
			.select(
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.total")) as totalSales'),
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.iva")) as totaIvas'),
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) as subTotalSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal_documents.total_taxes_amount, "$.iva")) > 0 THEN sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subIvaSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal_documents.total_taxes_amount, "$.iva")) = 0 THEN sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subExIvaSales'),
				raw('sum(JSON_EXTRACT(sal_documents.total_taxes_amount, "$.discount")) as totalDiscount'),
			)
			.join('sal_documents', 'sal_documents.customer_id', `${this.tableName}.id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal_documents.id')
			.skipUndefined()
			.where('com_customers.user_id', filter.userId)
			.skipUndefined()
			.where('com_customers.flag_type_person', filter.flagTypePerson)
			.skipUndefined()
			.where('com_customers.flag_active', filter.flagActive)
			.skipUndefined()
			.where('com_customers.group_id', filter.groupId)
			.skipUndefined()
			.where('com_customers.flag_debts', filter.flagDebts)
			.skipUndefined()
			.where('com_customers.flag_ecommerce', filter.flagEcommerce)
			.skipUndefined()
			.where('com_customers.province_id', filter.provinceId)
			.skipUndefined()
			.where('com_customers.city_id', filter.cityId)
			.skipUndefined()
			.where('com_customers.parish_id', filter.parishId)
			.where('com_customers.com_companies_id', companyId);
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal_documents.warehouse_id', warehouseIds);
		}
		if (filter.comSubsidiaryId) {
			query.join('com_subsidiary_customers as sc', 'sc.customer_id', `${this.tableName}.id`);
			query.where('sc.subsidiary_id', filter.comSubsidiaryId);
		}
		if (filter.initialPoint && filter.lastPoint) {
			query.where(`${this.tableName}.point`, '>=', filter.lastPoint);
			query.where(`${this.tableName}.point`, '<=', filter.initialPoint);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (search) {
			query = this.match(query, search);
		}
		if (filter.prospect) {
			query.where('com_customers.prospect', filter.prospect);
		}
		if (filter.vendor) {
			query.whereNotNull('com_customers.location');
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(sal_documents.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		query = this.commerceFilter(query, filter);
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static async getCustomerWayToPayPdfTotal(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw('ANY_VALUE(mttb.code) as codeTypeTransactionBank'),
				raw('sum(JSON_EXTRACT(sal.total_taxes_amount, "$.total")) as totalSales'),
				raw('sum(JSON_EXTRACT(sal.total_taxes_amount, "$.iva")) as totaIvas'),
				raw('sum(JSON_EXTRACT(sal.total_taxes_amount, "$.subtotalWithoutTax")) as subTotalSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal.total_taxes_amount, "$.iva")) > 0 THEN sum(JSON_EXTRACT(sal.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subIvaSales'),
				raw('ANY_VALUE(CASE WHEN (JSON_EXTRACT(sal.total_taxes_amount, "$.iva")) = 0 THEN sum(JSON_EXTRACT(sal.total_taxes_amount, "$.subtotalWithoutTax")) ELSE 0 END) as subExIvaSales'),
				raw('sum(JSON_EXTRACT(sal.total_taxes_amount, "$.discount")) as totalDiscount'),
			])
			.join('sal_documents as sal', 'sal.customer_id', `${this.tableName}.id`)
			.join('sal_sale_documents_detail as sd', 'sd.sal_sale_documents_id', 'sal.id')
			.join('ca_amortizations_details as cad', 'cad.sal_document_id', 'sal.id')
			.join('com_ms_type_payments as cmtp', 'cmtp.id', 'cad.type_payment_id')
			.join('ms_type_transaction_bank as mttb', 'mttb.id', 'cmtp.type_transaction_bank_id')
			.skipUndefined()
			.where('sal.com_subsidiary_id', filter.comSubsidiaryId)
			.where('sal.com_company_id', companyId)
			.groupBy('mttb.code');
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sal.warehouse_id', warehouseIds);
		}
		if (filter.categoryId) {
			query.where('sd.category_id', filter.categoryId);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(sal.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(sal.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static getAllCustomerPdf(filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns(), 'p.document_number')
			.innerJoin('ms_person as p', 'p.id', `${this.tableName}.person_id`)
			.where(`${this.tableName}.com_companies_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.user_id`, filter.userId)
			.skipUndefined()
			.where(`${this.tableName}.flag_type_person`, filter.flagTypePerson)
			.skipUndefined()
			.where(`${this.tableName}.group_id`, filter.groupId)
			.skipUndefined()
			.where(`${this.tableName}.flag_debts`, filter.flagDebts)
			.groupBy(`${this.tableName}.id`);
		if (filter.comSubsidiaryId) {
			query
				.join(
					'com_subsidiary_customers',
					'com_subsidiary_customers.customer_id',
					`${this.tableName}.id`,
				)
				.where('com_subsidiary_customers.subsidiary_id', filter.comSubsidiaryId);
		}

		if (search) {
			query = this.match(query, search);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static async getcustomerAccountStatementPdf(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				'com_customers.id',
				'com_customers.name',
				'mp.document_number AS invoiceNumberCustomer',
				raw('sum(CASE WHEN sd.payment_method_id = 1 THEN (sd.amount) END) AS totalDebit'),
				raw('sum(CASE WHEN sd.payment_method_id = 2 THEN (sd.amount) END) AS totalCredit'),
				raw('ANY_VALUE(cdas.amount) - sum(cdas.due_amount) as totalBalance'),
			])
			.eager('[documentAccountStatusCustomer(defaultColumnsReportPdf)]')
			.join('ms_person as mp', 'mp.id', 'com_customers.person_id')
			.join('com_document_account_status as cdas', 'cdas.customer_id', 'com_customers.id')
			.join('sal_documents as sd', 'sd.id', 'cdas.sale_document_id')
			.modifyEager('documentAccountStatusCustomer', (builder) => {
				builder
					.select([
						raw('CONCAT(cmtd.code, "-", sd2.document_number) AS invoiceNumber'),
						raw('ANY_VALUE(cmtd.code) as codeMsTypeDocument'),
						raw('ANY_VALUE(CASE WHEN sd2.payment_method_id = 1 THEN (sd2.amount) END) AS debit'),
						raw('ANY_VALUE(CASE WHEN sd2.payment_method_id = 2 THEN (sd2.amount) END) AS credit'),
						raw('ANY_VALUE(sum(com_document_account_status.amount - com_document_account_status.due_amount)) as balance'),
					])
					.join('sal_documents as sd2', 'sd2.id', 'com_document_account_status.sale_document_id')
					.join('com_ms_type_documents as cmtd', 'cmtd.id', 'sd2.sal_type_document_id');
			})
			.where(`${this.tableName}.com_companies_id`, companyId)
			.where('cdas.currency', filter.currency)
			.skipUndefined()
			.where('cdas.subsidiary_id', filter.comSubsidiaryId)
			.groupBy(`${this.tableName}.id`);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		if (warehouseIds) {
			query.whereIn('cdas.warehouse_id', warehouseIds);
		}
		return query;
	}

	static async getcustomerAccountStatementTotalPdf(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw('sum(CASE WHEN sd.payment_method_id = 1 THEN (sd.amount) END) AS totalDebit'),
				raw('sum(CASE WHEN sd.payment_method_id = 2 THEN (sd.amount) END) AS totalCredit'),
				raw('ANY_VALUE(sum(cdas.amount) - sum(cdas.due_amount)) as totalBalance'),
			])
			.join('com_document_account_status as cdas', 'cdas.customer_id', 'com_customers.id')
			.join('sal_documents as sd', 'sd.id', 'cdas.sale_document_id')
			.where(`${this.tableName}.com_companies_id`, companyId)
			.where('cdas.currency', filter.currency)
			.skipUndefined()
			.where('cdas.subsidiary_id', filter.comSubsidiaryId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) >= ?',
				filter.startDate,
			);
			query.whereRaw(
				'DATE(CONVERT_TZ(com_customers.created_at, "+05:00", "+00:00")) <= ?',
				filter.endDate,
			);
		}
		if (warehouseIds) {
			query.whereIn('cdas.warehouse_id', warehouseIds);
		}
		return query;
	}

	static getByEmails(emails, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('email', emails)
			.where('com_companies_id', companyId);
	}
}
module.exports = Customer;
