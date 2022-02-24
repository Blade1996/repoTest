'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const ModuleCode = require('./ModuleCode');
const { raw } = require('objection');

class TypePayment extends baseModel {
	static get tableName() {
		return 'sal_type_payments';
	}

	static get relationMappings() {
		const relation = {
			paymentType: {
				relation: baseModel.BelongsToOneRelation,
				modelClass: `${__dirname}/MsTypePayment.js`,
				join: {
					from: 'sal_type_payments.com_type_payment_id',
					to: 'com_ms_type_payments.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comTypePaymentId', 'comCompanyId'],
			properties: {
				comTypePaymentId: {
					type: 'integer',
				},
				aditionalInformation: {
					type: ['object', 'null'],
				},
				comCompanyId: {
					type: 'integer',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = ['id', 'com_type_payment_id', 'com_company_id', 'aditional_information'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static getAll(filter = {}, companyId, flagType) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[paymentType(selectColumns)]')
			.where('com_company_id', companyId)
			.innerJoin(
				'com_ms_type_payments',
				`${this.tableName}.com_type_payment_id`,
				'com_ms_type_payments.id',
			)
			.skipUndefined()
			.where('com_ms_type_payments.flag_type', flagType)
			.skipUndefined()
			.where('com_ms_type_payments.country_id', filter.countryId)
			.skipUndefined()
			.where('com_ms_type_payments.currency', filter.currency)
			.skipUndefined()
			.where('com_ms_type_payments.flag_type_transaction', filter.flagTypeTransaction);
		if (filter.typePaymentIds && filter.typePaymentIds.length > 0) {
			query.whereIn(`${this.tableName}.com_type_payment_id`, filter.typePaymentIds);
		}
		if (filter.flagForms && filter.flagForms.length > 0) {
			query.whereIn('com_ms_type_payments.flag_form', filter.flagForms);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getPaymentByCompanyId(companyId, paymentTypeId) {
		return this.query()
			.eager('[paymentType(selectColumns)]')
			.select(this.defaultColumns())
			.where('com_company_id', companyId)
			.skipUndefined()
			.where('com_type_payment_id', paymentTypeId)
			.first();
	}

	static getTypePaymentByCode(code, flagType = ModuleCode.sales, countryId, companyId) {
		return this.query()
			.select(raw('com_ms_type_payments.*'))
			.innerJoin(
				'com_ms_type_payments',
				`${this.tableName}.com_type_payment_id`,
				'com_ms_type_payments.id',
			)
			.where('com_ms_type_payments.flag_type', flagType)
			.where('com_ms_type_payments.code', code)
			.skipUndefined()
			.where('com_ms_type_payments.country_id', countryId)
			.where(`${this.tableName}.com_company_id`, companyId)
			.first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static editMultiple(ids, data, companyId) {
		return this.query()
			.patch(data)
			.withArchived(true)
			.where('com_company_id', companyId)
			.whereIn('id', ids);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static removeIds(ids, companyId) {
		return this.query()
			.softDelete()
			.whereNotIn('com_type_payment_id', ids)
			.where('com_company_id', companyId);
	}

	static removePhysical(companyId) {
		return this.query()
			.delete()
			.where(`${this.tableName}.com_company_id`, companyId);
	}

	static getPaymentId(companyId, paymentTypeId) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_company_id', companyId)
			.skipUndefined()
			.whereIn('com_type_payment_id', paymentTypeId);
	}
}

module.exports = TypePayment;
