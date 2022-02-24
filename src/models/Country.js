'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class Country extends baseModel {
	static get tableName() {
		return 'com_country';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'countryCode'],
			properties: {
				name: {
					type: 'string',
				},
				countryCode: {
					type: 'string',
				},
				taxName: {
					type: 'string',
				},
				urlImage: {
					type: 'string',
				},
				taxSize: {
					type: 'integer',
				},
				configSupplier: {
					type: 'object',
				},
				configTaxes: {
					type: 'object',
				},
				productsTaxes: {
					type: ['object', 'null'],
					default: {},
				},
				descriptionTax: {
					type: ['string', 'null'],
				},
				percentage: {
					type: ['number', 'null'],
					default: 0,
				},
				currency: {
					type: ['string', 'null'],
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

	static defaultColumns() {
		return [
			'id',
			'name',
			'country_code',
			'tax_name',
			'url_image',
			'tax_size',
			'config_supplier',
			'config_taxes',
			'products_taxes',
			'description_tax',
			'percentage',
			'currency',
		];
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('country_code', code)
			.first();
	}

	static getByIdCountry(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.first();
	}
}

module.exports = Country;
