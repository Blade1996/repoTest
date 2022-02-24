'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const ModuleCode = require('./ModuleCode');
const { Model, raw } = require('objection');

class TypePayment extends baseModel {
	static get tableName() {
		return 'com_ms_type_payments';
	}

	static get relationMappings() {
		return {
			typeTransactionBank: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/TypeTransactionBank.js`,
				join: {
					from: 'com_ms_type_payments.type_transaction_bank_id',
					to: 'ms_type_transaction_bank.id',
				},
			},
			currencyData: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Currency.js`,
				join: {
					from: 'com_ms_type_payments.currency',
					to: 'ms_currency.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'currency'],
			properties: {
				description: {
					type: 'string',
				},
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				typeTransactionBankId: {
					type: ['integer', 'null'],
				},
				currency: {
					type: 'string',
				},
				flagTypeTransaction: {
					type: ['integer', 'null'],
				},
				flagForm: {
					type: ['integer', 'null'],
				},
				flagType: {
					type: ['integer', 'null'],
				},
				summaryCode: {
					type: ['string', 'null'],
				},
				typePaymentId: {
					type: ['integer', 'null'],
				},
				countryId: {
					type: ['integer', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'name',
			'description',
			'code',
			'currency',
			'flag_type_transaction',
			'flag_form',
			'type_transaction_bank_id',
			'flag_type',
			'summary_code',
			'type_payment_id',
			'country_id',
			'code_taxes',
		];
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static notMoveBalance(code) {
		return ['cntc'].indexOf(code) > -1;
	}

	static getAll(filter = {}, flagType) {
		let query = this.query()
			.eager('[currencyData(selectColumns), typeTransactionBank(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('flag_type', flagType)
			.skipUndefined()
			.where('type_transaction_bank_id', filter.typeTransactionBankId)
			.skipUndefined()
			.where('currency', filter.currency)
			.skipUndefined()
			.where('flag_type_transaction', filter.flagTypeTransaction)
			.skipUndefined()
			.where('country_id', filter.countryId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, countryId) {
		return this.query()
			.eager('currencyData(selectColumns)')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('country_id', countryId)
			.findById(id);
	}

	static getByIds(ids) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids);
	}

	static getByCode(code, flagType = ModuleCode.sales, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_type', flagType)
			.where('code', code)
			.skipUndefined()
			.where('country_id', countryId)
			.whereNull('deleted_at')
			.first();
	}

	static getByFlagForm(forms, countryId, flagType = ModuleCode.sales) {
		const flagForm = Array.isArray(forms) ? forms : [forms];
		return this.query()
			.select(this.defaultColumns())
			.where('flag_type', flagType)
			.whereIn('flag_form', flagForm)
			.where('country_id', countryId);
	}

	static getByFlagFormByGroup(
		forms,
		countryId,
		flagType = [ModuleCode.sales, ModuleCode.purchases],
	) {
		const flagForm = Array.isArray(forms) ? forms : [forms];
		const newData = this.query()
			.select(this.defaultColumns())
			.whereIn('flag_type', flagType)
			.whereIn('flag_form', flagForm)
			.where('country_id', countryId);
		return newData;
	}

	static create(data) {
		return this.query().insert(data);
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

	static getAmountByTypePayment(cashIds, filter = {}, companyId) {
		let queryRaw = `sal_transactions on sal_transactions.type_payment_id = ${
			this.tableName
		}.id and sal_transactions.cash_id in ? and sal_transactions.company_id = ? and sal_transactions.sal_cash_desk_closing_id is null and sal_transactions.currency = ? and sal_transactions.state_id = ?`;
		const paramsRaw = [cashIds, companyId, filter.currency, filter.stateId];
		if (filter.warehouseId) {
			queryRaw = queryRaw.concat(' and sal_transactions.war_warehouses_id = ?');
			paramsRaw.push(filter.warehouseId);
		}
		const query = this.query()
			.select(raw(`${this.tableName}.id, ${this.tableName}.name, ${
				this.tableName
			}.type_payment_id, sum(sal_transactions.amount) as amount`))
			.leftJoin(raw(queryRaw, paramsRaw))
			.groupBy(`${this.tableName}.id`);
		return query;
	}

	static getAmountByTypePaymentZ(cashId, filter = {}, companyId) {
		const query = this.query()
			.select(raw(`${this.tableName}.id, ${this.tableName}.name, ${
				this.tableName
			}.type_payment_id, sum(sal_transactions.amount) as amount`))
			.leftJoin(raw(
				`sal_transactions on sal_transactions.type_payment_id = ${
					this.tableName
				}.id and sal_transactions.cash_id = ? and sal_transactions.company_id = ? and sal_transactions.currency = ? and sal_transactions.state_id = ? and sal_transactions.module_origin_id = ? and payment_date BETWEEN ? and ?`,
				[
					cashId,
					companyId,
					filter.currency,
					filter.stateId,
					filter.moduleId,
					filter.startDate,
					filter.endDate,
				],
			))
			.groupBy(`${this.tableName}.id`);
		return query;
	}
}

module.exports = TypePayment;
