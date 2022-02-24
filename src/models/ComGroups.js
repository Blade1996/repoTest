'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');

class ComGroups extends baseModel {
	static get tableName() {
		return 'com_groups';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_groups.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'code'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				subisdiaryId: {
					type: ['integer', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				additionalInformation: {
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
			'name',
			'code',
			'subsidiary_id',
			'description',
			'additional_information',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', companyId);

		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getById(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
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

module.exports = ComGroups;
