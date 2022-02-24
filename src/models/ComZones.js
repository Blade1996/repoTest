'use strict';

const { Model, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComZonesCustomers = require('./ComZonesCustomers');

class ComZones extends baseModel {
	static get tableName() {
		return 'com_zones';
	}

	static get relationMappings() {
		return {
			customers: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/Customer.js`,
				filter: query =>
					query.where('com_zones_customers.flag_active', 1).distinct('com_customers.id'),
				join: {
					from: 'com_zones.id',
					through: {
						modelClass: `${__dirname}/ComZonesCustomers.js`,
						from: 'com_zones_customers.zone_id',
						to: 'com_zones_customers.customer_id',
					},
					to: 'com_customers.id',
				},
			},
			sellers: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				filter: query =>
					query.where('com_zones_customers.flag_active', 1).distinct('com_sellers.id'),
				join: {
					from: 'com_zones.id',
					through: {
						modelClass: `${__dirname}/ComZonesCustomers.js`,
						from: 'com_zones_customers.zone_id',
						to: 'com_zones_customers.seller_id',
					},
					to: 'com_sellers.id',
				},
			},
			customersAddress: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/CustomersAddress.js`,
				filter: query =>
					query
						.where('com_zones_customers.flag_active', 1)
						.select('com_zones_customers.id as zones_customer_id'),
				join: {
					from: 'com_zones.id',
					through: {
						modelClass: `${__dirname}/ComZonesCustomers.js`,
						from: 'com_zones_customers.zone_id',
						to: 'com_zones_customers.customers_address_id',
					},
					to: 'com_customers_address.id',
				},
			},
			province: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_zones.province_id',
					to: 'com_general.id',
				},
			},
			city: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_zones.city_id',
					to: 'com_general.id',
				},
			},
			parish: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_zones.parish_id',
					to: 'com_general.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name', 'company_id'],
			properties: {
				relatedSellers: {
					type: 'array',
					default: [],
				},
				relatedCustomers: {
					type: 'array',
					default: [],
				},
				name: {
					type: ['string', 'null'],
				},
				image: {
					type: ['string', 'null'],
				},
				sector: {
					type: ['string', 'null'],
				},
				definition: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				location: {
					type: ['string', 'null'],
				},
				cityId: {
					type: ['integer', 'null'],
				},
				parishId: {
					type: ['integer', 'null'],
				},
				provinceId: {
					type: ['integer', 'null'],
				},
				area: {
					type: 'number',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select('location', 'name', 'id'),
		};
	}

	static defaultColumns() {
		return [
			'id',
			'name',
			'image',
			'sector',
			'definition',
			'description',
			'location',
			'area',
			'related_sellers',
			'related_customers',
			'company_id',
			'subsidiary_id',
			'city_id',
			'parish_id',
			'province_id',
			'created_at',
		];
	}

	static tableFilters(query, filter = {}, fields = []) {
		const value = `%${filter.search}%`;
		query.where((builder) => {
			fields.forEach((field) => {
				builder.orWhere(field, 'like', value);
			});
		});
		return query;
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[sellers(selectColumns), customers(selectColumns), province(selectColumns), city(selectColumns), parish(selectColumns)]')
			.skipUndefined()
			.where('province_id', filter.provinceId)
			.skipUndefined()
			.where('city_id', filter.cityId)
			.skipUndefined()
			.where('parish_id', filter.parishId)
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.where('company_id', companyId);

		if (filter.search) {
			query = this.tableFilters(query, filter, ['name', 'description']);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		let dataNew = data;
		const { location } = dataNew;
		dataNew.location = this.raw(`GeomFromText(${location})`);
		dataNew.definition = this.raw(`ST_Area(GeomFromText((${location})))`);
		delete dataNew.polygon;
		const knex = ComZones.knex();
		return transaction(knex, () =>
			this.query()
				.insert(dataNew)
				.then((newRecord) => {
					dataNew = newRecord;
					const newData = newRecord.relatedCustomers.map((item) => {
						const newRow = {
							zoneId: Number(dataNew.id),
							customerId: item.customerId,
							customersAddressId: item.id,
							flagActive: true,
							companyId: newRecord.companyId,
						};
						if (item.location) {
							const point = `"POINT(${item.location.x} ${item.location.y})"`;
							newRow.location = this.raw(`GeomFromText(${point})`);
						}
						return newRow;
					});
					return newData.length > 0 ? ComZonesCustomers.create(newData) : null;
				})
				.then(() => dataNew));
	}

	static getPolygon(structure) {
		if (structure) {
			const location = structure.reduce((polygon, element) => {
				let newPolygon = polygon;
				let position = element.reduce((acum, item) => {
					const newAcum = acum;
					return `${newAcum}${item.lat} ${item.lng}, `;
				}, '');
				position = `${position}${element[0].lat} ${element[0].lng}`;
				newPolygon += newPolygon !== '' ? ', ' : '';
				return `${newPolygon}(${position})`;
			}, '');
			return `"POLYGON(${location})"`;
		}
		return undefined;
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[customers(selectColumnsVendor), sellers(selectColumns).employee(selectColumnsVendor), customersAddress(selectColumns).[customer(selectColumns)]]')
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		const { deleteCustomer, createCustomer, createSeller } = data;
		const dataNew = data;
		if (dataNew.location) {
			dataNew.location = this.raw(`GeomFromText(${dataNew.location})`);
			dataNew.definition = this.raw(`ST_Area((${dataNew.location}))`);
		} else {
			delete dataNew.location;
		}
		delete dataNew.polygon;
		delete dataNew.deleteCustomer;
		delete dataNew.createCustomer;
		delete dataNew.createSeller;
		const knex = ComZones.knex();
		return transaction(knex, () =>
			this.query()
				.patch(dataNew)
				.where('id', id)
				.where('company_id', companyId)
				.then(() => {
					if (deleteCustomer.length > 0) {
						const ids = deleteCustomer.map(it => it.id);
						return ComZonesCustomers.remove(id, ids, companyId);
					}
					return null;
				})
				.then(() => {
					const newData = createCustomer.map((item) => {
						const newRow = {
							zoneId: Number(id),
							customerId: item.customerId,
							flagActive: true,
							companyId,
							customersAddressId: item.id,
						};
						if (item.location) {
							const point = `"POINT(${item.location.x} ${item.location.y})"`;
							newRow.location = this.raw(`GeomFromText(${point})`);
						}
						return newRow;
					});
					return newData.length > 0 ? ComZonesCustomers.create(newData) : null;
				})
				.then(() => {
					const newData = createSeller.map((item) => {
						const newRow = {
							zoneId: Number(id),
							sellerId: item,
							flagActive: true,
							companyId,
						};
						return newRow;
					});
					return newData.length > 0 ? ComZonesCustomers.create(newData) : null;
				}));
	}

	static remove(id, companyId) {
		const knex = ComZones.knex();
		return transaction(knex, () =>
			this.query()
				.softDelete()
				.where('id', id)
				.where('company_id', companyId)
				.then(() => ComZonesCustomers.remove(id, undefined, companyId)));
	}
}

module.exports = ComZones;
