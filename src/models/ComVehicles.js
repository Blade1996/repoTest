'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComVehicles extends baseModel {
	static get tableName() {
		return 'com_vehicles';
	}

	static get relationMappings() {
		return {
			typeTransport: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeTransport.js`,
				join: {
					from: 'com_vehicles.type_transport_id',
					to: 'ms_type_transport.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['brandName'],
			properties: {
				plate: {
					type: ['string', 'null'],
				},
				brandName: {
					type: ['string', 'null'],
				},
				model: {
					type: ['string', 'null'],
				},
				color: {
					type: ['string', 'null'],
				},
				typeEngine: {
					type: ['string', 'null'],
				},
				typeTransportId: {
					type: ['integer', 'null'],
				},
				capacity: {
					type: ['string', 'null'],
				},
				observations: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'plate',
			'brand_name',
			'model',
			'color',
			'type_engine',
			'type_transport_id',
			'capacity',
			'observations',
			'created_at',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('company_id', companyId)
			.where('id', id);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('company_id', companyId)
			.where('id', id);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[typeTransport(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}
}

module.exports = ComVehicles;
