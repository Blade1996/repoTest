'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { transaction } = require('objection');

class ComHierarchy extends baseModel {
	static get tableName() {
		return 'com_hierarchy_sellers';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			properties: {
				code: {
					type: ['string', 'null'],
				},
				supervisorId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns(columns = []) {
		return ['id', 'code', 'supervisor_id', 'employee_id'].concat(columns);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getBySupervisor(ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('supervisor_id', ids)
			.orderBy('supervisor_id');
	}

	static removeByComHierarchy(supervisorId, employeeId, companyId, trx) {
		return this.query(trx)
			.delete()
			.where(`${this.tableName}.supervisor_id`, supervisorId)
			.where(`${this.tableName}.employee_id`, employeeId)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static createMultiple(data, trx) {
		return this.query(trx).insertGraph(data);
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

	static removeMultiple(ids) {
		return this.query()
			.patch({ flagActive: false, deletedAt: helper.localDate(new Date()) })
			.whereIn('id', ids);
	}

	static async updateByComHierarchy(data) {
		try {
			const knex = ComHierarchy.knex();
			return transaction(knex, async (trx) => {
				const promises = [];
				data.forEach((item) => {
					promises.push(ComHierarchy.removeByComHierarchy(
						item.supervisorId,
						item.employeeId,
						item.companyId,
						trx,
					));
				});
				Promise.all(promises);
				const created = await this.createMultiple(data, trx);
				return created;
			});
		} catch (error) {
			return Promise.reject();
		}
	}

	static getEmployeeIdMultiple(employeeId, supervisorIds, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('employee_id', employeeId)
			.where('flag_active', 1)
			.whereIn('supervisor_id', supervisorIds);
	}
}
module.exports = ComHierarchy;
