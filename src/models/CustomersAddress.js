'use strict';

const { Model, transaction } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');

class CustomersAddress extends baseModel {
	static get tableName() {
		return 'com_customers_address';
	}

	static get relationMappings() {
		return {
			customer: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Customer.js`,
				join: {
					from: 'com_customers_address.customer_id',
					to: 'com_customers.id',
				},
			},
			parish: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_customers_address.parish_id',
					to: 'com_general.id',
				},
			},
			city: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_customers_address.city_id',
					to: 'com_general.id',
				},
			},
			province: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_customers_address.province_id',
					to: 'com_general.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['customerId', 'type', 'addressLine1'],
			properties: {
				customerId: {
					type: 'integer',
				},
				type: {
					type: 'integer',
				},
				addressLine1: {
					type: ['string', 'null'],
				},
				addressLine2: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				zipcode: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				latitude: {
					type: 'decimal',
				},
				longitude: {
					type: 'decimal',
				},
				isFavorite: {
					type: ['boolean', 'integer', 'null'],
				},
				parishId: {
					type: ['integer', 'null'],
				},
				cityId: {
					type: ['integer', 'null'],
				},
				provinceId: {
					type: ['integer', 'null'],
				},
				...defaultsPropiertes,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder =>
				builder.select(
					'address_line_1',
					'address_line_2',
					'id',
					'latitude',
					'longitude',
					'customer_id',
				),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'customer_id',
			'type',
			'address_line_1',
			'name',
			'address_line_2',
			'zipcode',
			'document_number',
			'phone',
			'latitude',
			'longitude',
			'location',
			'is_favorite',
			'parish_id',
			'city_id',
			'province_id',
			'number',
			'reference',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(customerId, companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[customer(selectColumns), parish(selectColumns), city(selectColumns), province(selectColumns)]')
			.skipUndefined()
			.where('customer_id', customerId)
			.skipUndefined()
			.where('province_id', filter.provinceId)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('parish_id', filter.parishId)
			.where('company_id', companyId);

		if (filter.vendor) {
			query.whereNotNull('location');
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, customerId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[customer(selectColumns), parish(selectColumns), city(selectColumns), province(selectColumns)]')
			.findById(id)
			.skipUndefined()
			.where('customer_id', customerId)
			.where('company_id', companyId);
	}

	static create(data) {
		const knex = CustomersAddress.knex();
		return transaction(knex, async (trx) => {
			const newData = data;
			if (newData.latitude && newData.longitude) {
				const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
				newData.location = this.raw(`GeomFromText(${point})`);
			}
			if (data.isFavorite) {
				await this.removeAllFavorites(data.customerId, data.companyId, trx);
			}
			return this.query(trx).insertGraph(newData);
		});
	}

	static edit(id, data, customerId, companyId) {
		const knex = CustomersAddress.knex();
		return transaction(knex, async (trx) => {
			if (data.isFavorite) {
				await this.removeAllFavorites(customerId, companyId, trx);
			}
			const newData = data;
			if (newData.latitude && newData.longitude) {
				const point = `"POINT(${newData.latitude} ${newData.longitude})"`;
				newData.location = this.raw(`GeomFromText(${point})`);
			}
			return this.query(trx)
				.patch(newData)
				.where('id', id)
				.where('customer_id', customerId)
				.where('company_id', companyId);
		});
	}

	static editSimple(id, data, customerId, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('customer_id', customerId)
			.where('company_id', companyId);
	}

	static getCustomerAddressByPoligony(poligony, companyId, filter) {
		const query = this.query()
			.eager('[parish(selectColumns), city(selectColumns), province(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('flag_active', filter.flagActive)
			.skipUndefined()
			.where('province_id', filter.provinceId)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('parish_id', filter.parishId)
			.where('company_id', companyId);

		if (poligony) {
			query.whereRaw(`ST_CONTAINS(ST_GeomFromText(${poligony}), location)`);
		}
		return query;
	}

	static remove(id, companyId, customerId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId)
			.skipUndefined()
			.where('customer_id', customerId);
	}

	static getByCustomerId(id, customerId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[customer(selectColumns), parish(selectColumns), city(selectColumns), province(selectColumns)]')
			.skipUndefined()
			.where('id', id)
			.where('customer_id', customerId)
			.where('company_id', companyId)
			.first();
	}

	static getByIds(ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[customer(selectColumns), parish(selectColumns), city(selectColumns), province(selectColumns)]')
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static removeAllFavorites(customerId, companyId, trx) {
		return this.query(trx)
			.patch({ isFavorite: 0 })
			.where('is_favorite', 1)
			.where('customer_id', customerId)
			.where('company_id', companyId);
	}
}

module.exports = CustomersAddress;
