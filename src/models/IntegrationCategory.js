'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');

class IntegrationCategory extends baseModel {
	static get tableName() {
		return 'com_integration_category';
	}

	static get relationMappings() {
		return {
			integrations: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Integration.js`,
				join: {
					from: 'com_integration_category.id',
					to: 'com_integrations.category_id',
				},
			},
			category: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Integration.js`,
				join: {
					from: 'com_integration_category.integration_id',
					to: 'com_integrations.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['code', 'name', 'integrationId'],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				integrationId: {
					type: 'integer',
				},
				configTemplate: {
					type: ['object', 'null'],
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
		let columns = [
			'id',
			'code',
			'name',
			'integration_id',
			'config_template',
			'flag_active',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, flagType = false) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('integration_id', filter.integrationId);

		if (flagType) {
			query = query.eager('category(selectColumns)');
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getByCodes(codes) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('code', codes);
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

module.exports = IntegrationCategory;
