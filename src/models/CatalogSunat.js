'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class CatalogSunat extends baseModel {
	static get tableName() {
		return 'ms_catalog_sunat';
	}

	static get relationMappings() {
		return {
			sunatDetails: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/CatalogSunatDetails.js`,
				join: {
					from: 'ms_catalog_sunat.id',
					to: 'ms_catalog_sunat_details.catalog_sunat_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['code', 'description'],
			properties: {
				code: {
					type: 'string',
				},
				description: {
					type: 'string',
				},
				value: {
					type: 'string',
				},
				catalog: {
					type: 'string',
				},
				countryId: {
					type: ['integer', 'null'],
				},
				type: {
					type: ['string', 'null'],
				},
				number: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				typeCatalog: {
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

	static defaultColumns() {
		return [
			'id',
			'code',
			'description',
			'value',
			'catalog',
			'country_id',
			'type',
			'number',
			'additional_information',
			'type_catalog',
		];
	}

	static getAll(filter = {}) {
		let query = this.query().select(this.defaultColumns());
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

	static getByTypeCatalog(id) {
		return this.query()
			.select(this.defaultColumns())
			.where('type_catalog', id);
	}

	static getByCode(code, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('country_id', countryId)
			.first();
	}

	static getDetailsByCode(code, countryId) {
		return this.query()
			.eager('[sunatDetails(selectColumns)]')
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('country_id', countryId)
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
}

module.exports = CatalogSunat;
