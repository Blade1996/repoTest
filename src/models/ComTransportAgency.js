'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class ComTransportAgency extends baseModel {
	static get tableName() {
		return 'com_transport_agency';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				rzSocial: {
					type: ['string', 'null'],
				},
				contact: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				mainAddress: {
					type: ['string', 'null'],
				},
				typeDocument: {
					type: ['integer', 'null'],
				},
				addresses: {
					type: ['array', 'null'],
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

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'code',
			'name',
			'rz_social',
			'contact',
			'phone',
			'email',
			'main_address',
			'type_document',
			'number',
			'addresses',
			'company_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}
	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('code', filter.code)
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static getByCode(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('company_id', companyId)
			.first();
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = ComTransportAgency;
