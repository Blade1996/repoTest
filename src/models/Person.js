'use strict';

const helper = require('./helper');
const baseModel = require('./base');
const TypePerson = require('./TypePerson');

class Person extends baseModel {
	static get tableName() {
		return 'ms_person';
	}
	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['documentNumber', 'fullname', 'flagTypePerson'],
			properties: {
				documentNumber: {
					type: 'string',
				},
				fullname: {
					type: 'string',
				},
				flagTypePerson: {
					type: 'integer',
				},
				nationality: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
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

	static get virtualAttributes() {
		return ['typePerson'];
	}

	get typePerson() {
		if (this.flagTypePerson === TypePerson.natural) {
			return 'natural';
		}
		return 'juridica';
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'email',
			'document_number',
			'nationality',
			'flag_type_person',
			'flag_active',
			'fullname',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static match(query, search) {
		query.whereRaw('MATCH(fullname, document_number, nationality, email) AGAINST(?)', [search]);
		return query;
	}

	static getAll(filter = {}, documentNumber) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('document_number', documentNumber);

		if (search) {
			query = this.match(query, search);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getByDocument(documentNumber) {
		return this.query()
			.select(this.defaultColumns())
			.where('document_number', documentNumber)
			.first();
	}

	static edit(id, data, tx) {
		return this.query(tx)
			.patch(data)
			.where('id', id);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getPersonRepeated(id, documentNumber) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.whereNot('id', id)
			.skipUndefined()
			.where('document_number', documentNumber)
			.first();
	}
}

module.exports = Person;
