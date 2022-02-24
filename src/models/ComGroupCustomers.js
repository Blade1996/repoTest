'use strict';

const helper = require('./helper');
const baseModel = require('./base');

class ComGroupCustomers extends baseModel {
	static get tableName() {
		return 'com_group_customers';
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['groupId', 'customerId'],
			properties: {
				groupId: {
					type: 'integer',
				},
				customerId: {
					type: 'integer',
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultsPropiertes,
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
		let columns = ['group_id', 'customer_id', 'additional_information', 'created_at'].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', companyId);

		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getById(companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.first();
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}
}

module.exports = ComGroupCustomers;
