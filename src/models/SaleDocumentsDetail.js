'use strict';

const { Model, transaction, raw } = require('objection');
const moment = require('moment');
const baseModel = require('./base');
const helper = require('./helper');
const { uniqueValues, getBdProducts } = require('../shared/helper');
const { getWhereInString, getWhereAndWhere } = require('./external/helperModel');

class SaleDocumentsDetail extends baseModel {
	static get tableName() {
		return 'sal_sale_documents_detail';
	}

	static get relationMappings() {
		return {
			sale: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_sale_documents_detail.sal_sale_documents_id',
					to: 'sal_documents.id',
				},
			},
			costCenter: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CostCenter.js`,
				join: {
					from: 'sal_sale_documents_detail.cost_center_id',
					to: 'com_cost_center.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['salSaleDocumentsId', 'price'],
			properties: {
				salSaleDocumentsId: {
					type: 'integer',
				},
				currency: {
					type: 'string',
				},
				quantity: {
					type: 'decimal',
				},
				price: {
					type: 'decimal',
				},
				warProductsId: {
					type: ['integer', 'null'],
				},
				productCode: {
					type: ['string', 'null'],
				},
				codeProductCubso: {
					type: ['string', 'null'],
				},
				salRemissionGuideId: {
					type: ['integer', 'null'],
				},
				dataOrder: {
					type: 'json',
				},
				discount: {
					type: 'number',
				},
				flagUse: {
					type: ['boolean', 'null', 'integer'],
				},
				flagDispatch: {
					type: ['boolean', 'integer'],
					default: false,
				},
				stockQuantity: {
					type: 'decimal',
				},
				importQuantity: {
					type: 'decimal',
				},
				brandId: {
					type: ['integer', 'null'],
				},
				brandName: {
					type: ['string', 'null'],
				},
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				salDocumentsId: {
					type: ['integer', 'null'],
				},
				salDocumentsNumber: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				externalCode: {
					type: ['string', 'null'],
				},
				tax: {
					type: 'decimal',
				},
				typeTaxId: {
					type: ['integer', 'null'],
				},
				taxAmount: {
					type: 'decimal',
				},
				unitName: {
					type: ['string', 'null'],
				},
				unitQuantity: {
					type: ['number', 'null'],
				},
				categoryName: {
					type: ['string', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				unitId: {
					type: ['integer', 'null'],
				},
				unitConversion: {
					type: ['number', 'null'],
				},
				unitCode: {
					type: ['string', 'null'],
				},
				priceCost: {
					type: ['number', 'null'],
				},
				taxes: {
					type: ['array', 'null'],
				},
				discountPercentage: {
					type: ['number', 'null'],
					default: 0,
				},
				unitPrice: {
					type: ['number', 'null'],
				},
				salePrice: {
					type: ['number', 'null'],
				},
				subtotalWithoutTax: {
					type: ['number', 'null'],
				},
				alternateCode: {
					type: ['array', 'null'],
					default: [],
				},
				categoryId: {
					type: ['integer', 'null'],
				},
				commentary: {
					type: ['string', 'null'],
				},
				quantityImport: {
					type: ['number', 'null'],
					default: 0,
				},
				quantityAvailable: {
					type: ['number', 'null'],
					default: 0,
				},
				warehouseName: {
					type: ['string', 'null'],
				},
				inlineFeatures: {
					type: ['string', 'null'],
				},
				orderNumber: {
					type: ['integer', 'null'],
					default: 0,
				},
				kardexId: {
					type: ['integer', 'null'],
				},
				priceSaleMin: {
					type: ['number', 'null'],
				},
				groupType: {
					type: ['integer', 'null'],
				},
				flagFree: {
					type: ['boolean', 'integer', 'null'],
				},
				freeAmount: {
					type: ['number', 'null'],
				},
				subsidyAmount: {
					type: ['number', 'null'],
				},
				aditionalInformation: {
					type: ['object', 'null'],
				},
				costCenterId: {
					type: ['integer', 'null'],
				},
				costCenterCode: {
					type: ['string', 'null'],
				},
				productPoint: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				totalRefund: {
					type: ['number', 'null'],
				},
				quantityRefund: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return [
			'subTotal',
			'priceWithOutDiscount',
			'formatNumbers',
			'benefit',
			'percentages',
			'productSeries',
			'productSeries',
		];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basiColumns: builder => builder.select(this.basicColumns()),
			benefitReport: builder =>
				builder.select(raw(`${this.tableName}.description AS productName, ${this.tableName}.price_cost AS cost, ${
					this.tableName
				}.price, ${this.tableName}.quantity`)),
		};
	}

	static defaultColumns() {
		return [
			'brand_id',
			'brand_name',
			'discount',
			'id',
			'import_quantity',
			'price',
			'quantity',
			'sal_sale_documents_id',
			'stock_quantity',
			'war_products_id',
			'product_code',
			'product_cubso_code',
			'war_warehouses_id',
			'flag_dispatch',
			'flag_use',
			'sal_remission_guide_id',
			'sal_documents_id',
			'sal_documents_number',
			'created_at',
			'description',
			'external_code',
			'tax',
			'type_tax_id',
			'tax_amount',
			'unit_name',
			'unit_quantity',
			'category_name',
			'code_taxes',
			'unit_id',
			'unit_conversion',
			'unit_code',
			'price_cost',
			'taxes',
			'discount_percentage',
			'unit_price',
			'sale_price',
			'subtotal_without_tax',
			'alternate_code',
			'category_id',
			'commentary',
			'quantity_import',
			'quantity_available',
			'warehouse_name',
			'order_number',
			'inline_features',
			'kardex_id',
			'group_type',
			'price_sale_min',
			'flag_free',
			'free_amount',
			'subsidy_amount',
			'aditional_information',
			'cost_center_id',
			'cost_center_code',
			'product_point',
			'additional_information',
			'total_refund',
			'quantity_refund',
		].map(c => `${this.tableName}.${c}`);
	}
	static basicColumns() {
		return ['id', 'product_code', 'description', 'quantity', 'discount'].map(c => `${this.tableName}.${c}`);
	}

	get subTotal() {
		/* eslint-disable no-mixed-operators */
		let subtotal = this.subtotalWithoutTax + this.taxAmount || 0;
		subtotal = subtotal > 0 ? Math.round(subtotal * 100) / 100 : subtotal;
		return subtotal;
	}

	get priceWithOutDiscount() {
		return this.price;
	}

	get formatNumbers() {
		let subsidyItem = 0;
		if (this.subsidyAmount) {
			subsidyItem = this.subsidyAmount / this.quantity;
		}
		return {
			quantity: this.quantity ? this.quantity.toFixed(2) : '0.00',
			price: this.price ? this.price.toFixed(2) : '0.00',
			discount: this.discount ? this.discount.toFixed(2) : '0.00',
			tax: this.tax ? this.tax.toFixed(2) : '0.00',
			taxAmount: this.taxAmount ? this.taxAmount.toFixed(2) : '0.00',
			subTotal: this.subTotal ? this.subTotal.toFixed(2) : '0.00',
			priceWithOutDiscount: this.priceWithOutDiscount
				? this.priceWithOutDiscount.toFixed(2)
				: '0.00',
			discountPercentage: this.discountPercentage ? this.discountPercentage.toFixed(2) : '0.00',
			unitPrice: this.unitPrice ? this.unitPrice.toFixed(2) : '0.00',
			subtotalWithoutTax: this.subtotalWithoutTax ? this.subtotalWithoutTax.toFixed(2) : '0.00',
			freeAmount: this.freeAmount ? this.freeAmount.toFixed(2) : '0.00',
			subsidyAmountItem: this.subsidyAmount ? Number(subsidyItem).toFixed(2) : '0.00',
			subsidyAmount: this.subsidyAmount ? Number(subsidyItem + this.unitPrice).toFixed(2) : '0.00',
		};
	}

	get benefit() {
		const price = this.price || 0;
		const priceCost = this.priceCost || 0;
		const quantity = this.quantity || 0;
		return Math.round((price - priceCost) * quantity * 100) / 100;
	}

	get percentages() {
		const price = this.price || 0;
		const priceCost = this.priceCost || 0;
		const quantity = this.quantity || 0;
		const sales = price * quantity;
		const costProduct = priceCost * quantity;
		const percentage = (sales > 0 ? (sales - costProduct) / sales : 0) * 100;
		const rounded = Math.round(percentage * 100) / 100;
		return rounded;
	}

	get productSeries() {
		const arraySeries = this.dataOrder && this.dataOrder.series;
		if (arraySeries && Array.isArray(arraySeries) && arraySeries.length > 0) {
			const stringSeries = arraySeries.reduce((acc, item) => `${acc}${item.serie},`, '');
			return stringSeries.substring(0, stringSeries.length - 1);
		}
		return '-';
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static async updateMultiple(data, tx) {
		const options = {
			noDelete: true,
			noInsert: true,
		};
		return this.query(tx).upsertGraph(data, options);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}
	static getByIds(salSaleDocumentsId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_sale_documents_id', salSaleDocumentsId);
	}

	static getAll(idSale) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_sale_documents_id', idSale);
	}

	static getAllByIds(ids, idSale) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.where('sal_sale_documents_id', idSale);
	}

	static getByIdsConvert(ids) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.whereRaw('flag_use IS NULL');
	}

	static getFlagUse(idSale) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_use', false)
			.where('sal_sale_documents_id', idSale)
			.first();
	}

	static getFlagUseValid(ids, idSale) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_use', 1)
			.whereIn('id', ids)
			.where('sal_sale_documents_id', idSale)
			.first();
	}

	static editByIds(ids, idSale, newSale) {
		const data = newSale;
		data.flagUse = true;
		return this.query()
			.patch(data)
			.whereIn('id', ids)
			.skipUndefined()
			.where('sal_sale_documents_id', idSale);
	}

	static remove(id, dataSale) {
		const knex = SaleDocumentsDetail.knex();
		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('id', id)
				.then(() => this.updateOrderDetails(dataSale.idSale))
				.then(() => this.getAll(dataSale.idSale)));
	}

	static removeAll(idSale) {
		return this.query()
			.softDelete()
			.where('sal_sale_documents_id', idSale);
	}

	static editFlagDispatch(ids, remissionGuideId, trx) {
		const data = { salRemissionGuideId: remissionGuideId, flagDispatch: true };
		return this.query(trx)
			.patch(data)
			.whereIn('id', ids);
	}

	static edit(id, saleDocumentsId, data) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('sal_sale_documents_id', saleDocumentsId);
	}

	static async updateOrderDetails(saleId) {
		const details = await this.getAll(saleId);
		const newDetailsPromise = details.map((item, index) =>
			this.query()
				.patch({ orderNumber: index + 1 })
				.where(`${this.tableName}.id`, item.id));
		return Promise.all(newDetailsPromise);
	}

	static getAllFlagDispatch(ids, flagDispatch, saleId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_sale_documents_id', saleId)
			.whereIn('id', ids)
			.skipUndefined()
			.where('flag_dispatch', flagDispatch);
	}

	static getNotFlagDispatch(documentId, flagAll = false) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('sal_sale_documents_id', documentId)
			.where((builder) => {
				builder.where('flag_dispatch', false).orWhere('flag_dispatch', null);
			});
		if (!flagAll) {
			query.first();
		}
		return query;
	}

	static async getStockProducts({
		companyId, productIds, warehouseId, details = [],
	}) {
		let stringProductIds;
		let products;
		const knex = SaleDocumentsDetail.knex();
		if (details.length > 0) {
			stringProductIds = getWhereAndWhere(details);
			products = await knex.schema.raw(
				`select p.id as id, wp.stock as stock from ${getBdProducts()}.war_warehouses_products wp inner join ${getBdProducts()}.war_products p on p.id = wp.product_id and p.company_id = ? and p.deleted_at is null and p.type not in (2,6) where wp.deleted_at is null and ${stringProductIds}`,
				[companyId],
			);
		} else {
			stringProductIds = getWhereInString(productIds);
			products = await knex.schema.raw(
				`select p.id as id, wp.stock as stock from ${getBdProducts()}.war_warehouses_products wp inner join ${getBdProducts()}.war_products p on p.id = wp.product_id and p.company_id = ? and p.deleted_at is null and p.type not in (2,6) where wp.warehouse_id = ? and wp.deleted_at is null and wp.product_id in ${stringProductIds}`,
				[companyId, warehouseId],
			);
		}
		return products[0];
	}

	static validStockProducts({ products, details }) {
		const productError = products.reduce((a, e) => {
			const product = details.find(item => item.warProductsId === e.id) || {};
			const { quantity = 0, unitQuantity = 0 } = product;
			const realQuantity = unitQuantity || quantity;
			if (product.warWarehousesId && e.stock - realQuantity < 0) {
				a.push({
					code: product.productCode,
					name: product.description,
					stock: e.stock,
					warehouseName: product.warehouseName,
				});
			}
			return a;
		}, []);
		return productError;
	}

	static getSaleProductsByCustomer(companyId, filter = {}) {
		const saleTable = 'sal_documents';
		const typeDocTable = 'com_ms_type_documents';
		let query = this.query()
			.select(raw(`${this.tableName}.description, ${this.tableName}.product_code, ${
				this.tableName
			}.war_products_id, ${this.tableName}.quantity, ${this.tableName}.price, ${
				this.tableName
			}.discount, CONCAT(${typeDocTable}.code, ${saleTable}.serie, "-", ${saleTable}.number) as document, ${saleTable}.created_at as date`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.innerJoin(typeDocTable, `${typeDocTable}.id`, `${saleTable}.sal_type_document_id`)
			.where(`${saleTable}.com_company_id`, companyId)
			.where(`${saleTable}.customer_id`, filter.customerId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, '!=', filter.typeDocumentNotId)
			.orderBy(`${this.tableName}.created_at`, 'desc');

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getTotalProduct(companyId, statesId, notTypeDocument, filter = {}) {
		const startDate = moment(filter.dateStart)
			.startOf('day')
			.local()
			.format('YYYY-MM-DD HH:mm:ss');
		const endDate = moment(filter.dateEnd)
			.endOf('day')
			.local()
			.format('YYYY-MM-DD HH:mm:ss');
		return this.query()
			.select(
				'sal_sale_documents_detail.war_products_id',
				raw('sum(sal_sale_documents_detail.quantity * (sal_sale_documents_detail.price - sal_sale_documents_detail.discount)) as total'),
			)
			.sum('sal_sale_documents_detail.quantity as quantity')
			.innerJoin(
				'sal_documents',
				'sal_sale_documents_detail.sal_sale_documents_id',
				'sal_documents.id',
			)
			.where('sal_documents.com_company_id', companyId)
			.where('sal_documents.sal_states_id', statesId)
			.whereNotIn('sal_documents.sal_type_document_id', notTypeDocument)
			.whereRaw('sal_documents.due_amount >= sal_documents.amount')
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			)
			.whereRaw(`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`, endDate)
			.skipUndefined()
			.where('sal_documents.com_employee_id', filter.employeeId)
			.groupBy('sal_sale_documents_detail.war_products_id');
	}

	static getSalesCustomer(typeDocumentId, companyId, status, ids, filter = {}) {
		let query = this.query()
			.select(raw(`sal_documents.customer_id, sum(${this.tableName}.quantity * (${this.tableName}.price - ${
				this.tableName
			}.discount)) as salesAmount, sum(${this.tableName}.quantity) as quantityProducts`))
			.innerJoin('sal_documents', `${this.tableName}.sal_sale_documents_id`, 'sal_documents.id')
			.where('sal_documents.com_company_id', companyId)
			.where('sal_documents.sal_states_id', status)
			.where('sal_documents.sal_type_document_id', '!=', typeDocumentId)
			.whereIn(`${this.tableName}.war_products_id`, ids)
			.groupBy('sal_documents.customer_id')
			.orderBy('salesAmount', 'desc');

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

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static editFlagUse(idSale) {
		return this.query()
			.patch({ flagUse: false, salDocumentsNumber: null, salDocumentsId: null })
			.where('sal_documents_id', idSale);
	}

	static costByWarehouse(companyId, filter = {}) {
		const saleTable = 'sal_documents';
		const query = this.query()
			.select(raw(`${saleTable}.warehouse_id, sum(${this.tableName}.price_cost * ${
				this.tableName
			}.quantity) as amount`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.where(`${saleTable}.com_company_id`, companyId)
			.whereRaw(`${saleTable}.warehouse_id IS NOT NULL`)
			.skipUndefined()
			.where(`${saleTable}.warehouse_id`, filter.warehouseId)
			.groupBy(`${saleTable}.warehouse_id`);

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		return query;
	}

	static async reportCategoryWarehouse(companyId, query) {
		const saleTable = 'sal_documents';
		const queryBd = this.query()
			.select(raw(`distinct ${this.tableName}.war_warehouses_id, ${this.tableName}.category_id, ${
				this.tableName
			}.unit_id, sum(if(${saleTable}.sal_type_document_id = 5, -${this.tableName}.quantity, ${
				this.tableName
			}.quantity)) as totalQuantity, sum(if(${saleTable}.sal_type_document_id = 5, ${
				this.tableName
			}.price * -${this.tableName}.quantity, ${this.tableName}.price * ${
				this.tableName
			}.quantity)) as totalSales, ${this.tableName}.warehouse_name, ${
				this.tableName
			}.category_name, ${this.tableName}.unit_name`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.whereRaw(`${this.tableName}.war_warehouses_id IS NOT NULL`)
			.whereRaw(`${this.tableName}.category_id IS NOT NULL`)
			.whereRaw(`${this.tableName}.unit_id IS NOT NULL`)
			.where(`${saleTable}.com_company_id`, companyId)
			.whereNot(`${saleTable}.sal_states_id`, query.stateId)
			.whereIn(`${saleTable}.sal_type_document_id`, query.typeDocumentIds)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				query.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				query.endDate,
			)
			.groupByRaw(`${this.tableName}.war_warehouses_id, ${this.tableName}.category_id, ${
				this.tableName
			}.unit_id, ${this.tableName}.warehouse_name, ${this.tableName}.category_name, ${
				this.tableName
			}.unit_name`);

		if (query.warehouseIds) {
			queryBd.whereIn(`${this.tableName}.war_warehouses_id`, query.warehouseIds);
		}

		if (query.categoryIds) {
			queryBd.whereIn(`${this.tableName}.category_id`, query.categoryIds);
		}

		const data = await queryBd;

		let reportColumns = [
			{
				name: 'Categoría',
				value: 'categoryName',
			},
		];
		const warehouses = [];
		data.forEach((item) => {
			const warehouseItem = reportColumns.find(i => i.name === `${item.warehouseName}-cant.vendida`);
			if (!warehouseItem) {
				warehouses.push(item.warWarehousesId);
				reportColumns = reportColumns.concat([
					{
						name: `${item.warehouseName}-cant.vendida`,
						value: `total${item.warWarehousesId}Quantity`,
					},
					{
						name: `${item.warehouseName}-unidad`,
						value: `unit${item.warWarehousesId}Name`,
					},
					{
						name: `${item.warehouseName}-monto.ventas`,
						value: `total${item.warWarehousesId}Sales`,
					},
				]);
			}
		});

		reportColumns = reportColumns.concat([
			{
				name: 'Total cantidad',
				value: 'summaryQuantity',
			},
			{
				name: 'Total ventas',
				value: 'summarySales',
			},
		]);

		const reportRows = [];
		data.forEach((item) => {
			const categoryUnit = reportRows.find(i => i.categoryName === `${item.categoryName}-${item.unitName}`);
			if (!categoryUnit) {
				const row = {
					categoryName: `${item.categoryName}-${item.unitName}`,
				};

				let summaryQuantity = 0;
				let summarySales = 0;
				warehouses.forEach((a, i) => {
					let categoryUnitItem = {};
					data.forEach((e) => {
						if (`${e.categoryName}-${e.unitName}` === `${item.categoryName}-${item.unitName}`) {
							if (i === 0) {
								summaryQuantity += e.totalQuantity;
								summarySales += e.totalSales;
							}
							if (e.warWarehousesId === a) {
								categoryUnitItem = e;
							}
						}
					});
					row[`total${a}Quantity`] = categoryUnitItem.totalQuantity || 0;
					row[`unit${a}Name`] = categoryUnitItem.unitName || '';
					row[`total${a}Sales`] = categoryUnitItem.totalSales || 0;
				});
				row.summaryQuantity = summaryQuantity;
				row.summarySales = summarySales;
				reportRows.push(row);
			}
		});

		const formatReport = {
			code: 'xlsx',
			columns: reportColumns,
			rows: reportRows,
			startDate: query.startDate,
			endDate: query.endDate,
		};

		return formatReport;
	}

	static async getSaleCategoryDetail(companyId, filter) {
		const saleTable = 'sal_documents';
		let query = this.query()
			.select(raw(`distinct ${this.tableName}.war_products_id,
				sum(${this.tableName}.quantity) as totalQuantity,
				sum(${this.tableName}.subtotal_without_tax + ${this.tableName}.tax_amount) as totalSales,
				${this.tableName}.product_code, ${this.tableName}.description`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.where(`${this.tableName}.war_warehouses_id`, filter.warehouseId)
			.where(`${this.tableName}.category_id`, filter.categoryId)
			.where(`${this.tableName}.unit_id`, filter.unitId)
			.where(`${saleTable}.com_company_id`, companyId)
			.whereNot(`${saleTable}.sal_states_id`, filter.stateId)
			.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupByRaw(`${this.tableName}.war_products_id,
				${this.tableName}.product_code,
				${this.tableName}.description`);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async reportSaleCategoryDetail(companyId, filter) {
		const data = await this.getSaleCategoryDetail(companyId, filter);
		if (data.length > 0) {
			const reportColumns = [
				{
					name: 'Codigo',
					value: 'productCode',
				},
				{
					name: 'Producto',
					value: 'description',
				},
				{
					name: 'Cantidad',
					value: 'totalQuantity',
				},
				{
					name: 'Total Ventas',
					value: 'totalSales',
				},
			];
			const reportRows = [];
			data.forEach((item) => {
				const row = {
					productCode: item.productCode,
					description: item.description,
					totalQuantity: item.totalQuantity,
					totalSales: item.totalSales,
				};
				reportRows.push(row);
			});
			const formatReport = {
				code: 'xlsx',
				columns: reportColumns,
				rows: reportRows,
				startDate: filter.startDate,
				endDate: filter.endDate,
			};
			return formatReport;
		}
		return null;
	}

	static async getSalesByCategory(companyId, filter) {
		const saleTable = 'sal_documents';
		let query = this.query()
			.select(raw(`distinct ${this.tableName}.war_warehouses_id,
				${this.tableName}.category_id,
				${this.tableName}.unit_id,
				sum(${this.tableName}.quantity) as totalQuantity, ${this.tableName}.warehouse_name,
				${this.tableName}.category_name, ${this.tableName}.unit_name`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.whereRaw(`${this.tableName}.war_warehouses_id IS NOT NULL`)
			.whereRaw(`${this.tableName}.category_id IS NOT NULL`)
			.whereRaw(`${this.tableName}.unit_id IS NOT NULL`)
			.where(`${saleTable}.com_company_id`, companyId)
			.whereNot(`${saleTable}.sal_states_id`, filter.stateId)
			.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupByRaw(`${this.tableName}.war_warehouses_id, ${this.tableName}.category_id, ${
				this.tableName
			}.unit_id, ${this.tableName}.warehouse_name, ${this.tableName}.category_name, ${
				this.tableName
			}.unit_name`);

		if (filter.warehouseIds) {
			query.whereIn(`${this.tableName}.war_warehouses_id`, filter.warehouseIds);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async reportSaleCategory(companyId, query) {
		const data = await this.getSalesByCategory(companyId, query);
		const reportColumns = [
			{
				name: 'Tienda',
				value: 'warehouseName',
			},
			{
				name: 'Categoria',
				value: 'categoryName',
			},
			{
				name: 'Cantidad',
				value: 'totalQuantity',
			},
			{
				name: 'Unidad',
				value: 'unitName',
			},
		];

		const reportRows = [];
		data.forEach((item) => {
			const row = {
				warehouseName: item.warehouseName,
				categoryName: item.categoryName,
				totalQuantity: item.totalQuantity,
				unitName: item.unitName,
			};
			reportRows.push(row);
		});

		const formatReport = {
			code: 'xlsx',
			columns: reportColumns,
			rows: reportRows,
			startDate: query.startDate,
			endDate: query.endDate,
		};

		return formatReport;
	}

	static getByCategories(companyId, filter) {
		const saleTable = 'sal_documents';
		return this.query()
			.select(raw(`${this.tableName}.category_id, ${this.tableName}.category_name, ${
				this.tableName
			}.war_products_id AS id, ${this.tableName}.description AS caracteristicas, ${
				this.tableName
			}.product_code AS code, ${this.tableName}.unit_id, ${
				this.tableName
			}.unit_name AS unidad, SUM(${this.tableName}.quantity) AS quantity,
				SUM(price * quantity) AS subtotal`))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.where(`${saleTable}.com_company_id`, companyId)
			.whereNotNull(`${this.tableName}.category_id`)
			.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.where(`${saleTable}.sal_states_id`, filter.status)
			.where(`${saleTable}.sal_type_document_id`, '!=', filter.typeDocumentId)
			.groupByRaw(`${this.tableName}.category_id, ${this.tableName}.category_name, ${
				this.tableName
			}.war_products_id, ${this.tableName}.description, ${this.tableName}.product_code, ${
				this.tableName
			}.unit_id, ${this.tableName}.unit_name`)
			.orderBy(`${this.tableName}.category_id`);
	}

	static deleteDetail(ids, idSale) {
		return this.query()
			.softDelete()
			.whereNotIn('id', ids)
			.where('sal_sale_documents_id', idSale);
	}

	static getList(companyId, filter, typeDocumentId, typePaymentId, statesId, aclFilters = {}) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';

		const query = this.query()
			.select(this.defaultColumns(), `${typeDocumentTable}.code AS typeDocumentCode`)
			.eager('sale(detailReportColumns)')
			.leftJoin(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV'])
			.where(`${saleTable}.com_company_id`, companyId)
			.aclFilter(aclFilters.sales, saleTable)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.warehouse_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel);

		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (filter.warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			if (filter.flagNotDocumentRelated) {
				query
					.leftJoin(`${saleTable} as b`, `${saleTable}.sal_documents_id`, 'b.id')
					.where((builder) => {
						builder
							.where((builder2) => {
								builder2
									.whereRaw(
										`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
										filter.startDate,
									)
									.whereRaw(
										`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
										filter.endDate,
									)
									.whereRaw(`${saleTable}.sal_documents_id IS NULL`);
							})
							.orWhere((builder2) => {
								builder2
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) >= ?',
										filter.startDate,
									)
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) <= ?',
										filter.endDate,
									);
							});
					});
			} else {
				query.whereRaw(
					`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
					filter.startDate,
				);
				query.whereRaw(
					`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
					filter.endDate,
				);
			}
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		query.orderBy(raw(`${this.tableName}.war_products_id, ${
			this.tableName
		}.unit_id, ${saleTable}.document_number`));
		return query;
	}

	static async setProductsToSales(Sales, detailsSale, authorization, url = '/v2/products/by-ids') {
		try {
			const productsIdUnique = uniqueValues(detailsSale.map(i => i.warProductsId));
			if (productsIdUnique.length > 0) {
				const { data: products } = await Sales.getProductsInformation(
					productsIdUnique,
					authorization,
					url,
				);
				const salesWithProducts = detailsSale.map((detail) => {
					const newDetail = detail;
					const product = products.find(p => p.id === newDetail.warProductsId);
					if (product) {
						newDetail.product = product;
					}
					return newDetail;
				});
				return salesWithProducts;
			}
			return [];
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static settleFormatTicket(saleDetails) {
		try {
			const buildSaleDetail = item => ({
				id: item.id,
				price: item.price,
				quantity: item.quantity,
				subtotal: item.price * item.quantity,
				warProductsId: item.warProductsId,
				productCode: item.productCode,
				unitId: item.unitId,
				unitCode: item.unitCode,
				documentNumber: `${(item.typeDocumentCode || '').substring(0, 1)}${item.sale &&
					item.sale.documentNumber}`,
				currency: item.sale && item.sale.currency,
				currencySymbol: item.sale && item.sale.currencySymbol,
			});

			const buildUnitDetail = acc => ({
				symbol: acc.lastDetail.sale && acc.lastDetail.sale.currencySymbol,
				unitCode: acc.lastDetail.unitCode,
				quantity: acc.quantity,
				subtotal: acc.subtotal,
				details: acc.details,
			});

			const restartCount = (acc, item) => {
				acc.details = [buildSaleDetail(item)];
				acc.quantity = item.quantity;
				acc.subtotal = item.quantity * item.price;
				return acc;
			};

			let warehouseName = '';
			saleDetails.push({ warProductsId: -1, unitId: -1 });
			const { orderedDetails } = saleDetails.reduce(
				(acc, item, i) => {
					acc.lastDetail = acc.currentDetail;
					acc.currentDetail = item;
					const sameProduct = acc.lastDetail.warProductsId === acc.currentDetail.warProductsId;
					const sameUnit = acc.lastDetail.unitId === acc.currentDetail.unitId;
					if (i === 0) {
						({ warehouseName } = item);
					}
					if (sameProduct) {
						if (sameUnit) {
							// save detail
							acc.details.push(buildSaleDetail(item));
							acc.quantity += item.quantity;
							acc.subtotal += item.quantity * item.price;
						} else {
							// save details by unit
							acc.detailsUnit.push(buildUnitDetail(acc));
							restartCount(acc, item);
						}
					} else {
						if (i !== 0) {
							// save last detail by unit
							acc.detailsUnit.push(buildUnitDetail(acc));

							// product information
							acc.orderedDetails.push({
								productName: acc.lastDetail.description,
								productCode: acc.lastDetail.productCode,
								productId: acc.lastDetail.warProductsId,
								unitId: acc.lastDetail.unitId,
								detailsUnit: acc.detailsUnit,
							});
							acc.detailsUnit = [];
						}
						restartCount(acc, item);
					}
					return acc;
				},
				{
					lastDetail: { warProductsId: null, unitId: null },
					currentDetail: { warProductsId: null, unitId: null },
					detailsUnit: [],
					details: [],
					quantity: 0,
					subtotal: 0,
					orderedDetails: [],
				},
			);
			return { orderedDetails, warehouseName };
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getByCashClosing(companyId, filter) {
		const saleTable = 'sal_documents';
		const typeDocumentTable = 'com_ms_type_documents';
		const columns = [
			raw(`${this.tableName}.war_products_id AS productId`),
			raw(`${this.tableName}.unit_code`),
			raw(`ANY_VALUE(${this.tableName}.description) AS productName`),
			raw(`ANY_VALUE(${this.tableName}.product_code) AS productCode`),
			raw(`SUM(${this.tableName}.quantity) AS total`),
		];
		return this.query()
			.select(columns)
			.join(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV'])
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.cancelStateId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashClosingId)
			.where(`${saleTable}.com_company_id`, companyId)
			.groupBy(raw('war_products_id, unit_code'))
			.having('total', '>', 0);
	}

	static getReportPdfSubsidiary(companyId, filter = {}, warehouseIds) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';

		const query = this.query()
			.select(
				this.defaultColumns(),
				`${typeDocumentTable}.code AS typeDocumentCode`,
				`${saleTable}.subsidiary_ruc`,
				raw(`DATE_FORMAT(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00"),'%d-%m-%Y') as formatCreatedAt`),
				raw(`CONCAT(SUBSTRING_INDEX(${typeDocumentTable}.code, 1, -2), "-", ${saleTable}.document_number) AS documentNumber`),
				raw(`${this.tableName}.sale_price * ${this.tableName}.quantity as total`),
			)
			.join(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.skipUndefined()
			.whereIn(`${typeDocumentTable}.code`, filter.documentTypesCodes)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, filter.typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, filter.statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel)
			.skipUndefined()
			.whereIn(`${saleTable}.terminal_id`, filter.terminalIs)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId);

		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (filter.typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		query.orderBy(raw(`${this.tableName}.war_products_id, ${
			this.tableName
		}.unit_id, ${saleTable}.document_number`));
		return query;
	}

	static getAllAmountTotal(companyId, filter = {}, warehouseIds) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';
		const rawColumns = [
			raw('sum(sal_sale_documents_detail.quantity) as totalQuantity, sum(sal_sale_documents_detail.price_cost) as totalPriceCost, sum(sal_sale_documents_detail.sale_price) as totalPriceSale, sum(sal_sale_documents_detail.discount) as totalDiscount'),
		];
		const query = this.query()
			.select(rawColumns)
			.join(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.skipUndefined()
			.whereIn(`${typeDocumentTable}.code`, filter.documentTypesCodes)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, filter.typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, filter.statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel)
			.skipUndefined()
			.whereIn(`${saleTable}.terminal_id`, filter.terminalIs)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId);

		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (filter.typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
						${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
								 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		query.orderBy(raw(`${this.tableName}.war_products_id, ${
			this.tableName
		}.unit_id, ${saleTable}.document_number`));
		return query;
	}

	static async getSalesByCategoryPdf(companyId, filter = {}, warehouseIds) {
		const saleTable = 'sal_documents';
		const typeDocumentTable = 'com_ms_type_documents';
		const query = this.query()
			.select(
				this.defaultColumns(),
				`${typeDocumentTable}.code AS typeDocumentCode`,
				`${saleTable}.subsidiary_ruc`,
				raw(`CONCAT(SUBSTRING_INDEX(${typeDocumentTable}.code, 1, -2), "-", ${saleTable}.document_number) AS documentNumber`),
				raw(`DATE_FORMAT(${this.tableName}.created_at, '%d-%m-%Y') AS formatCreatedAt`),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity * unit_price)) as total'),
				raw('sum(sal_sale_documents_detail.quantity) as totalQuantity'),
				raw('sum(sal_sale_documents_detail.price_cost) as totalPriceCost'),
				raw('sum(sal_sale_documents_detail.sale_price) as totalSalePrice'),
			)
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.groupBy(`${this.tableName}.category_id`);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}

		if (warehouseIds) {
			query.whereIn(`${this.tableName}.war_warehouses_id`, warehouseIds);
		}
		return query;
	}

	static async totalAmountCategory(companyId, filter = {}, warehouseIds) {
		const saleTable = 'sal_documents';
		const query = this.query()
			.select(raw('sum(sal_sale_documents_detail.quantity) as totalQuantity, sum(sal_sale_documents_detail.price_cost) as totalPriceCost, sum(sal_sale_documents_detail.sale_price) as totalPriceSale, sum(sal_sale_documents_detail.discount) as totalDiscount'))
			.innerJoin(saleTable, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}

		if (warehouseIds) {
			query.whereIn(`${this.tableName}.war_warehouses_id`, warehouseIds);
		}
		return query;
	}

	static getGroupProduct(companyId, filter = {}, warehouseIds) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';
		const query = this.query()
			.select(
				raw('ANY_VALUE(sal_sale_documents_detail.product_code) as productCode'),
				raw('ANY_VALUE(sal_sale_documents_detail.description) as description'),
				raw('ANY_VALUE(sal_sale_documents_detail.unit_name) as unitName'),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity)) as quantity'),
				raw('ANY_VALUE(sal_sale_documents_detail.price) as costUnit'),
				raw('ANY_VALUE(sal_sale_documents_detail.unit_price) as pUnit'),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity * unit_price)) as total'),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity * sal_sale_documents_detail.price) - (sal_sale_documents_detail.quantity * unit_price)) as utilidad'),
				raw('ANY_VALUE(sal_sale_documents_detail.war_products_id) as productId'),
			)
			.innerJoin(raw(`${saleTable} on ${saleTable}.id = sal_sale_documents_detail.sal_sale_documents_id`))
			.innerJoin(raw(`${typeDocumentTable} on ${typeDocumentTable}.id = sal_documents.sal_type_document_id`))
			.skipUndefined()
			.whereIn(`${typeDocumentTable}.code`, filter.documentTypesCodes)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, filter.typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, filter.statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel)
			.skipUndefined()
			.whereIn(`${saleTable}.terminal_id`, filter.terminalIs)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId)
			.groupByRaw('sal_sale_documents_detail.war_products_id asc');

		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (filter.typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		return query;
	}
	static getGroupProductTotal(companyId, filter = {}, warehouseIds) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';
		const query = this.query()
			.select(
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity)) as quantity'),
				raw('ANY_VALUE(sal_sale_documents_detail.price) as costUnit'),
				raw('ANY_VALUE(sal_sale_documents_detail.unit_price) as pUnit'),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity * unit_price)) as total'),
				raw('ANY_VALUE(sum(sal_sale_documents_detail.quantity * sal_sale_documents_detail.price) - sum(sal_sale_documents_detail.quantity * unit_price)) as utilidad'),
			)
			.innerJoin(raw(`${saleTable} on ${saleTable}.id = sal_sale_documents_detail.sal_sale_documents_id`))
			.innerJoin(raw(`${typeDocumentTable} on ${typeDocumentTable}.id = sal_documents.sal_type_document_id`))
			.skipUndefined()
			.whereIn(`${typeDocumentTable}.code`, filter.documentTypesCodes)
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, filter.typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, filter.statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel)
			.skipUndefined()
			.whereIn(`${saleTable}.terminal_id`, filter.terminalIs)
			.skipUndefined()
			.where(`${this.tableName}.category_id`, filter.categoryId);
		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}

		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (filter.typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		return query;
	}

	static getDetailsSale(salSaleDocumentsId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('sal_sale_documents_id', salSaleDocumentsId);
	}

	static async getReportExcelSale(companyId, filter) {
		const customerTable = 'com_customers';
		const transactionTable = 'sal_transactions';
		const typeDocumentTable = 'com_ms_type_documents';
		const transactionBankTable = 'com_transaction_bank';
		const saleTable = 'sal_documents';
		const query = this.query()
			.select(raw('(sal_sale_documents_detail.sale_price * sal_sale_documents_detail.quantity) as totalSalePrice, sal_sale_documents_detail.product_code, sal_sale_documents_detail.description, CONCAT(em.name,"",em.lastname) as name, em.id as employeeId'))
			.leftJoin(`${saleTable}`, `${saleTable}.id`, `${this.tableName}.sal_sale_documents_id`)
			.join(raw(`com_employee em on em.id = ${saleTable}.com_employee_id`))
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${saleTable}.sal_type_document_id`)
			.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV'])
			.where(`${saleTable}.com_company_id`, companyId)
			.skipUndefined()
			.where(`${saleTable}.sal_type_document_id`, filter.typeDocumentId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, filter.statesId)
			.skipUndefined()
			.where(`${saleTable}.table_id`, filter.tableId)
			.skipUndefined()
			.where(`${saleTable}.com_employee_id`, filter.employeeId)
			.skipUndefined()
			.where(`${saleTable}.sal_cash_desk_closing_id`, filter.cashDeskClosingId)
			.skipUndefined()
			.where(`${saleTable}.payment_state`, filter.paymentState)
			.skipUndefined()
			.where(`${saleTable}.currency`, filter.currency)
			.skipUndefined()
			.where(`${saleTable}.warehouse_id`, filter.warehouseId)
			.skipUndefined()
			.where(`${saleTable}.com_subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.where(`${saleTable}.ballot_summary_id`, filter.ballotSummaryId)
			.skipUndefined()
			.where(`${saleTable}.sal_states_id`, '!=', filter.flagNotCancel)
			.groupBy(`${saleTable}.com_employee_id`);

		if (filter.flagNotNotes) {
			query.whereNotIn(`${saleTable}.sal_type_document_id`, filter.flagNotNotes);
		}
		if (filter.salDocumentsId) {
			query.where(`${saleTable}.sal_documents_id`, filter.salDocumentsId);
		}
		if (filter.employeeIds) {
			query.whereIn(`${saleTable}.com_employee_id`, filter.employeeIds);
		}
		if (filter.saleIds) {
			query.whereIn(`${saleTable}.id`, filter.saleIds);
		}
		if (filter.flagSummaryBallot) {
			if (filter.flagSummaryBallot === 1) {
				query.whereNotNull(`${saleTable}.ballot_summary_id`);
			} else {
				query.whereNull(`${saleTable}.ballot_summary_id`);
			}
		}

		if (filter.customerId) {
			query.where(`${saleTable}.customer_id`, filter.customerId);
		}

		if (filter.flagAdvance) {
			query
				.where(`${saleTable}.flag_advance`, filter.flagAdvance)
				.whereNull('down_payment_document_id');
		}

		if (filter.cashIds) {
			query.whereIn(`${saleTable}.cash_id`, filter.cashIds);
		}

		if (filter.warehouseIds) {
			query.whereIn(`${saleTable}.warehouse_id`, filter.warehouseIds);
		}

		if (filter.report) {
			query
				.join(
					`${typeDocumentTable}`,
					`${typeDocumentTable}.id`,
					`${saleTable}.sal_type_document_id`,
				)
				.whereIn(`${typeDocumentTable}.code`, ['FAC', 'BOL', 'NTV']);
		}

		if (filter.stateIds) {
			query.whereIn(`${saleTable}.sal_states_id`, filter.stateIds);
		}

		if (filter.typeDocumentIds) {
			query.whereIn(`${saleTable}.sal_type_document_id`, filter.typeDocumentIds);
		}

		if (filter.typePaymentId || (filter.typePaymentIds && filter.typePaymentIds.length > 0)) {
			query
				.leftJoin(
					`${transactionTable}`,
					`${transactionTable}.sal_sale_documents_id`,
					`${saleTable}.id`,
				)
				.leftJoin(
					`${transactionBankTable}`,
					`${transactionBankTable}.sal_documents_id`,
					`${saleTable}.id`,
				)
				.groupBy(`${saleTable}.id`);

			if (filter.typePaymentId) {
				query.where((builder) => {
					builder
						.where(`${transactionTable}.type_payment_id`, filter.typePaymentId)
						.orWhere(`${transactionBankTable}.type_payment_id`, filter.typePaymentId);
				});
			}
			if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
				query.where((builder) => {
					builder
						.whereIn(`${transactionTable}.type_payment_id`, filter.typePaymentIds)
						.orWhereIn(`${transactionBankTable}.type_payment_id`, filter.typePaymentIds);
				});
			}
		}

		if (filter.paymentStates && filter.paymentStates.length > 0) {
			query.whereIn(`${saleTable}.payment_state`, filter.paymentStates);
		}

		if (filter.search) {
			if (!filter.customerId) {
				query
					.innerJoin(`${customerTable}`, `${customerTable}.id`, `${saleTable}.customer_id`)
					.where((builder) => {
						builder
							.whereRaw(
								`MATCH(${customerTable}.name, ${customerTable}.lastname, ${customerTable}.dni,
					${customerTable}.ruc, ${customerTable}.rz_social, ${customerTable}.email) AGAINST(?)`,
								[filter.search],
							)
							.orWhereRaw(
								`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
							 AGAINST(?)`,
								[filter.search],
							);
					});
			} else {
				query.whereRaw(
					`MATCH(${saleTable}.serie, ${saleTable}.number, ${saleTable}.document_number)
						 AGAINST(?)`,
					[filter.search],
				);
			}
		}

		if (filter.startDate && filter.endDate) {
			if (filter.flagNotDocumentRelated) {
				query
					.leftJoin(`${saleTable} as b`, `${saleTable}.sal_documents_id`, 'b.id')
					.where((builder) => {
						builder
							.where((builder2) => {
								builder2
									.whereRaw(
										`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
										filter.startDate,
									)
									.whereRaw(
										`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
										filter.endDate,
									)
									.whereRaw(`${saleTable}.sal_documents_id IS NULL`);
							})
							.orWhere((builder2) => {
								builder2
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) >= ?',
										filter.startDate,
									)
									.whereRaw(
										'DATE(CONVERT_TZ(b.created_at, "+05:00", "+00:00")) <= ?',
										filter.endDate,
									);
							});
					});
			} else {
				query.whereRaw(
					`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) >= ?`,
					filter.startDate,
				);
				query.whereRaw(
					`DATE(CONVERT_TZ(${saleTable}.created_at, "+05:00", "+00:00")) <= ?`,
					filter.endDate,
				);
			}
		}
		if (filter.statusTax) {
			if (!Array.isArray(filter.statusTax)) {
				query.where(`${saleTable}.status_tax`, filter.statusTax);
			} else if (Array.isArray(filter.statusTax) && filter.statusTax.length > 0) {
				query.whereIn(`${saleTable}.status_tax`, filter.statusTax);
			}
		}
		query.orderBy(raw(`${this.tableName}.war_products_id, ${
			this.tableName
		}.unit_id, ${saleTable}.document_number`));
		if (filter.saleIds && filter.saleIds.length > 0) {
			query.where('sd.id', filter.saleIds);
		}
		return query;
	}
}

module.exports = SaleDocumentsDetail;
