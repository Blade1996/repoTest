'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model, transaction, raw } = require('objection');
const General = require('./General');
const ComPerson = require('./ComPerson');
const TypeEntity = require('./TypeEntity');
const Currency = require('./Currency');

class Supplier extends baseModel {
	static get tableName() {
		return 'pur_suppliers';
	}

	static get relationMappings() {
		return {
			group: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.group_id',
					to: 'com_general.id',
				},
			},
			paymentMethods: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PaymentMethod.js`,
				join: {
					from: 'pur_suppliers.payment_method',
					to: 'sal_method_payments.id',
				},
			},
			typeExpense: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PurTypeExpense.js`,
				join: {
					from: 'pur_suppliers.type_expense_id',
					to: 'pur_type_expenses.id',
				},
			},
			person: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Person.js`,
				join: {
					from: 'pur_suppliers.person_id',
					to: 'ms_person.id',
				},
			},
			supplierType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.supplier_type_id',
					to: 'com_general.id',
				},
			},
			msTypePerson: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypePerson.js`,
				join: {
					from: 'pur_suppliers.flag_type_person',
					to: 'ms_type_person.id',
				},
			},
			zone: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.zone_id',
					to: 'com_general.id',
				},
			},
			province: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.province_id',
					to: 'com_general.id',
				},
			},
			city: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.city_id',
					to: 'com_general.id',
				},
			},
			parish: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'pur_suppliers.parish_id',
					to: 'com_general.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'documentNumber', 'flagTypePerson'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: ['string', 'null'],
				},
				contactName: {
					type: ['string', 'null'],
				},
				phone: {
					type: 'array',
					default: [],
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
				flagTypePerson: {
					type: 'integer',
				},
				personId: {
					type: ['integer', 'null'],
				},
				documentNumber: {
					type: 'string',
				},
				commercialName: {
					type: ['string', 'null'],
				},
				accountingCode: {
					type: ['string', 'null'],
				},
				address: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				groupId: {
					type: ['integer', 'null'],
				},
				typeExpenseId: {
					type: ['integer', 'null'],
				},
				zoneId: {
					type: ['integer', 'null'],
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
				postalCode: {
					type: ['string', 'null'],
				},
				observation: {
					type: ['string', 'null'],
				},
				paymentMethod: {
					type: ['integer', 'null'],
				},
				creditDays: {
					type: ['integer', 'null'],
				},
				creditLimitation: {
					type: ['number', 'null'],
				},
				creditLimitationBalance: {
					type: ['number', 'null'],
					default: 0,
				},
				bankId: {
					type: ['integer', 'null'],
				},
				accountingTypeId: {
					type: ['integer', 'null'],
				},
				accountingBank: {
					type: ['string', 'null'],
				},
				supplierTypeId: {
					type: ['integer', 'null'],
				},
				currencyAmount: {
					type: 'object',
					default: {},
				},
				purchasesQuantity: {
					type: ['integer', 'null'],
					default: 0,
				},
				additionalInformation: {
					type: 'object',
					default: {},
				},
				websiteAddress: {
					type: ['string', 'null'],
				},
				nationality: {
					type: ['string', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				dateBirth: {
					type: ['timestamp', 'null'],
				},
				autoCode: {
					type: ['integer', 'null'],
				},
				flagAccounting: {
					type: ['integer', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				percentageTaxes: {
					type: ['number', 'null'],
				},
				codeTaxesGoods: {
					type: ['string', 'null'],
				},
				geoPosition: {
					type: ['string', 'null'],
				},
				urlFiles: {
					type: ['array', 'null'],
					default: [],
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['autocomplete', 'totalAmounts'];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let colums = [
			'id',
			'name',
			'code',
			'contact_name',
			'phone',
			'location',
			'flag_active',
			'flag_type_person',
			'person_id',
			'document_number',
			'commercial_name',
			'accounting_code',
			'address',
			'email',
			'group_id',
			'type_expense_id',
			'latitude',
			'longitude',
			'zone_id',
			'province_id',
			'city_id',
			'parish_id',
			'postal_code',
			'observation',
			'payment_method',
			'credit_days',
			'credit_limitation',
			'bank_id',
			'accounting_type_id',
			'accounting_bank',
			'currency_amount',
			'purchases_quantity',
			'supplier_type_id',
			'additional_information',
			'website_address',
			'nationality',
			'url_image',
			'date_birth',
			'auto_code',
			'flag_accounting',
			'code_taxes',
			'percentage_taxes',
			'code_taxes_goods',
			'geo_position',
			'url_files',
			'credit_limitation_balance',
			'accounting_account',
		].map(c => `${this.tableName}.${c}`);
		colums = colums.concat(otherColumns);
		return colums;
	}

	static match(query, search, likeSearch) {
		if (!likeSearch) {
			query.whereRaw(
				'MATCH(name, contact_name, document_number, email, code, commercial_name) AGAINST(?)',
				[search],
			);
		} else {
			const fields = [
				'name',
				'contact_name',
				'document_number',
				'email',
				'code',
				'commercial_name',
			];
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(field, 'like', `%${search}%`);
				});
			});
		}
		return query;
	}

	static getAll(companyId, filter = {}, currency) {
		const { search, sortField, sortDirection } = filter;
		const eagers =
			'[group(selectColumns), paymentMethods(selectColumns), typeExpense(selectColumns), supplierType(selectColumns), person(selectColumns), msTypePerson(selectColumns), zone(selectColumns), province(selectColumns), city(selectColumns), parish(selectColumns)]';
		let query = this.query()
			.eager(eagers)
			.select(this.defaultColumns())
			.skipUndefined()
			.where('group_id', filter.groupId)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.where('company_id', companyId);

		if (search) {
			query = this.match(query, search, true);
		}

		if (sortField === 'currency_amount' && sortDirection && currency) {
			query = query.orderByRaw(`CAST(JSON_EXTRACT(currency_amount, '$.${currency}.amount') AS UNSIGNED) ${sortDirection}`);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data, autoCodeId) {
		const newData = data;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		delete newData.latitude;
		delete newData.longitude;
		const knex = Supplier.knex();
		return transaction(knex, () =>
			General.autoCode(autoCodeId, newData.companyId).then((newAutoCode) => {
				newData.autoCode = newAutoCode.number;
				return this.query().insert(data);
			}));
	}

	static getById(id, companyId) {
		const eagers =
			'[group(selectColumns), paymentMethods(selectColumns), typeExpense(selectColumns), supplierType(selectColumns), person(selectColumns), msTypePerson(selectColumns), zone(selectColumns), province(selectColumns), city(selectColumns), parish(selectColumns)]';
		return this.query()
			.eager(eagers)
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static edit(id, data, companyId, tx) {
		const newData = data;
		if (newData.latitude && newData.longitude) {
			const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
			newData.location = this.raw(`GeomFromText(${point})`);
		}
		delete newData.latitude;
		delete newData.longitude;
		return this.query(tx)
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

	static createMultipleSupplier(data, companyId) {
		const newData = data.map((item) => {
			const obj = {};
			obj.companyId = companyId;
			obj.documentNumber = `${item.numeroDocumento}`;
			const isNaturalPerson = item.tipoPersona !== 2 && item.tipoPersona !== 7;
			if (isNaturalPerson) {
				obj.name = `${item.nombre} ${item.apellido}`;
			} else {
				obj.name = item.razonSocial;
			}
			obj.address = item.direccion;
			obj.email = item.email;
			obj.flagTypePerson = item.tipoPersona;
			obj.phoneNumbers = [item.telefono];
			if (item.latitude && item.longitude) {
				const point = `"POINT(${item.latitude} ${item.longitude})"`;
				obj.location = this.raw(`GeomFromText(${point})`);
			}
			return obj;
		});

		const knex = Supplier.knex();
		return transaction(knex, async () => {
			await this.query().insertGraph(newData);
		});
	}

	get autocomplete() {
		const name = this.name ? this.name : '';
		const commercialName = this.commercialName ? this.commercialName : '';
		const documentNumber = this.documentNumber ? this.documentNumber : '';
		const code = this.code ? this.code : '';
		const contactName = this.contactName ? this.contactName : '';
		const email = this.email ? this.email : '';

		const autocomplete = `${name} ${commercialName} ${documentNumber} ${code} ${contactName} ${email}`;
		return autocomplete;
	}

	static isIn(id, companyId) {
		return this.query()
			.select('id', 'company_id')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static documentNumberExists(id, documentNumber, flagTypePerson, companyId) {
		return this.query()
			.select('id', 'document_number', 'company_id', 'flag_type_person')
			.skipUndefined()
			.where('id', '!=', id)
			.where('document_number', documentNumber)
			.where('flag_type_person', flagTypePerson)
			.where('company_id', companyId)
			.first();
	}

	async $afterInsert(queryContext) {
		try {
			const person = await ComPerson.createPerson(
				queryContext.transaction,
				Supplier,
				this.documentNumber,
				TypeEntity.supplier,
				{
					id: this.id,
					code: null,
					email: this.email,
					fullname: this.name,
					flagTypePerson: this.flagTypePerson,
				},
				this.companyId,
			);
			return person;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async updateCurrencyAmount(id, currency, debtAmount, amount) {
		const data = await this.query()
			.select('currency_amount')
			.where('id', id)
			.first();

		const currencyData = await Currency.getByCode(currency);

		let currencySymbol = '';
		let totalDebt = debtAmount;
		let totalAmount = amount;
		if (currencyData) {
			currencySymbol = currencyData.symbol;
		}

		if (data.currencyAmount && data.currencyAmount[currency]) {
			const amountBody = data.currencyAmount[currency];
			if (amountBody.debt) {
				totalDebt += Number(amountBody.debt);
			}
			if (amountBody.amount) {
				totalAmount += Number(amountBody.amount);
			}
		}

		const knex = Supplier.knex();
		return knex.schema.raw(
			`UPDATE pur_suppliers SET currency_amount = JSON_SET(currency_amount, "$.${currency}", JSON_OBJECT('amount', '?', 'debt', '?', 'symbol', ?)) WHERE id = ?`,
			[totalAmount, totalDebt, currencySymbol, id],
		);
	}

	static getPurchasesQuantityById(id, companyId) {
		return this.query()
			.select('company_id', 'purchases_quantity')
			.where('company_id', companyId)
			.findById(id);
	}

	static async updatePurchaseQuantity(id, companyId) {
		const supplier = await this.getPurchasesQuantityById(id, companyId);
		const lastPurchasesQuantity = supplier.purchasesQuantity ? supplier.purchasesQuantity : 0;
		await Supplier.edit(id, { purchases_quantity: lastPurchasesQuantity + 1 }, companyId);
	}

	static getSuppliersRepeated(companyId, documentNumber) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('document_number', documentNumber);
	}

	static getSupplierReportPdf(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw('sum(pur.total_without_withholding) as totals'),
				raw('sum(pur.taxes) as ivaFacs'),
				raw('sum(pur.taxes) as ivaPags'),
				raw('sum(pur.discount_amount) as discounts'),
				raw('sum(pur.sub_total) as netTotals'),
				raw('ANY_VALUE(pur_suppliers.document_number) as supplierDocumentNumber'),
				raw('ANY_VALUE(pur_suppliers.name) as supplierName'),
			])
			.join('pur_documents as pur', 'pur.supplier_id', `${this.tableName}.id`)
			.where('pur.subsidiary_id', filter.comSubsidiaryId)
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy(`${this.tableName}.id`);
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('pur.warehouse_id', warehouseIds);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(pur.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(pur.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		return query;
	}

	static getSupplierReportPdfTotals(companyId, filter = {}, warehouseIds) {
		const query = this.query()
			.select([
				raw('sum(pur.total_without_withholding) as totals'),
				raw('sum(pur.taxes) as ivaFacs'),
				raw('sum(pur.taxes) as ivaPags'),
				raw('sum(pur.discount_amount) as discounts'),
				raw('sum(pur.sub_total) as netTotals'),
			])
			.join('pur_documents as pur', 'pur.supplier_id', `${this.tableName}.id`)
			.where('pur.subsidiary_id', filter.comSubsidiaryId)
			.where(`${this.tableName}.company_id`, companyId);
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('pur.warehouse_id', warehouseIds);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(pur.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(pur.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		return query;
	}
}

module.exports = Supplier;
