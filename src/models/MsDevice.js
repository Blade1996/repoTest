'use strict';

const { raw } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const { movil } = require('./enums/TypeDevice');
const { connected } = require('./enums/state-conexion-devices-enums');

class MsDevice extends baseModel {
	static get tableName() {
		return 'ms_devices';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['codeDevice', 'codeApp'],
			properties: {
				codeDevice: {
					type: 'string',
				},
				codeApp: {
					type: 'string',
				},
				userId: {
					type: ['integer', 'null'],
				},
				typeEntityId: {
					type: ['integer', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				token: {
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

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'name',
			'user_id',
			'type_entity_id',
			'code_device',
			'code_app',
			'token',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static async create(data) {
		const newData = data;
		const deviceFound = await this.getByUser(data.userId, data.typeEntityId, data.codeApp, false);
		if (deviceFound) {
			await this.edit(data);
			newData.id = deviceFound.id;
			return newData;
		}
		return this.query().insert(data);
	}

	static getById(id) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id);
	}

	static getByCodeDevice(codeDevice, codeApp) {
		return this.query()
			.select(this.defaultColumns())
			.where('code_device', codeDevice)
			.where('code_app', codeApp)
			.first();
	}

	static edit(data) {
		return this.query()
			.patch(data)
			.where('user_id', data.userId)
			.where('code_app', data.codeApp);
	}

	static editToken(data, { token }) {
		return this.query()
			.patch({ token })
			.where('user_id', data.userId)
			.where('type_entity_id', data.typeEntityId)
			.where('code_app', data.codeApp);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getByUser(userId, typeEntityId, codeApp, notToken = true) {
		const query = this.query()
			.select(this.defaultColumns())
			.where('user_id', userId)
			.where('type_entity_id', typeEntityId)
			.skipUndefined()
			.where('code_app', codeApp)
			.first();
		if (notToken) {
			query.whereNotNull('token');
		}
		return query;
	}
	static getByUserRandom(
		typeEntityId,
		companyId,
		notifyRandomDealer,
		typeConexion = movil,
		codeApp,
	) {
		const query = this.query()
			.select(this.defaultColumns())
			.join('com_devices', 'com_devices.code_device', `${this.tableName}.code_device`)
			.whereRaw(`com_devices.employee_id = ${this.tableName}.user_id`)
			.where(`${this.tableName}.type_entity_id`, typeEntityId)
			.where('com_devices.type_conexion', typeConexion)
			.where('com_devices.state_conexion', connected)
			.where('com_devices.company_id', companyId)
			.skipUndefined()
			.where(`${this.tableName}.code_app`, codeApp)
			.whereNotNull(`${this.tableName}.token`)
			.whereNull('com_devices.deleted_at');
		if (notifyRandomDealer) {
			query.groupBy(raw('RAND()')).limit(notifyRandomDealer);
		}
		return query;
	}

	static getByUsers({
		userIds,
		notifyRandomDealer,
		typeEntityId,
		typeConexion = movil,
		companyId,
		codeApp,
	}) {
		const query = this.query()
			.select(this.defaultColumns())
			.join('com_devices', 'com_devices.code_device', `${this.tableName}.code_device`)
			.whereIn(`${this.tableName}.user_id`, userIds)
			.where(`${this.tableName}.type_entity_id`, typeEntityId)
			.where('com_devices.type_conexion', typeConexion)
			.where('com_devices.state_conexion', connected)
			.where('com_devices.company_id', companyId)
			.skipUndefined()
			.where(`${this.tableName}.code_app`, codeApp)
			.whereNotNull(`${this.tableName}.token`);
		if (notifyRandomDealer) {
			query.limit(notifyRandomDealer);
		}
		return query;
	}
}

module.exports = MsDevice;
