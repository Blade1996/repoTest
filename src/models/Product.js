'use strict';
const baseModel = require('./base');

class Product extends baseModel {
	static get tableName() {
		return 'product';
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
                quantity: {
					type: ['int'],
				},
			},
		};
		return schema;
	}

	static defaultColumns() {
		return ['id', 'name', 'description', 'quantity'];
	}

	static getAll() {
		const query = this.query().select(['name', 'description', 'quantity']);
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

module.exports = Product;