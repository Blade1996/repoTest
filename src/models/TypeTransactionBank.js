'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');

class TypeTransactionBank extends baseModel {
	static get tableName() {
		return 'ms_type_transaction_bank';
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get relationMappings() {
		return {
			country: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Country.js`,
				join: {
					from: 'ms_type_transaction_bank.country_id',
					to: 'com_country.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'countryId'],
			properties: {
				name: {
					type: 'string',
				},
				description: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				countryId: {
					type: ['integer', 'null'],
				},
				typeMovement: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'code', 'description', 'country_id', 'type_movement'];
	}

	static get virtualAttributes() {
		return ['typeMovementName'];
	}

	get typeMovementName() {
		let name;
		switch (this.typeMovement) {
		case 1:
			name = 'Ingreso';
			break;
		case 2:
			name = 'Egreso';
			break;
		default:
			break;
		}
		return name;
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('country(selectColumns)')
			.where('country_id', filter.countryId)
			.skipUndefined()
			.where('type_movement', filter.typeMovement);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getList() {
		return this.query()
			.select(this.defaultColumns())
			.eager('country(selectColumns)')
			.where('flag_active', true);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.eager('country(selectColumns)')
			.findById(id);
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

	static isIn(id) {
		return this.query()
			.select('id', 'type_movement')
			.where('id', id)
			.first();
	}
	static getByCode(code, countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('country_id', countryId)
			.first();
	}
	static getByCountryId(countryId) {
		return this.query()
			.select(this.defaultColumns())
			.where('country_id', countryId);
	}
}

module.exports = TypeTransactionBank;
