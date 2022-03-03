'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class User extends baseModel {
	static get tableName() {
		return 'user';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'email', 'password'],
			properties: {
				name: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string'],
				},
				password: {
					type: ['string'],
				},
				done: {
					type: 'boolean',
					default: true,
				},
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
		return ['id', 'name', 'email', 'password', 'done'];
	}

	static getAll() {
		const query = this.query().select(this.defaultColumns());
		return query;
	}
	static getById(id) {
		return this.query().findById(id);
	}
	static findByName($name) {
		return this.query()
			.where('name', $name)
			.first();
	}
	static create(data) {
		return this.query().insert(data);
	}
}
module.exports = User;
