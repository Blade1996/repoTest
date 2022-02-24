'use strict';

const { Model, raw, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const simpleAxios = require('./../api/shared/simple-axios');
const ComCommerceInformation = require('./ComCommerceInformation');
const WayPaymentCommerce = require('./WayPaymentCommerce');
const ComEmployee = require('./ComEmployee');
const ComSubsidiaries = require('./ComSubsidiaries');
const Terminal = require('./Terminal');
const TerminalUser = require('./TerminalUser');
const { PromiseAll } = require('./../shared/helper');
const { buildAndGenerateToken } = require('./../shared/generate-token');
const { defaultAxios } = require('./../api/shared/pre');
const { isDevOrProd, makeRandomString, generateFormatSlug } = require('./../shared/helper');
const { localDate } = require('./helper');
const SalPriceLists = require('./SalPriceLists');

class ComEcommerceCompany extends baseModel {
	static get tableName() {
		return 'com_ecommerce_company';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_ecommerce_company.company_id',
					to: 'com_companies.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_ecommerce_company.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_ecommerce_company.employee_id',
					to: 'com_employee.id',
				},
			},
			helperCenter: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComCommerceInformation.js`,
				filter: query => query.orderBy('type_helper_center', 'asc'),
				join: {
					from: 'com_ecommerce_company.id',
					to: 'com_commerce_information.com_commerce_id',
				},
			},
			terminals: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'com_ecommerce_company.id',
					to: 'sal_terminals.commerce_id',
				},
			},
			wayPaymentCommerce: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/WayPaymentCommerce.js`,
				join: {
					from: 'com_ecommerce_company.id',
					to: 'com_way_payment_commerce.commerce_id',
				},
			},
			commerceChildren: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CommerceHierarchy.js`,
				join: {
					from: 'com_ecommerce_company.id',
					to: 'ms_commerces_hierarchy.commerce_child_id',
				},
			},
			fairCommerce: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/FairsCommerce.js`,
				join: {
					from: 'com_ecommerce_company.id',
					to: 'com_fairs_commerce.commerce_id',
				},
			},
			orders: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'com_ecommerce_company.id',
					to: 'sal_orders.commerce_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['code', 'name', 'email'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				rzSocial: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				address: {
					type: ['string', 'null'],
				},
				socialNetworks: {
					type: ['array', 'null'],
					default: [],
				},
				templateId: {
					type: ['integer', 'null'],
				},
				settings: {
					type: ['object', 'null'],
					default: {},
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				warehousesRelated: {
					type: 'array',
					default: [],
				},
				wayPaymentRelated: {
					type: ['array', 'null'],
					default: [],
				},
				bankAccountsRelated: {
					type: ['array', 'null'],
					default: [],
				},
				urlDomain: {
					type: ['string', 'null'],
				},
				metadata: {
					type: ['object', 'null'],
					default: {},
				},
				favicon: {
					type: ['object', 'null'],
					default: {},
				},
				tokenStore: {
					type: ['string', 'null'],
				},
				templateCode: {
					type: ['string', 'null'],
				},
				colorCode: {
					type: ['string', 'null'],
				},
				urlQr: {
					type: ['string', 'null'],
				},
				whatsappNumber: {
					type: ['string', 'null'],
				},
				scriptChat: {
					type: ['string', 'null'],
				},
				deliveryType: {
					type: ['array', 'null'],
					default: [],
				},
				promotionSettings: {
					type: ['object', 'null'],
					default: {},
				},
				codePromotion: {
					type: ['string', 'null'],
				},
				flagModel: {
					type: ['boolean', 'null'],
				},
				slug: {
					type: ['string', 'null'],
				},
				plan: {
					type: ['object', 'null'],
				},
				subItemSlug: {
					type: ['string', 'null'],
				},
				subItemId: {
					type: ['integer', 'null'],
				},
				ItemSlug: {
					type: ['string', 'null'],
				},
				ubigeoData: {
					type: ['object', 'null'],
				},
				contactData: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static promotionColumns() {
		return ['name', 'rz_social', 'promotion_settings'];
	}

	static costShippingColumns() {
		return ['settings', 'address', 'latitude', 'longitude'];
	}

	static credentialColumns() {
		return ['id', 'name', 'code', 'address', 'latitude', 'longitude', 'settings'];
	}

	static publicColumns() {
		return [
			'id',
			'slug',
			'code',
			'name',
			'rz_social',
			'document_number',
			'email',
			'phone',
			'address',
			'url_image',
			'settings',
			'subsidiary_id',
			'url_domain',
			'metadata',
			'template_code',
			'color_code',
			'favicon',
			'url_qr',
			'whatsapp_number',
			'flag_active',
			'script_chat',
			'delivery_type',
			'item_id',
			'latitude',
			'longitude',
			'contact_data',
			'ubigeo_data',
		];
	}

	static get namedFilters() {
		return {
			publicColumns: builder => builder.select(this.publicColumns()),
			selectColumns: builder => builder.select(this.defaultColumns()),
			simpleColumns: builder => builder.select('id', 'warehouses_related', 'subsidiary_id'),
			promotionColumns: builder => builder.select(this.promotionColumns()),
			basicColumns: builder => builder.select('id', 'name', 'code', 'way_payment_related'),
			fairColumns: builder => builder.select(this.defaultColumns('token_store')),
			costShippingColumns: builder => builder.select(this.costShippingColumns()),
			credentialColumns: builder => builder.select(this.credentialColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'slug',
			'code',
			'name',
			'rz_social',
			'document_number',
			'location',
			'email',
			'phone',
			'address',
			'url_image',
			'social_networks',
			'acl_code',
			'template_id',
			'settings',
			'employee_id',
			'subsidiary_id',
			'warehouses_related',
			'way_payment_related',
			'bank_accounts_related',
			'url_domain',
			'metadata',
			'template_code',
			'color_code',
			'favicon',
			'url_qr',
			'whatsapp_number',
			'flag_active',
			'script_chat',
			'delivery_type',
			'item_id',
			'promotion_settings',
			'latitude',
			'longitude',
			'plan',
			'ubigeo_data',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}
	static match(query, search) {
		query.whereRaw(
			'MATCH(slug, code, name, rz_social, document_number, email, phone, address, url_image, acl_code, url_domain) AGAINST(?)',
			[search],
		);
		return query;
	}

	static getAll(filter = {}, companyId, aclFilters) {
		const { search } = filter;
		let newColumns = filter.showToken ? [`${this.tableName}.token_store`] : [];
		newColumns = newColumns.concat(this.defaultColumns());
		let query = this.query()
			.eager('[helperCenter(selectColumns).section(selectColumns), wayPaymentCommerce(selectColumns).wayPayment(selectColumns), terminals(selectColumns), fairCommerce(selectColumns).fair(selectColumns), employee(aclBasicColumns)]')
			.aclFilter(aclFilters.commerces, this.tableName)
			.skipUndefined()
			.where('template_id', filter.templateId)
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('item_id', filter.itemId)
			.skipUndefined()
			.where('sub_item_slug', filter.subItemSlug)
			.skipUndefined()
			.where('flag_model', filter.flagModel)
			.where('company_id', companyId);

		if (search) {
			const fields = [
				'code',
				'name',
				'rz_social',
				'document_number',
				'email',
				'phone',
				'address',
				'url_image',
				'acl_code',
				'url_domain',
			];
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}

		if (filter.totalOrders) {
			const orderTable = 'sal_orders';
			const totalOrdersRaw = raw(
				`(SELECT COUNT(*) FROM sal_orders WHERE ${
					this.tableName
				}.id = ${orderTable}.commerce_id AND ${orderTable}.flag_status_order != ??) AS totalOrders`,
				1,
			);
			newColumns.push(totalOrdersRaw);
		}

		if (filter.latitude && filter.longitude) {
			const distanceRaw = raw(
				`(6371 * acos(cos(radians(?)) * cos(radians(${this.tableName}.latitude)) * cos(radians(${
					this.tableName
				}.longitude) - radians(?)) + sin(radians(?)) * sin(radians(${
					this.tableName
				}.latitude)))) AS distance`,
				filter.latitude,
				filter.longitude,
				filter.latitude,
			);
			newColumns.push(distanceRaw);
			query
				.select(newColumns)
				.whereNotNull(`${this.tableName}.location`)
				// .having('distance', '<=', filter.kilometerRadius || 2)
				.orderBy('distance');
		} else {
			query.select(newColumns);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getReportData(id, companyId, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('orders(selectColumns)')
			.modifyEager('orders', (builder) => {
				builder
					.select([
						raw('(CASE WHEN sal_orders.way_payment_detail_code = "mercadopago" THEN "MP" ELSE SUBSTRING(sal_orders.way_payment_detail_code, 1, 4) END)  as paymentSpecialCode'),
						raw('if(JSON_EXTRACT(sal_orders.additional_info, "$.includeShipping") || sal_orders.flag_money_taken_driver, "C", "SC") as statusCharge'),
						raw('(sal_orders.amount_collect_driver - sal_orders.cost_shipping) as balance'),
						raw('(com_customers.name) as nameCustomer'),
						raw(`DATE_FORMAT(sal_orders.created_at,  '${'%d-%m-%Y'}') AS created`),
						raw(`DATE_FORMAT(sal_orders.delivery_date,  '${'%d-%m-%Y'}') AS dateDelivery`),
					])
					.join('com_customers', 'com_customers.id ', 'sal_orders.id')
					.groupBy('sal_orders.id');
				if (filter.deliveryId) {
					builder.where('delivery_id', filter.deliveryId);
				}
				// if (filter.liquidStatus) {
				// 	builder.where('liquid_status', filter.liquidStatus);
				// }
				if (filter.typeOrder) {
					builder.where('type_order', filter.typeOrder);
				}
			})
			.skipUndefined();
		query.where(`${this.tableName}.id`, id);
		query.where(`${this.tableName}.company_id`, companyId);
		return query;
	}

	static getPromotionCode(coupon, tokenStore) {
		return this.query()
			.eager('[company(selectColumns).country(selectColumns)]')
			.select(this.promotionColumns())
			.skipUndefined()
			.where('token_store', tokenStore)
			.where('code_promotion', coupon);
	}

	static async create(data, trx) {
		const newData = data;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		const newEcommerce = await this.query(trx).insertGraph(data);
		return newEcommerce;
	}

	static getById(id, companyId, code = 'id') {
		return this.query()
			.eager('[employee(selectColumns), subsidiary(selectColumns), helperCenter(selectColumns).section(selectColumns), wayPaymentCommerce(selectColumns).wayPayment(selectColumns), terminals(selectColumns)]')
			.select(this.defaultColumns())
			.where(`${this.tableName}.${code}`, id)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getByIdBasic({ id, companyId, fields = [] }) {
		const columns = ['id', 'subsidiary_id'];
		return this.query()
			.select(columns.concat(fields))
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getByIdSimple(id, companyId, code = 'id') {
		return this.query()
			.select(this.credentialColumns())
			.eager('[wayPaymentCommerce(credentialColumns).wayPayment(credentialColumns)]')
			.where(`${this.tableName}.${code}`, id)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getByIds(id) {
		return this.query()
			.select('id', 'code')
			.whereIn(`${this.tableName}.id`, id);
	}

	static getByIdWithoutCompany(id) {
		return this.query()
			.select('id', 'code')
			.where(`${this.tableName}.id`, id);
	}

	static getByCode(code, companyId, flagDataSensitive) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[helperCenter(selectColumns).section(selectColumns), wayPaymentCommerce(selectColumnsPublic), company(selectColumns), subsidiary(selectColumns)]')
			.where('company_id', companyId)
			.where('code', code)
			.first();
		if (flagDataSensitive) {
			query.modifyEager('wayPaymentCommerce', (builder) => {
				builder.select('com_way_payment_commerce.gateway_configuration');
			});
		}
		return query;
	}

	static getByDefaultCommerce(companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[wayPaymentCommerce(selectColumnsPublic)]')
			.innerJoin('com_subsidiaries', 'com_subsidiaries.id ', `${this.tableName}.subsidiary_id`)
			.where((builder) => {
				builder.where('com_subsidiaries.flag_company_default', 1);
				builder.orWhere('com_subsidiaries.flag_default', 1);
			})
			.where(`${this.tableName}.company_id`, companyId)
			.first();
		return query;
	}

	static getCommerceByCode(code) {
		return this.query()
			.select(this.costShippingColumns())
			.where('code', code)
			.first();
	}

	static getByCodes(codes, companyId, flagDataSensitive) {
		const columns = flagDataSensitive ? this.defaultColumns() : this.publicColumns();
		const query = this.query()
			.select(columns)
			.where('company_id', companyId)
			.whereIn('code', codes);
		if (flagDataSensitive) {
			query.eager('[helperCenter(selectColumns).section(selectColumns), wayPaymentCommerce(selectColumns), company(selectColumns), subsidiary(selectColumns)]');
		}
		return query;
	}

	static getByDomain(urlDomain, flagDataSensitive) {
		const query = this.query()
			.select(this.defaultColumns(['company_id', 'token_store']))
			.eager('[helperCenter(selectColumns).section(selectColumns), wayPaymentCommerce(selectColumnsPublic), company(selectColumns), subsidiary(selectColumns)]')
			.where('url_domain', urlDomain)
			.first();
		if (flagDataSensitive) {
			query.modifyEager('wayPaymentCommerce', (builder) => {
				builder.select('com_way_payment_commerce.gateway_configuration');
			});
		}
		return query;
	}

	static async edit(id, data, { commerceInformation, wayPaymentCommerce }) {
		const knex = ComEcommerceCompany.knex();
		return transaction(knex, async (trx) => {
			const newData = data;
			if (newData.latitude && newData.longitude) {
				const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
				newData.location = this.raw(`GeomFromText(${point})`);
			}
			if (commerceInformation && commerceInformation.length > 0) {
				await ComCommerceInformation.updateCommerce(commerceInformation, data.companyId);
			}
			await WayPaymentCommerce.remove(id, undefined, data.companyId);
			if (wayPaymentCommerce && wayPaymentCommerce.length > 0) {
				await WayPaymentCommerce.query(trx).insertGraph(wayPaymentCommerce);
			}

			delete newData.wayPayment;
			delete newData.helperCenter;
			return this.query(trx)
				.patch(data)
				.where('id', id)
				.where('company_id', data.companyId);
		});
	}

	static async editInfo(id, data, companyId, trx) {
		return this.query(trx)
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editLimit(id, settings, companyId) {
		return this.query()
			.patch({ settings })
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getByTokenStore(tokenStore) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[helperCenter(selectColumns).section(selectColumns), subsidiary(selectColumns), wayPaymentCommerce(selectColumns).wayPayment(selectColumns), company(basicColumns)]')
			.where('token_store', tokenStore)
			.first();
	}

	static getByCommerce(companyId, id) {
		return this.query()
			.eager('wayPaymentCommerce(selectColumns).wayPayment(selectColumns)')
			.select(this.defaultColumns())
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.id`, id)
			.first();
	}

	static getByCommercePayment(companyId, id, useToken = false) {
		const columns = useToken ? this.defaultColumns(['token_store']) : this.defaultColumns();
		return this.query()
			.eager('wayPaymentCommerce(selectColumns).wayPayment(selectColumns)')
			.select(columns)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.id`, id)
			.first();
	}

	static updateFlagActive(id, flagActive, companyId) {
		return this.query()
			.patch({ flagActive })
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static getByCommercePriceList(commerceIds, companyId) {
		return this.query()
			.select('id', 'name', 'settings')
			.where(`${this.tableName}.company_id`, companyId)
			.whereIn(`${this.tableName}.id`, commerceIds);
	}

	static getByCommerceCompanyItem(companyId, itemId) {
		return this.query()
			.select('id', 'name', 'code')
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${this.tableName}.item_id`, itemId);
	}

	static updateEcomerce(id, data) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.id`, id);
	}

	static getFirst(companyId) {
		return this.query()
			.select('id', 'subsidiary_id')
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static getBySubsidiary(companyId, subsidiaryId, useToken = false) {
		const columns = useToken ? this.defaultColumns(['token_store']) : this.defaultColumns();
		return this.query()
			.eager('wayPaymentCommerce(selectColumns).wayPayment(selectColumns)')
			.select(columns)
			.where(`${this.tableName}.subsidiary_id`, subsidiaryId)
			.where(`${this.tableName}.company_id`, companyId)
			.first();
	}

	static updateMultipe(dataUpdate) {
		return this.query().upsertGraph(dataUpdate, {
			noDelete: true,
			unrelate: false,
		});
	}

	static async refreshtoken(eCommerceCompany, flagAssigned, companyId, employeeId, headers) {
		const knex = ComEcommerceCompany.knex();
		return transaction(knex, async (trx) => {
			const updated = await this.updateFlagAssigned(eCommerceCompany, flagAssigned, companyId, trx);
			const allButMe = await ComEmployee.getAllButMe(employeeId, companyId, trx);
			if (!flagAssigned) {
				await ComEmployee.deleteAllButMe(employeeId, companyId, trx);
			}
			const promises = allButMe.map(emp =>
				simpleAxios.patch(
					`${process.env.ACL_URL}/users`,
					{ codeUser: emp.aclUserCode, flagActive: !!flagAssigned },
					{ headers },
				));
			await PromiseAll(promises);
			return updated;
		});
	}

	static updateFlagAssigned(eCommerceCompany, flagAssigned, companyId, trx) {
		const { promotionSettings } = eCommerceCompany;
		const newPromotionSettings = { ...promotionSettings, flagAssigned };
		return this.query(trx)
			.patch({ promotionSettings: newPromotionSettings })
			.where(`${this.tableName}.id`, eCommerceCompany.id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static async getByItemModel(itemId, companyId) {
		return this.query()
			.select('id')
			.where('item_id', itemId)
			.where('flag_model', true)
			.where('company_id', companyId)
			.first();
	}

	static async buildAndCreateCommerce(
		payload,
		subsidiary,
		warehouse,
		{
			defaultWayPayment, deliveryTypeDefault, commerceChildrenBuilt, jsonPlan,
		},
		company,
		trx,
	) {
		const commerceCode = makeRandomString();
		const tokenStore = await buildAndGenerateToken(
			company.code,
			company.id,
			commerceCode,
			payload.documentNumber,
		);
		const wayPaymentCommerceBuilt = WayPaymentCommerce.buildWayPaymentWoCommerce({
			...defaultWayPayment,
			companyId: company.id,
		});
		const terminalBuilt = await Terminal.buildTerminal({
			subsidiaryId: subsidiary.id,
			name: `TERMINAL ${payload.commerceName}`,
			code: `TERMINAL-${payload.commerceName}-${payload.documentNumber}`,
			companyId: company.id,
			countryId: company.comCountryId,
			warehouse,
		});

		const warehouseEdited = { ...warehouse };
		warehouseEdited.isMain = warehouse.isMain ? 1 : 0;
		const slug =
			payload.slug || generateFormatSlug(`${payload.commerceName}${subsidiary.id}`, true);
		let domain = company.settings && company.settings.domainCatalog;
		domain = domain ? `${domain}/${slug}` : '';
		const commerceBuilt = {
			name: payload.commerceName,
			slug,
			code: commerceCode,
			rzSocial: payload.commerceName,
			address: payload.address,
			documentNumber: payload.documentNumber,
			subsidiaryId: subsidiary.id,
			itemId: payload.itemId,
			phone: payload.phone,
			whatsappNumber: payload.phone,
			aclCode: company.aclCode,
			tokenStore,
			companyId: company.id,
			wayPaymentCommerce: [wayPaymentCommerceBuilt],
			warehousesRelated: [warehouse.id],
			wayPaymentRelated: [defaultWayPayment.id],
			terminals: terminalBuilt,
			latitude: payload.latitude,
			longitude: payload.longitude,
			commerceChildren: commerceChildrenBuilt || undefined,
			urlDomain: domain,
			plan: jsonPlan && jsonPlan.commercePlan,
			ubigeoData: payload.ubigeoData,
			settings: {
				enablePushNotification: true,
				hash: company.hash || null,
				flagBilling: !!payload.flagBilling,
				defaultWarehouse: { ...warehouseEdited, subsidiary },
				salPriceListId: payload.salPriceListId,
				shippingCost: '0',
				serviceCost: '0',
				flowCreation: payload.flowCreation,
			},
			deliveryType: deliveryTypeDefault,
		};
		return this.create(commerceBuilt, trx);
	}

	static async assignedProductsToCommerce(commerce, commerceTeplate, payload, warehouse, headers) {
		const assignedBuilt = {
			flagReplyAllProducts: payload.flagReplyAllProducts,
			productsId: payload.productsId,
			commerceId: commerce.id,
			commerceName: payload.commerceName,
			commerceTemplateId: commerceTeplate.id,
			warehouseId: warehouse.id,
			salPriceListId: commerce.settings.salPriceListId,
		};
		const assigned = await simpleAxios({
			url: `${process.env.PRODUCTS_NEW_URL}/products-commerce`,
			method: 'POST',
			headers,
			data: assignedBuilt,
			validateStatus: () => true,
		});
		return assigned;
	}

	static async createNewCommerceEmployee(request) {
		const { payload } = request;
		const {
			company, subsidiaryBuilt, commerceTemplate, priceListBuilt, jsonPlan,
		} = request.pre;
		const data = { ...payload };
		const knex = ComEcommerceCompany.knex();
		return transaction(knex, async (trx) => {
			try {
				const httpNewProducts = defaultAxios('httpNewProducts', request);
				const subsidiary = await ComSubsidiaries.getAssignedForCommerce(
					subsidiaryBuilt,
					httpNewProducts,
					trx,
				);
				const priceList = await SalPriceLists.createDefault(priceListBuilt, trx);
				data.salPriceListId = priceList.id;
				data.documentNumber = payload.documentNumber || makeRandomString(true, 8);
				const warehouse = await ComSubsidiaries.buildAndCreateWarehouse(
					data,
					subsidiary.id,
					company.id,
					httpNewProducts,
				);
				const commerce = await ComEcommerceCompany.buildAndCreateCommerce(
					data,
					subsidiary,
					warehouse,
					request.pre,
					company,
					trx,
				);
				const hapiAxiosAcl = defaultAxios('httpAcl', request);
				const employee = await ComEmployee.buildAndCreateEmployee(
					{
						...data,
						warehouse,
						subsidiary,
						terminal: commerce.terminals,
						company,
						commerce,
						jsonPlan,
					},
					hapiAxiosAcl,
					trx,
				);
				await ComEcommerceCompany.editInfo(
					commerce.id,
					{ employeeId: employee.id },
					company.id,
					trx,
				);
				if (isDevOrProd()) {
					if (
						commerceTemplate &&
						(payload.flagReplyAllProducts || (payload.productsId && payload.productsId.length > 0))
					) {
						await ComEcommerceCompany.assignedProductsToCommerce(
							commerce,
							commerceTemplate,
							data,
							warehouse,
							request.headers,
						);
					}
				}
				return {
					employee,
					commerce,
					subsidiary,
					warehouse,
				};
			} catch (error) {
				return trx.rollback(error);
			}
		});
	}

	static async createSimpleCommerce(request) {
		const { payload, pre, auth } = request;
		const {
			subsidiaryBuilt, company, enableToCreateEmployee, priceListBuilt,
		} = pre;
		const { id } = auth.credentials.employee;
		const knex = ComEcommerceCompany.knex();
		return transaction(knex, async (trx) => {
			try {
				const httpNewProducts = defaultAxios('httpNewProducts', request);
				const subsidiary = await ComSubsidiaries.getAssignedForCommerce(
					subsidiaryBuilt,
					httpNewProducts,
					trx,
				);
				const warehouse = await ComSubsidiaries.buildAndCreateWarehouse(
					payload,
					subsidiary.id,
					company.id,
					httpNewProducts,
				);
				const priceList = await SalPriceLists.createDefault(priceListBuilt, trx);
				const commerce = await ComEcommerceCompany.buildAndCreateCommerce(
					{ ...payload, salPriceListId: priceList.id },
					subsidiary,
					warehouse,
					pre,
					company,
					trx,
				);
				await TerminalUser.buildAndCreate(id, commerce.terminals.id, company.id, trx);
				let employee = null;
				if (enableToCreateEmployee) {
					const hapiAxiosAcl = defaultAxios('httpAcl', request);
					employee = await ComEmployee.buildAndCreateEmployee(
						{
							...payload,
							warehouse,
							subsidiary,
							terminal: commerce.terminals,
							company,
							commerce,
						},
						hapiAxiosAcl,
						trx,
					);
					await ComEcommerceCompany.editInfo(
						commerce.id,
						{ employeeId: employee.id },
						company.id,
						trx,
					);
				}
				return {
					commerce,
					subsidiary,
					warehouse,
					employee,
				};
			} catch (error) {
				return trx.rollback(error);
			}
		});
	}

	static async handleNotification(data, domain = null) {
		const { dataNotifications, interested } = data;
		const emailToClient = () => {
			const dataNotification = {
				companyId: dataNotifications.companyId,
				data: {
					from: dataNotifications.from,
					fullName: `${data.name} ${data.surName}`,
					message: 'Bienvenido',
					fields: {
						fullName: `${data.name} ${data.surName}`,
						phone: data.phone,
						email: data.email,
						documentNumber: data.documentNumber,
						adress: data.address,
						password: data.password,
					},
					to: data.email,
					interested,
				},
				templateCode: dataNotifications.codeNotificationClient,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: dataNotification,
				validateStatus: () => true,
			});
		};

		const emailToCompany = () => {
			const dataNotification = {
				companyId: dataNotifications.companyId,
				data: {
					from: dataNotifications.from,
					fullName: `${data.name} ${data.surName}`,
					message: 'Información configuración de aplicación',
					fields: {
						fullName: `${data.name} ${data.surName}`,
						phone: data.phone,
						email: data.email,
						documentNumber: data.documentNumber,
						address: data.address,
					},
					to: dataNotifications.emailCompany,
					domain: dataNotifications.domain,
					interested,
				},
				templateCode: dataNotifications.codeNotificationCompany,
				sheetId: dataNotifications.sheetId,
			};
			Object.assign(dataNotification.data, data);
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`,
				method: 'POST',
				data: dataNotification,
				validateStatus: () => true,
			});
		};

		const wspToClient = () => {
			const dataNotification = {
				companyId: dataNotifications.companyId,
				data: {
					phone: data.phone,
					fields: {
						codeUser: data.email,
						fullname: `${data.name} ${data.surName}`,
						catalog: domain,
						mobile: 'https://casamarket.page.link/gonrVLU7vx7inAjdA',
						password: data.password,
						asesor: data.asesor,
						number: data.number,
					},
				},
				templateCode: dataNotifications.wtsTemplateClient,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/WMAKI/public`,
				method: 'POST',
				data: dataNotification,
				validateStatus: () => true,
			});
		};

		const wspToCompany = () => {
			const dataNotification = {
				companyId: dataNotifications.companyId,
				data: {
					phone: dataNotifications.phoneCompany,
					fields: {
						codeUser: data.email,
						hour: localDate(new Date(), 'HH:mm'),
						fullname: `${data.name} ${data.surName}`,
						catalog: domain,
						mobile: 'https://casamarket.page.link/gonrVLU7vx7inAjdA',
						phone: data.phone,
						email: data.email,
					},
				},
				templateCode: dataNotifications.wtsTemplateCompany,
			};
			return simpleAxios({
				url: `${process.env.NOTIFICATIONS_MAKI_URL}/notifications/WMAKI/public`,
				method: 'POST',
				data: dataNotification,
				validateStatus: () => true,
			});
		};

		if (dataNotifications.codeNotificationClient) {
			emailToClient();
		}
		if (dataNotifications.emailCompany && dataNotifications.codeNotificationCompany) {
			emailToCompany();
		}
		if (data.phone && dataNotifications.wtsTemplateClient) {
			wspToClient();
		}
		if (dataNotifications.phoneCompany && dataNotifications.wtsTemplateCompany) {
			wspToCompany();
		}
		return 0;
	}

	static validSlug(slug, companyId, id) {
		return this.query()
			.select('slug', 'company_id')
			.where('slug', slug)
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static getByFlagModel(companyId) {
		return this.query()
			.where('company_id', companyId)
			.where('flag_model', true)
			.first();
	}

	static getItems(companyId, filters = {}) {
		return this.query()
			.select(
				`${this.tableName}.id`,
				`${this.tableName}.slug`,
				`${this.tableName}.name`,
				`${this.tableName}.item_id`,
				`${this.tableName}.item_slug`,
				`${this.tableName}.sub_item_id`,
				`${this.tableName}.sub_item_slug`,
				`${this.tableName}.sub_item_slug`,
				'f.json_information',
			)
			.innerJoin('com_item', 'com_item.id ', `${this.tableName}.item_id`)
			.innerJoin('com_fairs_commerce as f', 'f.commerce_id', `${this.tableName}.id`)
			.where(`${this.tableName}.company_id`, companyId)
			.where('com_item.type', filters.type)
			.where('f.flag_active', 1);
	}

	static getByCodeCommerce(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', code)
			.where(`${this.tableName}.company_id`, companyId);
	}
}

module.exports = ComEcommerceCompany;
