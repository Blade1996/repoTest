'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const simpleAxios = require('./../api/shared/simple-axios');

class FairsCommerce extends baseModel {
	static get tableName() {
		return 'com_fairs_commerce';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			properties: {
				fairId: {
					type: ['integer', 'null'],
				},
				commerceId: {
					type: ['integer', 'null'],
				},
				flagStatusFair: {
					type: ['integer', 'null'],
				},
				jsonPlans: {
					type: ['object', 'null'],
				},
				jsonInformation: {
					type: ['object', 'null'],
				},
				type: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get relationMappings() {
		return {
			fair: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Fairs.js`,
				join: {
					from: 'com_fairs_commerce.fair_id',
					to: 'com_fairs.id',
				},
			},
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_fairs_commerce.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
		};
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'fair_id',
			'commerce_id',
			'json_plans',
			'flag_status_fair',
			'flag_sync',
			'json_information',
		];
		return columns.concat(otherColumns);
	}

	static getAll(fairId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('fair_id', fairId);
	}

	static getByCode(fairId, commerceId, filter = {}) {
		let fairColumns = 'selectColumns';
		let commerceEagers = '';
		if (filter.includeMainNode && filter.includeMainNode.toString() === 'true') {
			fairColumns = 'fairFirebaseColumns';
			commerceEagers = '.wayPaymentCommerce(fairColumns).wayPayment(fairColumns)';
		}
		return this.query()
			.select(this.defaultColumns())
			.eager(`[fair(${fairColumns}), commerce(fairColumns)${commerceEagers}]`)
			.skipUndefined()
			.where('fair_id', fairId)
			.skipUndefined()
			.where('commerce_id', commerceId)
			.first();
	}

	static getByFairCommerceId(fairId, commerceId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('fair_id', fairId)
			.skipUndefined()
			.where('commerce_id', commerceId)
			.first();
	}

	static create(data) {
		return this.query().insertGraph(data);
	}

	static edit(data, fairId, commerceId) {
		return this.query()
			.patch(data)
			.where('fair_id', fairId)
			.where('commerce_id', commerceId);
	}

	static editMultiple(data) {
		return this.query().upsertGraph(data, {
			noDelete: false,
			unrelate: false,
		});
	}

	static async editFacebookLive({ commerceId, authorization }) {
		const fairCommerce = await this.query()
			.select('fair_id', 'json_plans')
			.eager('[commerce(selectColumns), fair(firebaseColumns)]')
			.where('flag_status_fair', 1)
			.where('commerce_id', commerceId)
			.first();
		if (
			fairCommerce &&
			fairCommerce.jsonPlans &&
			fairCommerce.jsonPlans.includePlan &&
			fairCommerce.jsonPlans.includePlan.facebookLive &&
			fairCommerce.commerce.slug
		) {
			simpleAxios({
				url: `${process.env.PRODUCTS_NEW_URL}/sync-firebase/commerces/${commerceId}/fairs/${
					fairCommerce.fairId
				}/facebook`,
				headers: {
					authorization,
				},
				data: {
					commerce: {
						slug: fairCommerce.commerce.slug,
						settings: {
							facebookLive: fairCommerce.commerce.settings.facebookLive,
						},
					},
					fair: {
						firebaseMainNode: fairCommerce.fair && fairCommerce.fair.firebaseMainNode,
					},
				},
				method: 'POST',
				validateStatus: () => true,
			});
		}
		return { commerceId, fairCommerce };
	}

	static updateFairMainNode({
		commerceId, productsId, fairMainNode, authorization,
	}) {
		try {
			simpleAxios({
				url: `${process.env.PRODUCTS_NEW_URL}/commerce-company/main-node`,
				method: 'PATCH',
				headers: {
					authorization,
				},
				data: {
					commerceId,
					productsId,
					fairMainNode,
				},
				validateStatus: () => true,
			});
			return 0;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('ERROR_EN_FIREBASE_MAIN_NODE', error);
			return 1;
		}
	}
}
module.exports = FairsCommerce;
