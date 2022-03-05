'use strict';

const baseModel = require('./base');

class Categories extends baseModel {
	static get tableName() {
		return 'categories';
	}

	static get jsonSchema() {
		const schema = {
			type: 'object',
			required: ['name'],
			properties: {
				name: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				done: {
					type: 'boolean',
					default: false,
				},
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'description', 'done'];
	}

	static getAll() {
		const query = this.query().select(['name', 'description', 'done']);
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

module.exports = Categories;
