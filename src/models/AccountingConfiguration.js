'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class AccountingConfiguration extends baseModel {
	static get tableName() {
		return 'com_accounting_configuration';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['moduleId', 'subsidiaryId'],
			properties: {
				flagAccountingAutomatic: {
					type: ['boolean', 'null'],
				},
				flagAccountingDisplay: {
					type: ['boolean', 'null'],
				},
				moduleId: {
					type: 'integer',
				},
				subsidiaryId: {
					type: 'integer',
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
			'flag_accounting_automatic',
			'flag_accounting_display',
			'module_id',
			'subsidiary_id',
		];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}
}

module.exports = AccountingConfiguration;
