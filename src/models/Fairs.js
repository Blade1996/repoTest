'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');

class Fairs extends baseModel {
	static get tableName() {
		return 'com_fairs';
	}
	static get relationMappings() {
		return {
			fairCommerce: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/FairsCommerce.js`,
				join: {
					from: 'com_fairs.id',
					to: 'com_fairs_commerce.fair_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code'],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				jsonData: {
					type: ['object', 'null'],
				},
				jsonPlans: {
					type: ['object', 'null'],
				},
				jsonTemplate: {
					type: ['object', 'null'],
				},
				commerceType: {
					type: ['integer', 'null'],
				},
				configurationStatus: {
					type: ['integer', 'null'],
				},
				firebaseMainNode: {
					type: ['string', 'null'],
				},
				firebaseCredentials: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			fairFirebaseColumns: builder => builder.select(this.defaultColumns(['firebase_main_node'])),
			firebaseColumns: builder => builder.select('id', 'firebase_main_node'),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'code',
			'name',
			'start_date',
			'end_date',
			'promotion_start_date',
			'promotion_end_date',
			'json_data',
			'json_plans',
			'json_template',
			'commerce_type',
			'configuration_status',
			'url_image',
		];
		return columns.concat(otherColumns);
	}

	static get virtualAttributes() {
		return ['activationStatus', 'commerceTypeName'];
	}

	get activationStatus() {
		let status = false;
		const from = Date.parse(this.startDate);
		const to = Date.parse(this.endDate);
		const day = new Date();
		if (day <= to && day >= from) {
			status = true;
		}
		return status;
	}

	get commerceTypeName() {
		let name = '';
		switch (this.commerceType) {
		case 1:
			name = 'MARKETPLACE';
			break;
		case 2:
			name = 'CATALOGO';
			break;
		case 3:
			name = 'ECOMMERCE';
			break;
		default:
			name = '';
			break;
		}
		return name;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[fairCommerce(selectColumns).commerce(basicColumns)]')
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('commerce_type', filter.commerceType)
			.skipUndefined()
			.where('configuration_status', filter.configuration_status);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.first();
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[fairCommerce(selectColumns).commerce(basicColumns)]')
			.where('id', id)
			.first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, filter = {}) {
		return this.query()
			.patch(data)
			.where('id', id)
			.skipUndefined()
			.where('company_id', filter.companyId);
	}

	static remove(id, filter = {}) {
		return this.query()
			.softDelete()
			.where('id', id)
			.skipUndefined()
			.where('company_id', filter.companyId);
	}

	static getByIdBasic(id) {
		return this.query()
			.select('id', 'firebase_main_node')
			.where('id', id)
			.first();
	}
}
module.exports = Fairs;
