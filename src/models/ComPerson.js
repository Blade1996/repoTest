'use strict';

const { Model } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');
const TypeEntity = require('./TypeEntity');
const Person = require('./Person');

class ComPerson extends baseModel {
	static get tableName() {
		return 'com_person';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_person.company_id',
					to: 'com_companies.id',
				},
			},
			person: {
				relation: Model.BelongsToOneRelation,
				modelClass: `${__dirname}/Person.js`,
				join: {
					from: 'com_person.person_id',
					to: 'ms_person.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultsPropiertes = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['personId', 'companyId', 'typeEntity'],
			properties: {
				personId: {
					type: 'integer',
				},
				companyId: {
					type: 'integer',
				},
				aclCode: {
					type: ['string', 'null'],
				},
				typeEntity: {
					type: ['integer', 'null'],
				},
				aclId: {
					type: ['integer', 'null'],
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
		return ['typeEntityName'];
	}

	get typeEntityName() {
		let name = '';
		if (this.typeEntity === TypeEntity.employee) {
			name = 'employee';
		} else if (this.typeEntity === TypeEntity.customer) {
			name = 'customer';
		} else if (this.typeEntity === TypeEntity.supplier) {
			name = 'supplier';
		}
		return name;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'person_id',
			'company_id',
			'acl_code',
			'type_entity',
			'acl_id',
			'email',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static getAll(filter = {}, personId, companyId) {
		const query = this.query()
			.select(this.defaultColumns())
			.eager('[company(selectColumns), person(selectColumns)]')
			.skipUndefined()
			.where('person_id', personId)
			.where('company_id', companyId);

		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static create(data, tx) {
		return this.query(tx).insert(data);
	}

	static createMultiple(data, tx) {
		return this.query(tx).insertGraph(data);
	}

	static getById(personId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[company(selectColumns), person(selectColumns)]')
			.where('person_id', personId)
			.where('company_id', companyId)
			.first();
	}

	static getByAclCode(code) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[company(selectColumns), person(selectColumns)]')
			.where('acl_code', code)
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

	static async createPerson(tx, modelEntity, documentNumber, entity, data, companyId) {
		try {
			const dataPerson = await Person.getByDocument(documentNumber);
			let newComPerson;
			if (dataPerson) {
				let flag = false;
				const dataComPerson = await this.getById(dataPerson.id, companyId);
				if (dataComPerson) {
					if (dataComPerson.typeEntity !== entity) {
						flag = true;
					}
				} else {
					flag = true;
				}
				if (flag) {
					newComPerson = await this.create(
						{
							personId: dataPerson.id,
							companyId,
							aclCode: data.code,
							typeEntity: entity,
							aclId: null,
							email: data.email,
						},
						tx,
					);
				}
			} else {
				newComPerson = await this.createMultiple(
					{
						companyId,
						aclCode: data.code,
						typeEntity: entity,
						aclId: null,
						email: data.email,
						person: {
							documentNumber,
							fullname: data.fullname,
							flagTypePerson: data.flagTypePerson,
							nationality: null,
							email: data.email,
						},
					},
					tx,
				);
			}
			newComPerson = newComPerson ? newComPerson.personId : dataPerson.id;
			if (entity === TypeEntity.customer) {
				await modelEntity.edit(data.id, { personId: newComPerson }, companyId, tx);
			} else if (entity === TypeEntity.supplier) {
				await modelEntity.edit(data.id, { personId: newComPerson }, companyId, tx);
			}
			return Promise.resolve(newComPerson);
		} catch (error) {
			return Promise.reject(error);
		}
	}
}

module.exports = ComPerson;
