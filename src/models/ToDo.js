'use strict';

const baseModel = require('./base');

class ToDo extends baseModel {
	static get tableName() {
		return 'to_do';
	}

	static get jsonSchema() {
		const schema = {
			type: 'object',
			required: ['activity'],
			properties: {
				activity: {
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
		return ['id', 'activity', 'done'];
	}

	static getAll() {
		const query = this.query().select(['activity', 'done']);
		return query;
	}

	static getActById(id) {
		return this.query().where('id', id).first();
	}

	static findByName($name) {
		return this.query().where('activity', $name).first();
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(data, id) {
		return this.query().patch(data).where('id', id);
	}

	static remove(id) {
		return this.query().softDelete().where('id', id);
	}
}

module.exports = ToDo;
