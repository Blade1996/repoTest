'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');

class RemissionGuideDetail extends baseModel {
	static get tableName() {
		return 'sal_remission_guides_detail';
	}

	static get relationMappings() {
		return {
			saleDetail: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SaleDocumentsDetail.js`,
				join: {
					from: 'sal_remission_guides_detail.sal_sale_documents_detail_id',
					to: 'sal_sale_documents_detail.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['salRemissionGuideId', 'warProductsId'],
			properties: {
				salSaleDocumentsDetailId: {
					type: 'integer',
				},
				salRemissionGuideId: {
					type: 'integer',
				},
				warProductsId: {
					type: 'integer',
				},
				quantity: {
					type: 'number',
				},
				warWarehousesId: {
					type: 'integer',
				},
				brandId: {
					type: 'integer',
				},
				additionalInformation: {
					type: ['array', 'null'],
					default: [],
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

	static create(data) {
		return this.query().insert(data);
	}

	static defaultColumns() {
		return [
			'id',
			'sal_sale_documents_detail_id',
			'sal_remission_guide_id',
			'war_products_id',
			'quantity',
			'war_warehouses_id',
			'brand_id',
			'additional_information',
		];
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getAll(idRemission) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_remission_guide_id', idRemission);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.whereIn('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = RemissionGuideDetail;
