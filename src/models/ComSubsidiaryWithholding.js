'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class comSubsidiaryWithholding extends baseModel {
	static get tableName() {
		return 'com_code_subsidiary_withholding';
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
				msCatalogHeaderCode: {
					type: ['string', 'null'],
				},
				description: {
					type: 'string',
				},
				value: {
					type: ['string', 'null'],
				},
				catalog: {
					type: ['string', 'null'],
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
				msCatalogSunatId: {
					type: ['integer', 'null'],
				},
				account: {
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
				flagTaxes: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'ms_catalog_header_code',
			'description',
			'value',
			'catalog',
			'type_catalog',
			'additional_information',
			'number',
			'type',
			'account',
			'account_vta',
			'activity',
			'percentage',
			'flag_taxes',
			'subsidiary_id',
			'ms_catalog_sunat_id',
			'company_id',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static match(query, search) {
		query.whereRaw(
			'MATCH(code, ms_catalog_header_code, description, value, catalog, type, account, account_vta) AGAINST(?)',
			[search],
		);
		return query;
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('id', id)
			.first();
	}

	static getAll(filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.where('company_id', companyId);
		if (search) {
			query = this.match(query, search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static editFlagActive(id, flagActive, companyId) {
		return this.query()
			.patch({ flagActive })
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = comSubsidiaryWithholding;
