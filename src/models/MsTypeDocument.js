'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const ModuleCode = require('./ModuleCode');

class MsTypeDocument extends baseModel {
	static get tableName() {
		return 'com_ms_type_documents';
	}

	static get virtualAttributes() {
		return ['typeName'];
	}

	get typeName() {
		let typeName;
		switch (this.flagType) {
		case 1:
			typeName = 'Venta';
			break;
		case 2:
			typeName = 'Compra';
			break;
		default:
			typeName = undefined;
		}
		return typeName;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comCountryId', 'name', 'flagType', 'code'],
			properties: {
				comCountryId: {
					type: 'integer',
				},
				name: {
					type: 'string',
				},
				flagType: {
					type: 'integer',
				},
				code: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				settings: {
					type: ['object', 'null'],
				},
				includeInList: {
					type: ['integer', 'boolean', 'null'],
				},
				summaryCode: {
					type: ['string', 'null'],
				},
				flagFee: {
					type: ['integer', 'null'],
					default: 1,
				},
				flagDisplayTransfer: {
					type: ['boolean', 'integer', 'null'],
				},
				flagConvertDocument: {
					type: ['boolean', 'integer', 'null'],
				},
				flagIncludeNotes: {
					type: ['integer', 'null'],
					default: 0,
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'com_country_id',
			'name',
			'flag_type',
			'code',
			'code_taxes',
			'summary_code',
			'qp_code',
			'description',
			'flag_active',
			'created_at',
			'updated_at',
			'settings',
			'include_in_list',
			'flag_fee',
			'flag_display_transfer',
			'flag_convert_document',
			'flag_include_notes',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static moveKardex(code) {
		return ['GRM', 'FAC', 'NTV', 'BOL', 'NTC', 'NTD', 'ORC', 'NDD'].indexOf(code) > -1;
	}

	static generateTransaction(code) {
		return (
			[
				'FAC',
				'BOL',
				'RPH',
				'LDC',
				'BTA',
				'BTA',
				'CPA',
				'NTD',
				'RPA',
				'PBV',
				'TEM',
				'DEF',
				'RSP',
				'BTN',
				'LQC',
				'NTC',
				'NTV',
				'NDD',
			].indexOf(code) > -1
		);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getAll(filter = {}, flagType) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('flag_type', flagType)
			.skipUndefined()
			.where('include_in_list', filter.includeInList)
			.skipUndefined()
			.where('com_country_id', filter.countryId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllCompany(countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_country_id', countryId)
			.orderBy('flag_type', 'asc');
	}

	static getById(id, code, { flagType = ModuleCode.sales, comCountryId = 1 }) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_type', flagType)
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.where('code', code)
			.skipUndefined()
			.where('com_country_id', comCountryId)
			.first();
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

	static get relationMappings() {
		const relation = {
			documentsType: {
				relation: baseModel.HasManyRelation,
				modelClass: `${__dirname}/TypeDocument.js`,
				join: {
					from: 'com_ms_type_documents.id',
					to: 'sal_type_documents.com_type_document_id',
				},
			},
		};
		return relation;
	}

	static get namedFilters() {
		return {
			documentTypeData: builder => builder.select(this.defaultColumns()),
		};
	}

	static getByCode(code, comCountryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_country_id', comCountryId)
			.where('code', code)
			.first();
	}

	static getByCodeMultiple(code, countryId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.join('sal_type_documents as td', `${this.tableName}.id`, 'td.com_type_document_id')
			.where('com_company_id', companyId)
			.where('com_country_id', countryId)
			.whereIn('code', code);
	}

	static getByIdSeller(id) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('id', id)
			.first();
	}

	static getByCodes(countryId, codes = ['BOL', 'FAC', 'PED'], flagType = ModuleCode.sales) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', codes)
			.where('flag_type', flagType)
			.where('com_country_id', countryId);
	}

	static getByCodesAndCountry(codes, comCountryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_country_id', comCountryId)
			.whereIn('code', codes);
	}

	static getByTypeCodes(id, codes, { flagType = ModuleCode.sales, comCountryId = 1 }) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_type', flagType)
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.whereIn('code', codes)
			.skipUndefined()
			.where('com_country_id', comCountryId);
	}
}

module.exports = MsTypeDocument;
