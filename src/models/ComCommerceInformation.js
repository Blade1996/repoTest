'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class ComCommerceInformation extends baseModel {
	static get tableName() {
		return 'com_commerce_information';
	}

	static get relationMappings() {
		return {
			commerceInformation: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComCommerceInformation.js`,
				filter: query =>
					query.groupBy(`${this.tableName}.order_number`, `${this.tableName}.type_helper_center`),
				join: {
					from: 'com_commerce_information.com_commerce_information_id',
					to: 'com_commerce_information.id',
				},
			},
			section: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_general.id',
					to: 'com_commerce_information.type_helper_center',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name', 'type', 'comCommerceId'],
			properties: {
				name: {
					type: 'string',
				},
				subTitle: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				orderNumber: {
					type: ['integer', 'null'],
				},
				type: {
					type: 'integer',
				},
				urlImage: {
					type: ['string', 'null'],
				},
				comCommerceInformationId: {
					type: ['integer', 'null'],
				},
				comCommerceId: {
					type: 'integer',
				},
				typeHelperCenter: {
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
			'name',
			'sub_title',
			'description',
			'order_number',
			'url_image',
			'com_commerce_information_id',
			'com_commerce_id',
			'type_helper_center',
			'flag_active',
		];
	}

	static get virtualAttributes() {
		return ['mainName'];
	}

	get mainName() {
		if (this.commerceInformation) {
			return `${this.commerceInformation.name} > ${this.name}`;
		}
		return this.name;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static getById(filter = {}) {
		return this.query()
			.select(this.defaultColumns())
			.findById(filter.id)
			.skipUndefined()
			.where('com_commerce_id', filter.commerceId)
			.where('company_id', filter.companyId);
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('commerceInformation(selectColumns)')
			.where('company_id', companyId)
			.skipUndefined()
			.where('type', filter.type)
			.skipUndefined()
			.where('com_commerce_id', filter.comCommerceId)
			.skipUndefined()
			.where('type_helper_center', filter.typeHelperCenter)
			.skipUndefined()
			.where('com_commerce_information_id', filter.commerceInformationId);

		if (filter.flagFather) {
			query = query.whereNull('com_commerce_information_id');
		}

		return query.orderBy('order_number');
	}

	static updateDelete(data) {
		return this.query().upsertGraph(data);
	}

	static removeByCommerce(id, companyId, trx) {
		return this.query(trx)
			.delete()
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static removeIds(id, companyId) {
		return this.query()
			.softDelete()
			.whereNotIn('id', id)
			.where('company_id', companyId);
	}

	static async updateCommerce(createData, companyId) {
		const options = {
			noDelete: false,
		};
		const data = await this.query().upsertGraph(createData, options);
		const deleteData = data.map(item => item.id);
		await this.removeIds(deleteData, companyId);
	}
}

module.exports = ComCommerceInformation;
