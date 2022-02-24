'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const status = require('./TableStatus');

class Table extends baseModel {
	static get tableName() {
		return 'sal_tables';
	}

	static get virtualAttributes() {
		return ['statusName'];
	}

	get statusName() {
		return this.status === 1 ? 'Libre' : 'Ocupado';
	}

	static defaultColumns() {
		return [
			'id',
			'name',
			'code',
			'number',
			'status',
			'chairs',
			'position',
			'position_y',
			'flag_active',
			'created_at',
			'updated_at',
		];
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['code', 'companyId'],
			properties: {
				name: {
					type: 'string',
				},
				code: {
					type: 'string',
				},
				number: {
					type: 'string',
				},
				status: {
					type: 'integer',
				},
				companyId: {
					type: 'integer',
				},
				chairs: {
					type: 'integer',
				},
				position: {
					type: 'decimal',
				},
				positionY: {
					type: 'decimal',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static create(data) {
		const newData = data;
		newData.status = status.free;
		return this.query().insert(newData);
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static editStatus(id, companyId) {
		return this.query()
			.patch({ status: status.occupied })
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = Table;
