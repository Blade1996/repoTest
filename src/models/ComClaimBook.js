'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const format = require('date-fns/format');
const { claim, complain } = require('./../models/enums/type-claim-book-enum');

class ComClaimBook extends baseModel {
	static get tableName() {
		return 'com_claim_book';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			properties: {
				claimDate: {
					type: 'date',
				},
				commerceName: {
					type: ['string', 'null'],
				},
				commerceAddress: {
					type: ['string', 'null'],
				},
				commerceCode: {
					type: ['string', 'null'],
				},
				commereRuc: {
					type: ['string', 'null'],
				},
				claimentName: {
					type: ['string', 'null'],
				},
				claimentAddress: {
					type: ['string', 'null'],
				},
				claimetPhone: {
					type: ['string', 'null'],
				},
				claimentEmail: {
					type: ['string', 'null'],
				},
				claimentDocument: {
					type: ['string', 'null'],
				},
				claimentFathers: {
					type: ['string', 'null'],
				},
				claimentWellHired: {
					type: 'object',
					default: {},
				},
				orderClaimDetail: {
					type: ['integer', 'null'],
				},
				claimOrder: {
					type: ['string', 'null'],
				},
				claimDetail: {
					type: ['string', 'null'],
				},
				answerDescription: {
					type: ['string', 'null'],
				},
				answerDate: {
					type: 'date',
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				commerceid: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'claim_date',
			'commerce_name',
			'commerce_address',
			'commerce_code',
			'commere_ruc',
			'claiment_name',
			'claiment_address',
			'claimet_phone',
			'claiment_email',
			'claiment_document',
			'claiment_fathers',
			'claiment_well_hired',
			'order_claim_detail',
			'claim_order',
			'claim_detail',
			'answer_date',
			'answer_description',
			'subsidiary_id',
			'commerce_id',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}
	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return ['virtualClaimDate', 'vritualOrderClaimDetail', 'virtualAnswerDate'];
	}

	get virtualClaimDate() {
		return {
			day: format(this.claimDate, 'DD'),
			month: format(this.claimDate, 'MM'),
			year: format(this.claimDate, 'YYYY'),
		};
	}

	get vritualOrderClaimDetail() {
		let response;
		if (this.orderClaimDetail === claim) {
			response = 'RECLAMO';
		}
		if (this.orderClaimDetail === complain) {
			response = 'QUEJA';
		}
		return response;
	}

	get virtualAnswerDate() {
		return {
			day: format(this.answerDate, 'DD'),
			month: format(this.answerDate, 'MM'),
			year: format(this.answerDate, 'YYYY'),
		};
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('order_claim_detail', filter.orderClaimDetail)
			.skipUndefined()
			.where('commerce_id', filter.commerceId)
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(filter = {}, id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('subsidiary_id', filter.subsidiaryId)
			.skipUndefined()
			.where('order_claim_detail', filter.orderClaimDetail)
			.skipUndefined()
			.where('commerce_id', filter.commerceId)
			.where('company_id', companyId)
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}
}

module.exports = ComClaimBook;
