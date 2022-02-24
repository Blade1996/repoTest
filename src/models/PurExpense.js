'use strict';

const { Model, raw } = require('objection');
const endOfDay = require('date-fns/end_of_day');
const startOfDay = require('date-fns/start_of_day');
const baseModel = require('./base');
const helper = require('./helper');

class PurExpense extends baseModel {
	static get tableName() {
		return 'pur_expenses';
	}

	static get relationMappings() {
		return {
			typeExpense: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/PurTypeExpense.js`,
				join: {
					from: 'pur_expenses.pur_type_expense_id',
					to: 'pur_type_expenses.id',
				},
			},
		};
	}
	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['purTypeExpenseId', 'amount', 'comEmployeesId', 'expenseDate'],
			properties: {
				purTypeExpenseId: {
					type: 'integer',
				},
				salCashDeskClosingId: {
					type: ['integer', 'null'],
				},
				purDocumentId: {
					type: ['integer', 'null'],
				},
				comEmployeesId: {
					type: 'integer',
				},
				name: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				expenseDate: {
					type: 'dateTime',
				},
				amount: {
					type: 'decimal',
				},
				urlImage: {
					type: ['string', 'null'],
				},
				flagEnum: {
					type: ['boolean', 'integer'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'pur_type_expense_id',
			'sal_cash_desk_closing_id',
			'pur_document_id',
			'com_employees_id',
			'name',
			'description',
			'expense_date',
			'amount',
			'url_image',
			'flag_enum',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static getAll(filter, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('typeExpense(selectColumns)')
			.where('company_id', companyId)
			.skipUndefined()
			.where('pur_type_expense_id', filter.type);

		if (filter.startDate && filter.endDate) {
			const start = startOfDay(filter.startDate);
			const end = endOfDay(filter.endDate);
			query.whereBetween('created_at', [start, end]);
		}
		query = this.includePaginationAndSort(query, filter);

		return query;
	}

	static getAllProject(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('typeExpense(selectColumns)')
			.skipUndefined()
			.where('pur_type_expense_id', filter.type)
			.skipUndefined()
			.where('project_id', filter.projectId)
			.where(raw('project_id IS NOT NULL'))
			.where('company_id', companyId);

		query = this.includePaginationAndSort(query, filter);

		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getAllType(filter, companyId) {
		const query = this.query()
			.select(raw('pur_type_expenses.code, sum(pur_expenses.amount) as total, count(pur_expenses.id) as quantity'))
			.innerJoin('pur_type_expenses', 'pur_expenses.pur_type_expense_id', 'pur_type_expenses.id')
			.skipUndefined()
			.where('pur_expenses.com_employees_id', filter.comEmployeeId)
			.where('pur_expenses.company_id', companyId)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			)
			.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			)
			.groupBy('pur_expenses.pur_type_expense_id');
		return query;
	}

	static getAllCashClosing(companyId, employeeId, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('com_employees_id', employeeId)
			.where('sal_cash_desk_closing_id', null);

		if (filter.startDate && filter.endDate) {
			query.whereBetween('expense_date', [filter.startDate, filter.endDate]);
		}

		return query;
	}

	static updateCashDeskClosing(data, ids) {
		const query = this.query()
			.patch(data)
			.whereIn('id', ids);
		return query;
	}

	static getAmountEmployee(ids, companyId, filter) {
		return this.query()
			.select(raw('com_employees_id, sum(amount) as amount'))
			.whereIn('com_employees_id', ids)
			.where('company_id', companyId)
			.where('sal_cash_desk_closing_id', null)
			.whereBetween('expense_date', [filter.startDate, filter.endDate])
			.groupBy('com_employees_id');
	}

	static closeCashOffline(cashClosingId, { hashOffline, companyId }, trx) {
		const query = this.query(trx)
			.patch({ salCashDeskClosingId: cashClosingId })
			.where(`${this.tableName}.hash_offline`, hashOffline)
			.where(`${this.tableName}.company_id`, companyId);
		return query;
	}
}

module.exports = PurExpense;
