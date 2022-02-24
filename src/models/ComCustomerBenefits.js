'use strict';

const baseModel = require('./base');
const { transaction } = require('objection');
const helper = require('./helper');
const { isNullOrUndefined } = require('../shared/helper');

class ComCustomerBenefits extends baseModel {
	static get tableName() {
		return 'com_customer_benefits';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['customerId', 'employeeId', 'typeDocument'],
			properties: {
				documentsId: {
					type: ['integer', 'null'],
				},
				customerId: {
					type: 'integer',
				},
				employeeId: {
					type: 'integer',
				},
				typeDocument: {
					type: 'integer',
					default: 1,
				},
				amount: {
					type: ['number', 'null'],
					default: 0,
				},
				dueAmount: {
					type: ['number', 'null'],
					default: 0,
				},
				numbDocuments: {
					type: ['string', 'null'],
				},
				startDate: {
					type: 'date',
				},
				endDate: {
					type: 'date',
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
		let columns = [
			'id',
			'document_id',
			'customer_id',
			'employee_id',
			'subsidiary_id',
			'amount',
			'due_amount',
			'numb_documents',
			'start_date',
			'end_date',
			'company_id',
			'created_at',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get virtualAttributes() {
		return ['amountPending'];
	}

	get amountPending() {
		return this.amount - this.dueAmount;
	}

	static create(data, companyId) {
		const newData = data;
		newData.companyId = companyId;
		const knex = ComCustomerBenefits.knex();
		return transaction(knex, trx => ComCustomerBenefits.query(trx).insertGraph(newData));
	}

	static getByTypeCode(typeCode, companyId, filter = {}) {
		const query = this.query()
			.select('id', 'document_id', 'numb_documents', 'amount', 'due_amount', 'subsidiary_id')
			.where(`${this.tableName}.type_document`, typeCode)
			.skipUndefined()
			.where(`${this.tableName}.customer_id`, filter.customerId)
			.where(`${this.tableName}.company_id`, companyId);
		if (!isNullOrUndefined(filter.code)) {
			query.where(`${this.tableName}.numb_documents`, 'like', `${filter.code}%`);
		}
		return query;
	}

	static getByIds(ids, companyId, customerId, typeCode = 1) {
		return this.query()
			.select('id', 'document_id', 'numb_documents', 'amount', 'due_amount', 'subsidiary_id')
			.where(`${this.tableName}.type_document`, typeCode)
			.where('customer_id', customerId)
			.where('company_id', companyId)
			.whereIn('id', ids);
	}

	static updateMultiple(data, tx) {
		return this.query(tx).upsertGraph(data, {
			noDelete: true,
			unrelate: true,
		});
	}
}

module.exports = ComCustomerBenefits;
