'use strict';

const { Model, raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const { normal, commerce } = require('./enums/type-item-enum');

class Item extends baseModel {
	static get tableName() {
		return 'com_item';
	}

	static get relationMappings() {
		return {
			commerce: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_item.id',
					to: 'com_ecommerce_company.item_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: 'string',
				},
				dataState: {
					type: 'object',
				},
				salSaleColumns: {
					type: 'object',
				},
				code: {
					type: ['string', 'null'],
				},
				companyId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['object', 'null'],
					default: {},
				},
				urlImage: {
					type: ['string', 'null'],
				},
				urlIcon: {
					type: ['string', 'null'],
				},
				type: {
					type: ['integer', 'null'],
					default: normal,
				},
				itemId: {
					type: ['integer', 'null'],
				},
				slug: {
					type: ['string', 'null'],
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

	static defaultColumns(otherColumns = [], notShow = []) {
		let columns = [
			'id',
			'name',
			'code',
			'data_state',
			'additional_information',
			'type',
			'url_image',
			'url_icon',
			'company_id',
		];
		if (notShow && notShow.length > 0) {
			columns = columns.reduce((acc, c) => (!notShow.find(n => n === c) ? [...acc, c] : acc), []);
		}
		columns = columns.map(c => `${this.tableName}.${c}`).concat(otherColumns);
		return columns;
	}

	static get virtualAttributes() {
		return ['totalCommerce'];
	}

	get totalCommerce() {
		let totalCommerce = 0;
		if (this.commerce && Array.isArray(this.commerce)) {
			totalCommerce = this.commerce.length;
		}
		return totalCommerce;
	}

	static getAll(filter = {}) {
		let query = this.query()
			.skipUndefined()
			.where(`${this.tableName}.type`, filter.type);

		if (!filter.companyId) {
			query.select(this.defaultColumns());
		} else {
			const itemCommerce = 'com_items_commerce';
			query
				.select(
					this.defaultColumns([], ['additional_information', 'flag_active']),
					raw(`${itemCommerce}.additional_information, ${itemCommerce}.flag_active, ${itemCommerce}.order`),
				)
				.innerJoin(`${itemCommerce}`, `${itemCommerce}.item_id`, `${this.tableName}.id`)
				.skipUndefined()
				.where(`${itemCommerce}.flag_active`, filter.flagActive)
				.where(`${itemCommerce}.company_id`, filter.companyId);
			if (!filter.sortField || filter.sortField === 'order') {
				query.orderByRaw(`CASE WHEN ${itemCommerce}.order IS NULL THEN 1 ELSE 0 END, ${itemCommerce}.order`);
			}
		}
		if (!filter.notShowEcommerces && Number(filter.type) === commerce) {
			query.eager('[commerce(selectColumns)]').modifyEager('commerce', (builder) => {
				builder
					.skipUndefined()
					.where('com_ecommerce_company.company_id', filter.companyId)
					.whereNull('com_ecommerce_company.deleted_at');
				if (filter.latitude && filter.longitude) {
					builder
						.select(raw(
							'( 6371 * acos(cos(radians(?)) * cos(radians(com_ecommerce_company.latitude)) * cos(radians(com_ecommerce_company.longitude) - radians(?)) + sin(radians(?)) * sin(radians(com_ecommerce_company.latitude)))) AS distance',
							filter.latitude,
							filter.longitude,
							filter.latitude,
						))
						.whereNotNull('com_ecommerce_company.location')
						.having('distance', '<=', filter.kilometerRadius || 2)
						.orderBy('distance');
				}
			});
		}
		const filterModified = { ...filter };
		if (filter.companyId && (!filter.sortField || filter.sortField === 'order')) {
			delete filterModified.sortField;
		}
		query = this.includePaginationAndSort(query, filterModified);
		return query;
	}

	static getById(id, filter = {}) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('company_id', filter.companyId)
			.skipUndefined()
			.where('type', filter.type);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data, filter = {}) {
		return this.query()
			.patch(data)
			.where('id', id)
			.skipUndefined()
			.where('company_id', filter.companyId)
			.skipUndefined()
			.where('type', filter.type);
	}

	static remove(id, filter = {}) {
		return this.query()
			.softDelete()
			.where('id', id)
			.skipUndefined()
			.where('company_id', filter.companyId)
			.skipUndefined()
			.where('type', filter.type);
	}

	static getPublic(filter = {}) {
		const query = this.query()
			.select('id', 'name', 'code')
			.where('type', filter.type);
		if (filter.companyId) {
			query.where('company_id', filter.companyId);
		} else {
			query.whereNull('company_id');
		}
		return query;
	}

	static getBycode(code, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('company_id', companyId)
			.first();
	}
}

module.exports = Item;
