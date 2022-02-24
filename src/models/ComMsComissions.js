'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class Comissions extends baseModel {
	static get tableName() {
		return 'com_ms_comissions';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [
				'amount',
				'amountWin',
				'reason',
				'period',
				'currency',
				'updatePeriod',
				'dateStart',
				'dateEnd',
			],
			properties: {
				amount: {
					type: 'number',
				},
				amountWin: {
					type: 'number',
				},
				reason: {
					type: 'string',
				},
				period: {
					type: 'integer',
				},
				currency: {
					type: 'string',
				},
				updatePeriod: {
					type: 'date',
				},
				dateStart: {
					type: 'date',
				},
				dateEnd: {
					type: 'date',
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static getAll(filter = {}) {
		let query = this.query().select(
			'amount',
			'amount_win',
			'reason',
			'period',
			'currency',
			'update_period',
			'date_start',
			'date_end',
		);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id) {
		return this.query().findById(id);
	}

	static create(data) {
		return this.query().insert(data);
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

module.exports = Comissions;
