'use strict';

const baseModel = require('./base');
const { Model, raw } = require('objection');
const helper = require('./helper');
const Employee = require('./ComEmployee');

class SubsidiaryCustomer extends baseModel {
	static get tableName() {
		return 'com_subsidiary_customers';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_subsidiary_customers.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			subsidiaryOneRelation: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_subsidiary_customers.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
		};
	}

	static defaultColumns() {
		return [
			'id',
			'subsidiary_id',
			'customer_id',
			'total_sales',
			'total_debts',
			'flag_active',
			'created_at',
			'updated_at',
		];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['subsidiaryId', 'customerId', 'companyId'],
			properties: {
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				customerId: {
					type: ['integer', 'null'],
				},
				totalSales: {
					type: ['object', 'null'],
					default: {},
				},
				totalDebts: {
					type: ['object', 'null'],
					default: {},
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
	}

	static async createByCustomer({
		employeeId, customerId, commerceSubsidiaryId, trx,
	}, companyId) {
		try {
			const employee = await Employee.getById(employeeId, trx);
			const data = {
				companyId,
				subsidiaryId: employee ? employee.comSubsidiariesId : commerceSubsidiaryId,
				customerId,
			};
			if (data.subsidiaryId && customerId) {
				const newRecord = await SubsidiaryCustomer.create(data, trx);
				return Promise.resolve(newRecord);
			}
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async createOrUpdate(
		{
			customerId, saleAmount, debtsSales, currency,
		},
		subsidiaryId,
		companyId,
		trx,
	) {
		const subsidiaryCustomer = await this.query(trx)
			.select(this.defaultColumns())
			.where('customer_id', customerId)
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
				customerId,
			};
			await this.query(trx).insert(record);
		} else {
			await this.query(trx)
				.patch({
					totalSales: raw(`if(JSON_EXTRACT(total_sales, "$.${currency}") > 0, JSON_SET(total_sales, "$.${currency}", JSON_EXTRACT(total_sales, "$.${currency}")+${saleAmount}), JSON_SET(total_sales, "$.${currency}", ${saleAmount}))`),
					totalDebts: raw(`if(JSON_EXTRACT(total_debts, "$.${currency}") > 0, JSON_SET(total_debts, "$.${currency}", JSON_EXTRACT(total_debts, "$.${currency}")+${debtsSales}), JSON_SET(total_debts, "$.${currency}", ${debtsSales}))`),
				})
				.where('id', subsidiaryCustomer.id)
				.where('company_id', companyId);
		}
		return record;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
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

	static getByCustomerIdAndSubsidiaryId(companyId, customerId, subsidiaryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('customer_id', customerId)
			.where('subsidiary_id', subsidiaryId)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = SubsidiaryCustomer;
