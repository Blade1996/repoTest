'use strict';

const baseModel = require('./base');

class User extends baseModel {
	static get tableName() {
		return 'user';
	}

	static get jsonSchema() {
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: ['string'],
				},
				email: {
					type: ['string'],
				},
				password: {
					type: ['string'],
				},
				status: {
					type: 'boolean',
					default: true,
				},
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'email', 'password', 'status'];
	}

	static getAll() {
		const query = this.query().select(['name', 'email', 'password', 'status']);
		return query;
	}

	static getActById(id) {
		return this.query().where('id', id).first();
	}

	static findByName($name) {
		return this.query().where('name', $name).first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(data, id) {
		return this.query.patch(data).where('id', id);
	}

	static remove(id) {
		return this.query().deleteById(id);
	}
}

module.exports = User;
