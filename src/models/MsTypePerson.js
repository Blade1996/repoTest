'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');

class MsTypePerson extends baseModel {
	static get tableName() {
		return 'ms_type_person';
	}

	static get relationMappings() {
		return {
			country: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Country.js`,
				join: {
					from: 'ms_type_person.country_id',
					to: 'com_country.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: 'string',
				},
				codeTaxes: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				countryId: {
					type: 'integer',
				},
				configuration: {
					type: 'object',
				},
				flagLegal: {
					type: ['boolean', 'integer', 'null'],
				},
				flagDefault: {
					type: ['boolean', 'integer', 'null'],
				},
				...defaultsPropiertes,
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
		const columns = [
			'id',
			'name',
			'code',
			'code_taxes',
			'country_id',
			'configuration',
			'flag_legal',
			'flag_default',
		];
		return columns.concat(otherColumns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.eager('country(selectColumns)')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('country_id', filter.countryId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code_taxes', code)
			.first();
	}

	static getByCodeTypePerson(code, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('country_id', countryId)
			.first();
	}

	static getById(id, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('id', id)
			.skipUndefined()
			.where('country_id', countryId)
			.first();
	}

	static geTypePerson(countryId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('country_id', countryId)
			.skipUndefined()
			.where('flag_legal', true)
			.first();
	}

	static isIn(id) {
		return this.query()
			.select('id')
			.where('id', id)
			.first();
	}

	static getDefaultByCountry(countryId) {
		return this.query()
			.where('country_id', countryId)
			.where('flag_default', true)
			.first();
	}

	static getDocumentPublic(filter = {}) {
		const query = this.query()
			.select('id', 'code', 'name', 'configuration')
			.where('country_id', filter.countryId)
			.skipUndefined()
			.where('flag_legal', filter.flagLegal);
		if (filter.id && filter.id.length > 0) {
			query.whereIn(`${this.tableName}.id`, filter.id);
		}
		return query;
	}
}
module.exports = MsTypePerson;
