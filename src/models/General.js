'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model, raw } = require('objection');
const TypeGeneral = require('./TypeGeneral');
const { isNullOrUndefined } = require('../shared/helper');

class General extends baseModel {
	static get tableName() {
		return 'com_general';
	}

	static get relationMappings() {
		return {
			typeEntity: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeEntity.js`,
				join: {
					from: 'com_general.type_entity_id',
					to: 'ms_type_entity.id',
				},
			},
			typeGeneral: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeGeneral.js`,
				join: {
					from: 'com_general.type_general_id',
					to: 'ms_type_general.id',
				},
			},
			areasCompany: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.areasCompany },
				join: {
					from: 'com_general.general_id',
					to: 'com_general.id',
				},
			},
			financialEntity: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeFinancialEntity },
				join: {
					from: 'com_general.number',
					to: 'com_general.id',
				},
			},
			iesValid: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeIesValid },
				join: {
					from: 'com_general.general_id',
					to: 'com_general.id',
				},
			},
			typeIes: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeIes },
				join: {
					from: 'com_general.reference_id',
					to: 'com_general.id',
				},
			},
			typeFormat: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeFormat },
				join: {
					from: 'com_general.number',
					to: 'com_general.id',
				},
			},
			employeeFilds: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/GeneralEmployee.js`,
				filter: { 'com_general_employee.type_general_id': TypeGeneral.additionalFields },
				join: {
					from: 'com_general_employee.number',
					to: 'com_general.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name', 'typeGeneralId'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				observation: {
					type: ['string', 'null'],
				},
				amount: {
					type: ['number', 'null'],
					default: 0.0,
				},
				value: {
					type: ['string', 'null'],
				},
				flagDiscount: {
					type: ['boolean', 'null'],
				},
				typeEntityId: {
					type: ['integer', 'null'],
				},
				typeGeneralId: {
					type: 'integer',
				},
				number: {
					type: ['integer', 'null'],
				},
				generalId: {
					type: ['integer', 'null'],
				},
				referenceId: {
					type: ['integer', 'null'],
				},
				flagSecap: {
					type: ['boolean', 'null'],
				},
				flagIece: {
					type: ['boolean', 'null'],
				},
				flagEmpty: {
					type: ['boolean', 'null'],
				},
				flagRole: {
					type: ['boolean', 'null'],
				},
				aditionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'name',
			'code',
			'description',
			'observation',
			'type_entity_id',
			'type_general_id',
			'number',
			'value',
			'flag_discount',
			'amount',
			'general_id',
			'reference_id',
			'flag_secap',
			'flag_iece',
			'flag_empty',
			'flag_role',
			'flag_active',
			'aditional_information',
			'date',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select('id', 'name', 'code', 'description', 'number'),
		};
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getAll(companyId, typeGeneralId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('number', filter.number)
			.skipUndefined()
			.where('company_id', companyId)
			.where('type_general_id', typeGeneralId)
			.skipUndefined()
			.where('type_entity_id', filter.typeEntityId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId, typeEntityId) {
		return this.query()
			.eager('[typeEntity(selectColumns), typeGeneral(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('type_entity_id', typeEntityId)
			.findById(id);
	}

	static getByIdAndTypeGeneral(id, typeGeneral, companyId, typeEntityId, number) {
		return this.query()
			.eager('[typeEntity(selectColumns), typeGeneral(selectColumns), typeIes(selectColumns), iesValid(selectColumns), financialEntity(selectColumns), typeFormat(selectColumns)]')
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('type_entity_id', typeEntityId)
			.skipUndefined()
			.where('number', number)
			.findById(id);
	}

	static findByIdAndTypeGeneral(id, typeGeneral, companyId, typeEntityId, number) {
		return this.query()
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('type_entity_id', typeEntityId)
			.skipUndefined()
			.where('number', number)
			.findById(id);
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

	static removeByTypeGeneral(id, typeGeneral, companyId, number) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('number', number)
			.where('company_id', companyId);
	}

	static validateCode({ code, id, typeGeneral }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneral)
			.where('code', code)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static async autoCode(id, companyId, number = 1, trx) {
		await this.query(trx)
			.patch({ number: raw('number+??', [number]) })
			.where('company_id', companyId)
			.where('id', id);
		const data = await this.getById(id, companyId);
		return data;
	}

	static async isIn(id, typeGeneralId, companyId) {
		return this.query()
			.where('id', id)
			.where('type_general_id', typeGeneralId)
			.skipUndefined()
			.where('company_id', companyId)
			.first();
	}

	static getAllByTypeGeneral(typeGeneralId, filter = {}, companyId) {
		let query = this.query().select(this.defaultColumns());
		if (isNullOrUndefined(filter.code)) {
			query.eager('[typeGeneral(selectColumns), areasCompany(selectColumns), financialEntity(selectColumns), typeFormat(selectColumns)]');
		}
		query
			.where('type_general_id', typeGeneralId)
			.skipUndefined()
			.where('number', filter.generalId)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('type_entity_id', filter.typeEntityId);
		if (filter.companyDef) {
			query.where(raw('(company_id is null OR company_id = ?)', filter.companyDef));
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllByEmployee(typeGeneralId, filter = {}, companyId) {
		let query = this.query()
			.eager('[typeFormat(selectColumns), employeeFilds(selectColumnsAdditional)]')
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneralId)
			.skipUndefined()
			.where('number', filter.generalId)
			.skipUndefined()
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getTypeWorkingByEmployedId(typeGeneralId, filter = {}, companyId) {
		let query = this.query()
			.eager('[typeGeneral(selectColumns), typeIes(selectColumns), iesValid(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('number', filter.generalId)
			.where('type_general_id', typeGeneralId)
			.skipUndefined()
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code, companyId, referenceId) {
		return this.query()
			.where('code', code)
			.where('company_id', companyId)
			.skipUndefined()
			.where('reference_id', referenceId)
			.first();
	}

	static getByCodeAndTypeMsCode(codes, typeGeneralCde) {
		return this.query()
			.select('id', 'name', 'code')
			.whereIn('code', codes)
			.where('type_general_id', typeGeneralCde);
	}
}

module.exports = General;
