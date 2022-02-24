'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class Courier extends baseModel {
	static get tableName() {
		return 'com_courier';
	}

	static get relationMappings() {
		const relation = {
			typePerson: {
				relation: baseModel.HasOneRelation,
				modelClass: `${__dirname}/MsTypePerson.js`,
				join: {
					from: 'com_courier.type_person_id',
					to: 'ms_type_person.id',
				},
			},
		};
		return relation;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'typePersonId', 'documentNumber'],
			properties: {
				name: {
					type: 'string',
				},
				typePersonId: {
					type: 'integer',
				},
				documentNumber: {
					type: 'string',
				},
				phone: {
					type: ['string', 'null'],
				},
				license: {
					type: ['string', 'null'],
				},
				establishmentCode: {
					type: ['string', 'null'],
				},
				plates: {
					type: ['array', 'null'],
					default: [],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'name',
			'type_person_id',
			'document_number',
			'phone',
			'license',
			'establishment_code',
			'plates',
			'created_at',
		];
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static match(query, search) {
		query.whereRaw('MATCH(name, document_number, phone, establishment_code, license) AGAINST(?)', [
			search,
		]);
		return query;
	}

	static getAll(filter = {}, companyId) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[typePerson(selectColumns)]')
			.where('company_id', companyId);

		if (search) {
			query = this.match(query, search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('company_id', companyId)
			.where('id', id);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('company_id', companyId)
			.where('id', id);
	}
}

module.exports = Courier;
