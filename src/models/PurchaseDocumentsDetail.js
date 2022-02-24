'use strict';

const { Model, raw } = require('objection');
const { isNullOrUndefined } = require('util');
const baseModel = require('./base');
const helper = require('./helper');

class PurchaseDocumentsDetail extends baseModel {
	static get tableName() {
		return 'pur_documents_details';
	}

	static get relationMappings() {
		return {
			sale: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/CostCenter.js`,
				join: {
					from: 'pur_documents_details.cost_center_id',
					to: 'com_cost_center.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['purchaseDocumentId', 'quantity', 'price', 'productId'],
			properties: {
				purchaseDocumentId: {
					type: 'integer',
				},
				currency: {
					type: 'string',
				},
				quantity: {
					type: 'number',
				},
				price: {
					type: 'number',
				},
				productId: {
					type: 'integer',
				},
				closedAt: {
					type: 'timestamp',
				},
				discountAmount: {
					type: 'number',
				},
				discountPercentage: {
					type: 'number',
				},
				stockQuantity: {
					type: 'number',
				},
				tax: {
					type: 'number',
				},
				taxAmount: {
					type: 'number',
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
				flagUse: {
					type: ['integer', 'null'],
				},
				flagDispatch: {
					type: ['integer', 'null'],
				},
				documentsNumber: {
					type: ['string', 'null'],
				},
				purDocumentsId: {
					type: ['integer', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				unitId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
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
				commentary: {
					type: ['string', 'null'],
				},
				costCenterId: {
					type: ['integer', 'null'],
				},
				costCenterCode: {
					type: ['string', 'null'],
				},
				unitConversion: {
					type: ['number', 'null'],
				},
				unitCode: {
					type: ['string', 'null'],
				},
				productCode: {
					type: ['string', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				subtotalWithoutTax: {
					type: ['number', 'null'],
				},
				alternateCode: {
					type: ['array', 'null'],
					default: [],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'purchase_document_id',
			'currency',
			'quantity',
			'price',
			'product_id',
			'discount_amount',
			'discount_percentage',
			'stock_quantity',
			'tax',
			'tax_amount',
			'brand_id',
			'brand_name',
			'war_warehouses_id',
			'flag_use',
			'flag_dispatch',
			'documents_number',
			'pur_documents_id',
			'description',
			'unit_id',
			'additional_information',
			'unit_name',
			'unit_quantity',
			'category_name',
			'commentary',
			'cost_center_id',
			'cost_center_code',
			'created_at',
			'closed_at',
			'product_code',
			'unit_conversion',
			'unit_code',
			'subtotal_without_tax',
			'code_taxes',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByDocument(companyId, purchaseId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('purchase_document_id', purchaseId);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static removeByDocument(purchaseId) {
		return this.query()
			.softDelete()
			.where('purchase_document_id', purchaseId);
	}

	static updateReference(ids, { flagUse, purDocumentsId, documentsNumber }, companyId) {
		return this.query()
			.patch({ flagUse, purDocumentsId, documentsNumber })
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getByIdsConvert(ids) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.whereRaw('flag_use IS NULL');
	}

	static exportExcel({
		companyId,
		paymentMethodId,
		paymentStateIds,
		supplierId,
		stateIds,
		typeDocumentIds,
		warehouses,
		subsidiaries,
		startDate,
		endDate,
	}) {
		const supplierTable = 'pur_suppliers';
		const typeDocumentTable = 'com_ms_type_documents';
		const purchaseTable = 'pur_documents';
		const purchaseColumns = ['document_number'].map(c => `${purchaseTable}.${c}`);
		const purchaseDetailsColumns = ['price', 'quantity', 'category_name', 'unit_name'].map(c => `${PurchaseDocumentsDetail.tableName}.${c}`);
		const purchaseRawColumns = [
			raw(`DATE_FORMAT(DATE(${purchaseTable}.date_document), '%Y-%m-%d') as pur_date`),
			raw(`${PurchaseDocumentsDetail.tableName}.quantity * ${
				PurchaseDocumentsDetail.tableName
			}.price as detail_total`),
			raw(`${this.tableName}.description as productName`),
			raw(`SUBSTRING_INDEX(${this.tableName}.description, '-', 1) as productCode`),
		];
		const supplierColumns = ['document_number as supplier_doc_number', 'name as supplier_name'].map(c => `${supplierTable}.${c}`);
		const typeDocumentColumns = ['name as type_document_name'].map(c => `${typeDocumentTable}.${c}`);
		const columns = [
			...purchaseColumns,
			...supplierColumns,
			...typeDocumentColumns,
			...purchaseDetailsColumns,
			...purchaseRawColumns,
		];

		const query = PurchaseDocumentsDetail.query()
			.select(columns)
			.innerJoin(
				`${purchaseTable}`,
				`${purchaseTable}.id`,
				`${PurchaseDocumentsDetail.tableName}.purchase_document_id`,
			)
			.innerJoin(
				`${typeDocumentTable}`,
				`${typeDocumentTable}.id`,
				`${purchaseTable}.type_document_id`,
			)
			.innerJoin(`${supplierTable}`, `${supplierTable}.id`, `${purchaseTable}.supplier_id`)
			.skipUndefined()
			.where(`${purchaseTable}.supplier_id`, supplierId)
			.skipUndefined()
			.where(`${purchaseTable}.payment_method_id`, paymentMethodId)
			.where(`${purchaseTable}.company_id`, companyId);

		if (paymentStateIds && paymentStateIds.length > 0) {
			query.whereIn(`${purchaseTable}.payment_state_id`, paymentStateIds);
		}

		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${purchaseTable}.type_document_id`, typeDocumentIds);
		}

		if (stateIds && stateIds.length > 0) {
			query.whereIn(`${purchaseTable}.payment_state_id`, stateIds);
		}

		if (subsidiaries && subsidiaries.length > 0) {
			query.whereIn(`${purchaseTable}.subsidiary_id`, subsidiaries);
		}

		if (warehouses && warehouses.length > 0) {
			query.whereIn(`${purchaseTable}.warehouse_id`, warehouses);
		}

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${purchaseTable}.date_document, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${purchaseTable}.date_document, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}
		return query;
	}

	static async getPurchasesPdf(companyId, filter = {}, warehouseIds) {
		const purchasesTable = 'pur_documents';
		const supplierTable = 'pur_suppliers';
		const typeDocumentTable = 'com_ms_type_documents';
		const rawColumns = [
			raw(`SUBSTRING_INDEX(${this.tableName}.description, '-', 1) as codeProduct`),
			raw(`SUBSTRING_INDEX(${this.tableName}.description, '-', -1) as nameProduct`),
			raw('pur_documents_details.quantity * pur_documents_details.price as total'),
			raw('(CASE WHEN pur_documents_details.tax_amount > 0 THEN (pur_documents_details.quantity * pur_documents_details.price) ELSE null END)  as subConIva'),
			raw('(CASE WHEN pur_documents_details.tax_amount = 0 THEN (pur_documents_details.quantity * pur_documents_details.price) ELSE null END)  as subSinIva'),
			raw(`DATE_FORMAT(${this.tableName}.created_at, '%d-%m-%Y') AS date`),
			raw(`CONCAT(SUBSTRING_INDEX(${typeDocumentTable}.code, 1, -2), "-", ${purchasesTable}.number) AS number`),
		];
		const ptColumns = [
			`${this.tableName}.quantity`,
			`${this.tableName}.price`,
			`${this.tableName}.discount_amount`,
			`${supplierTable}.name as supplierName`,
			`${this.tableName}.tax_amount as iva`,
		];
		const columns = ptColumns.concat(rawColumns);
		const query = this.query()
			.select(columns)
			.join(`${purchasesTable}`, `${purchasesTable}.id`, `${this.tableName}.purchase_document_id`)
			.join(`${supplierTable}`, `${supplierTable}.id`, `${purchasesTable}.supplier_id`)
			.join(`${typeDocumentTable}`, `${typeDocumentTable}.id`, `${purchasesTable}.type_document_id`)
			.where(`${purchasesTable}.company_id`, companyId)
			.skipUndefined()
			.where(`${purchasesTable}.subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.whereIn(`${purchasesTable}.terminal_id`, filter.terminalIds);
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

	static async getPurchasesPdfTotal(companyId, filter = {}, warehouseIds) {
		const purchasesTable = 'pur_documents';
		const supplierTable = 'pur_suppliers';
		const rawColumns = [
			raw('sum(pur_documents_details.quantity * pur_documents_details.price) as total'),
			raw('sum(pur_documents_details.tax_amount) as iva'),
			raw('ANY_VALUE(CASE WHEN pur_documents_details.tax_amount = 0 THEN sum(pur_documents_details.quantity * pur_documents_details.price) ELSE null END)  as subSinIva'),
		];
		const query = this.query()
			.select(rawColumns)
			.join(`${purchasesTable}`, `${purchasesTable}.id`, `${this.tableName}.purchase_document_id`)
			.join(`${supplierTable}`, `${supplierTable}.id`, `${purchasesTable}.supplier_id`)
			.where(`${purchasesTable}.company_id`, companyId)
			.skipUndefined()
			.where(`${purchasesTable}.subsidiary_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.whereIn(`${purchasesTable}.terminal_id`, filter.terminalIds);
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

	static getAllParentProducts(filter, companyId) {
		const rawColumns = [
			raw('s.name as name'),
			raw('pur_documents_details.price as price'),
			raw('pur_documents_details.quantity as quantity'),
			raw('pur_documents_details.tax as tax'),
			raw('u.number as number'),
			raw('u.serie as serie'),
			raw('DATE_FORMAT(pur_documents_details.created_at,  "%d-%m-%Y") AS createdAt'),
			raw('DATE_FORMAT(pur_documents_details.created_at,  "%d/%m/%Y %h:%i %p") AS createdAtRecord'),
			raw('pur_documents_details.product_id as productId'),
			raw('pur_documents_details.purchase_document_id as documentId'),
			raw('pur_documents_details.stock_quantity as stock'),
			raw('((pur_documents_details.quantity * pur_documents_details.price) + pur_documents_details.tax_amount) as total'),
			raw('(pur_documents_details.tax_amount / pur_documents_details.quantity) as taxAmount'),
			raw('(pur_documents_details.price + (pur_documents_details.tax_amount / pur_documents_details.quantity)) as unitPrice'),
		];
		const query = this.query()
			.select(rawColumns)
			.join(raw('pur_documents as u on u.id = pur_documents_details.purchase_document_id'))
			.join(raw('pur_suppliers as s on s.id = u.supplier_id'))
			.where(raw('pur_documents_details.deleted_at is null'))
			.where(raw(`u.company_id = ${companyId}`))
			.where(raw('pur_documents_details.price > 0'))
			.where(raw(`pur_documents_details.product_id = ${filter.productId}`))
			.orderByRaw('pur_documents_details.created_at desc')
			.limit(1);
		if (filter.flagRecord) {
			query.where(raw(`pur_documents_details.id
				in (SELECT max(pur_documents_details.id) 
				FROM pur_documents_details as k
				inner join  pur_documents as p on p.id = k.purchase_document_id 
				WHERE p.company_id = ${companyId}
				AND k.product_id = ${filter.productId}
				AND k.price > 0
				AND k.deleted_at IS NULL 
				GROUP BY k.product_id)`));
			query.limit(20);
		} // else {
		// 	query.where(raw(`pur_documents_details.id
		// 	in (SELECT max(pur_documents_details.id)
		// 	FROM pur_documents_details as k
		// 	inner join  pur_documents as p on p.id = k.purchase_document_id
		// 	WHERE p.company_id = ${companyId}
		// 	AND k.product_id = ${filter.productId}
		// 	AND k.price > 0
		// 	AND k.deleted_at IS NULL
		// 	order by pur_documents_details.created_at desc)
		// 	group by pur_documents_details.product_id`));
		// }
		return query;
	}

	static async exportExcelPurchasesExpirateDate({
		companyId,
		paymentMethodId,
		paymentStateIds,
		supplierId,
		stateIds,
		typeDocumentIds,
		warehouses,
		subsidiaries,
		startDate,
		endDate,
	}) {
		const supplierTable = 'pur_suppliers';
		const purchaseTable = 'pur_documents';
		const purchaseColumns = ['document_number'].map(c => `${purchaseTable}.${c}`);
		const purchaseDetailsColumns = [
			'description',
			'price',
			'quantity',
			raw('JSON_EXTRACT(pur_documents_details.additional_information, "$.expirationDate") as expirationDate'),
		];
		const supplierColumns = ['document_number as supplier_doc_number', 'name as supplier_name'].map(c => `${supplierTable}.${c}`);
		let columns = [...purchaseColumns, ...supplierColumns];
		columns = columns.concat(purchaseDetailsColumns);
		const query = PurchaseDocumentsDetail.query()
			.select(columns)
			.innerJoin(
				`${purchaseTable}`,
				`${purchaseTable}.id`,
				`${PurchaseDocumentsDetail.tableName}.purchase_document_id`,
			)
			.innerJoin(`${supplierTable}`, `${supplierTable}.id`, `${purchaseTable}.supplier_id`)
			.skipUndefined()
			.where(`${purchaseTable}.supplier_id`, supplierId)
			.skipUndefined()
			.where(`${purchaseTable}.payment_method_id`, paymentMethodId)
			.where(`${purchaseTable}.company_id`, companyId)
			.orderBy(raw('(JSON_EXTRACT(pur_documents_details.additional_information, "$.expirationDate"))'));

		if (paymentStateIds && paymentStateIds.length > 0) {
			query.whereIn(`${purchaseTable}.payment_state_id`, paymentStateIds);
		}

		if (typeDocumentIds && typeDocumentIds.length > 0) {
			query.whereIn(`${purchaseTable}.type_document_id`, typeDocumentIds);
		}

		if (stateIds && stateIds.length > 0) {
			query.whereIn(`${purchaseTable}.payment_state_id`, stateIds);
		}

		if (subsidiaries && subsidiaries.length > 0) {
			query.whereIn(`${purchaseTable}.subsidiary_id`, subsidiaries);
		}

		if (warehouses && warehouses.length > 0) {
			query.whereIn(`${purchaseTable}.warehouse_id`, warehouses);
		}

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${purchaseTable}.date_document, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${purchaseTable}.date_document, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}
		const data = await query;
		const newData = data.reduce((acc, item) => {
			const newItem = item;
			newItem.expirationDateTwo = JSON.parse(newItem.expirationDate);
			delete newItem.expirationDate;
			if (!isNullOrUndefined(newItem.expirationDateTwo)) {
				acc.push(newItem);
			}
			return acc;
		}, []);

		return newData;
	}
}

module.exports = PurchaseDocumentsDetail;
