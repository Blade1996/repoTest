'use strict';

const { transaction } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class TerminalUser extends baseModel {
	static get tableName() {
		return 'com_terminal_users';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['terminalId', 'userId'],
			properties: {
				terminalId: {
					type: 'integer',
				},
				userId: {
					type: 'integer',
				},
				flagDefault: {
					type: ['boolean', 'null'],
				},
				name: {
					type: ['string', 'null'],
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

	static defaultColumns() {
		return ['id', 'terminal_id', 'name', 'user_id', 'flag_default'];
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.select(this.defaultColumns())
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.terminal_id`, filter.terminalId)
			.skipUndefined()
			.where(`${this.tableName}.user_id`, filter.userId);

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
	}

	static createMultiple(data, trx) {
		return this.query(trx).insertGraph(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static removePhysicallyByIds(terminalIds, companyId, trx) {
		return this.query(trx)
			.delete()
			.whereIn(`${this.tableName}.terminal_id`, terminalIds)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static getByUser(userId, companyId) {
		const deviceTable = 'com_devices';
		const terminalTable = 'sal_terminals';
		return this.query()
			.select(
				`${this.tableName}.id`,
				`${deviceTable}.warehouse_name`,
				`${deviceTable}.user_name`,
				`${deviceTable}.state_conexion`,
				`${deviceTable}.type_conexion`,
				`${deviceTable}.in_date`,
				`${terminalTable}.name AS terminalName`,
			)
			.join(deviceTable, `${this.tableName}.terminal_id`, `${deviceTable}.terminal_id`)
			.join(terminalTable, `${this.tableName}.terminal_id`, `${terminalTable}.id`)
			.where(`${this.tableName}.user_id`, userId)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static validByUser(userId, terminalId, companyId) {
		return this.query()
			.where(`${this.tableName}.flag_active`, 1)
			.where(`${this.tableName}.user_id`, userId)
			.where(`${this.tableName}.terminal_id`, terminalId)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static removeByTerminal(terminalId, companyId, trx) {
		return this.query(trx)
			.delete()
			.where(`${this.tableName}.terminal_id`, terminalId)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static updateUser(terminalId, data, companyId) {
		const knex = TerminalUser.knex();
		return transaction(knex, async (trx) => {
			await this.removeByTerminal(terminalId, companyId, trx);
			const created = await this.createMultiple(data, trx);
			return created;
		});
	}

	static removeByUser(userId, companyId, trx) {
		return this.query(trx)
			.delete()
			.where(`${this.tableName}.user_id`, userId)
			.where(`${this.tableName}.company_id`, companyId);
	}

	static async updateByTerminals(userId, terminalIds, companyId, trx) {
		await this.removeByUser(userId, companyId, trx);
		const created = await this.createMultiple(terminalIds, trx);
		return created;
	}

	static buildAndCreate(userId, terminal, companyId, trx) {
		const terminalUser = {
			userId,
			terminalId: terminal.id,
			name: terminal.name,
			companyId,
		};
		return this.create(terminalUser, trx);
	}
}

module.exports = TerminalUser;
