'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const TypeGeneral = require('./TypeGeneral');

class PayrollConcepts extends baseModel {
	static get tableName() {
		return 'com_payroll_concepts';
	}

	static get relationMappings() {
		return {
			conceptType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeConcepts },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_concepts.type_item',
				},
			},
			formulaType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeFormula },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_concepts.type_formula',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name'],
			properties: {
				code: {
					type: ['string'],
				},
				name: {
					type: ['string'],
				},
				description: {
					type: ['string', 'null'],
				},
				observation: {
					type: ['string', 'null'],
				},
				order: {
					type: ['number', 'null'],
					default: 0,
				},
				formula: {
					type: ['string', 'null'],
				},
				typeItem: {
					type: ['integer'],
				},
				typeFormula: {
					type: ['integer'],
				},
				value: {
					type: ['number', 'null'],
					default: 0.0,
				},
				flagProvision: {
					type: ['boolean'],
				},
				flagTaxable: {
					type: ['boolean'],
				},
				flagShow: {
					type: ['boolean'],
				},
				accountingExt: {
					type: ['string', 'null'],
				},
				methodCodeId: {
					type: ['string', 'null'],
				},
				methodOtherId: {
					type: ['string', 'null'],
				},
				methodCode: {
					type: ['object', 'null'],
				},
				methodOther: {
					type: ['object', 'null'],
				},
				comEmployeeId: {
					type: ['integer'],
				},
				flagActive: {
					type: ['boolean'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'name',
			'description',
			'observation',
			'order',
			'formula',
			'value',
			'flag_provision',
			'flag_taxable',
			'flag_show',
			'accounting_ext',
			'method_code',
			'method_other',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static validateCode({ code, id }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static findById(id, companyId) {
		return this.query()
			.eager('[conceptType(selectColumns), formulaType(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', companyId)
			.findById(id);
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[conceptType(selectColumns), formulaType(selectColumns)]')
			.where('company_id', companyId)
			.skipUndefined()
			.where('type_item', filter.conceptTypeId)
			.skipUndefined()
			.where('flag_provision', filter.flagProvision)
			.skipUndefined()
			.where('flag_taxable', filter.flagTaxable)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('flag_show', filter.flagShow);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}
}

module.exports = PayrollConcepts;
