'use strict';

const { Model, transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const ComCustomerBenefits = require('./ComCustomerBenefits');

class ComDiscountDocument extends baseModel {
	static get tableName() {
		return 'com_discount_document';
	}

	static get relationMappings() {
		return {
			customerBenefits: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComCustomerBenefits.js`,
				join: {
					from: 'com_discount_document.benefits_customer_id',
					to: 'com_customer_benefits.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['integer', 'benefitsCustomerId'],
			properties: {
				documentId: {
					type: ['integer', 'null'],
				},
				benefitsCustomerId: {
					type: ['integer', 'null'],
				},
				amount: {
					type: ['integer', 'null'],
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
		let columns = ['id', 'document_id', 'benefits_customer_id', 'amount'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static updateMultiple(data, tx) {
		return this.query(tx).upsertGraph(data, {
			noDelete: false,
			unrelate: true,
		});
	}

	static async createBatch(data, saleId) {
		let relationDocument = [...data];
		const updateCupon = [];
		if (saleId) {
			relationDocument = data.reduce((acum, coup) => {
				const newCoup = { ...coup };
				newCoup.documentId = saleId;
				if (coup.customerBenefits) {
					updateCupon.push(coup.customerBenefits);
				}
				delete newCoup.customerBenefits;
				delete newCoup.included;
				if (newCoup.included !== 'delete') {
					acum.push(newCoup);
				}
				return acum;
			}, []);
		}
		const knex = ComDiscountDocument.knex();
		const response = await transaction(knex, async (trx) => {
			const salResult = await this.updateMultiple(relationDocument, trx);
			if (updateCupon && updateCupon.length > 0) {
				await ComCustomerBenefits.updateMultiple(updateCupon, trx);
			}
			return salResult;
		});

		return Promise.resolve(response);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}
}

module.exports = ComDiscountDocument;
