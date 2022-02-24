'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class CatalogSunatDetails extends baseModel {
	static get tableName() {
		return 'ms_catalog_sunat_details';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['code', 'description', 'catalogSunatId'],
			properties: {
				code: {
					type: 'string',
				},
				description: {
					type: ['string', 'null'],
				},
				value: {
					type: ['string', 'null'],
				},
				catalogSunatId: {
					type: 'integer',
				},
				acccount: {
					type: ['string', 'null'],
				},
				accountVta: {
					type: ['string', 'null'],
				},
				activity: {
					type: ['integer', 'null'],
				},
				percentage: {
					type: ['number', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				flagTaxes: {
					type: ['integer', 'null'],
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

	static virtualAttributes() {
		return ['autocomplete'];
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'description',
			'value',
			'catalog_sunat_id',
			'account',
			'account_vta',
			'activity',
			'percentage',
			'additional_information',
			'flag_taxes',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static getAll(filter = {}, catalogSunatId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('catalog_sunat_id', catalogSunatId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getByCodeMultiple(code, ids) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.whereIn('catalog_sunat_id', ids)
			.first();
	}

	static getByCodesMultiple(codes, ids) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', codes)
			.whereIn('catalog_sunat_id', ids);
	}

	static getTaxDefault(flagTaxes, id) {
		return this.query()
			.select(this.defaultColumns())
			.where('flag_taxes', flagTaxes)
			.where('catalog_sunat_id', id)
			.first();
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
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

	get autocomplete() {
		const description = this.description ? this.description : '';
		const code = this.code ? this.code : '';

		return `${description}-${code}`;
	}

	static getByCodes(codes) {
		return this.query()
			.select(this.defaultColumns(), 'ct.code as catalogSunatCode')
			.innerJoin('ms_catalog_sunat as ct', 'ct.id', `${this.tableName}.catalog_sunat_id`)
			.whereIn('ct.code', codes);
	}
}

module.exports = CatalogSunatDetails;
