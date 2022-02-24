'use strict';

const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const { uniqueValues } = require('../shared/helper');

class WayPaymentCommerce extends baseModel {
	static get tableName() {
		return 'com_way_payment_commerce';
	}

	static get relationMappings() {
		return {
			commerce: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEcommerceCompany.js`,
				join: {
					from: 'com_way_payment_commerce.commerce_id',
					to: 'com_ecommerce_company.id',
				},
			},
			wayPayment: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsWayPayment.js`,
				join: {
					from: 'com_way_payment_commerce.way_payment_id',
					to: 'ms_way_payment.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['commerceId', 'wayPaymentId'],
			properties: {
				commerceId: {
					type: ['integer', 'null'],
				},
				wayPaymentId: {
					type: ['integer', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				gatewayConfiguration: {
					type: ['array', 'null'],
				},
				...defaultsPropiertes,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'commerce_id',
			'way_payment_id',
			'description',
			'gateway_configuration',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static fairColumns(otherColumns = []) {
		let columns = ['id', 'commerce_id', 'way_payment_id'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static defaultColumnsPublic(otherColumns = []) {
		let columns = ['commerce_id', 'way_payment_id', 'description'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static credentialColumns() {
		const columns = ['way_payment_id', 'gateway_configuration'].map(c => `${this.tableName}.${c}`);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			selectColumnsPublic: builder => builder.select(this.defaultColumnsPublic()),
			fairColumns: builder => builder.select(this.fairColumns()),
			credentialColumns: builder => builder.select(this.credentialColumns()),
		};
	}
	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('flag_active', true)
			.where(`${this.tableName}.company_id`, companyId);
		if (filter.flagEcommerce) {
			query.whereIn(`${this.tableName}.way_payment_id`, filter.wayPaymentRelated);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getByWayPayment(wayPaymentId, commerceId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('way_payment_id', wayPaymentId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('commerce_id', commerceId)
			.first();
	}

	static remove(commerceId, wayPaymentId, companyId) {
		const query = this.query()
			.delete()
			.where(`${this.tableName}.commerce_id`, commerceId)
			.skipUndefined()
			.where(`${this.tableName}.way_payment_id`, wayPaymentId)
			.where(`${this.tableName}.company_id`, companyId);
		return query;
	}

	static edit(data, { commerceId, wayPaymentId }, companyId) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.commerce_id`, commerceId)
			.where(`${this.tableName}.way_payment_id`, wayPaymentId)
			.where('company_id', companyId);
	}

	static async editConfigCredDeb(data, { wayPayment, commerces }, companyId) {
		const comWayPayment = await this.query()
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.commerce_id`, commerces.map(i => i.id))
			.where(`${this.tableName}.way_payment_id`, wayPayment.id)
			.where('company_id', companyId);
		const commerceUpdate = [];
		const dataUpdate = commerces.map((i) => {
			const comItem = comWayPayment.find(w => w.commerceId === i.id);
			const newItem = {
				commerceId: i.id,
				wayPaymentId: wayPayment.id,
				description: 'Pagos online',
				gatewayConfiguration: data.gatewayConfiguration,
				companyId,
			};
			if (comItem) {
				newItem.id = comItem.id;
			} else {
				const wayPaymentRelated = i.wayPaymentRelated || [];
				wayPaymentRelated.push(wayPayment.id);
				const uniqueIds = uniqueValues(wayPaymentRelated);
				commerceUpdate.push({ id: i.id, wayPaymentRelated: uniqueIds });
			}
			return newItem;
		});
		await this.query().upsertGraph(dataUpdate, {
			noDelete: true,
			unrelate: false,
		});
		return commerceUpdate;
	}

	static buildWayPaymentWoCommerce(data) {
		const gateCong = data.gatewayConfiguration;
		const gateway = gateCong && Array.isArray(gateCong) && gateCong.length > 0 && gateCong[0];
		return {
			wayPaymentId: data.id,
			description: data.description,
			gatewayConfiguration: [gateway],
			companyId: data.companyId,
		};
	}
}
module.exports = WayPaymentCommerce;
