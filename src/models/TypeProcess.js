'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class TypeProcess extends baseModel {
	static get tableName() {
		return 'type_process';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['code', 'name'],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				settings: {
					type: ['object', 'null'],
					default: {},
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
		return ['id', 'code', 'name', 'settings', 'flag_active'].concat(columns);
	}

	static getAll(filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('code', filter.code);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getByMigration({ code = 'MIG' }) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('flag_active', 1)
			.first();
	}

	static async updateNextMigration({
		settings,
		companyId,
		id,
		status,
		scriptEjecute,
		bdNextScript,
		ejecuteNextScript,
	}) {
		let newSettings = { ...settings };
		if (status === 0) {
			newSettings[companyId].bdNextScript = bdNextScript;
			newSettings[companyId].scriptEjecute = scriptEjecute;
			newSettings[companyId].ejecuteNextScript = ejecuteNextScript;
		} else {
			const { settings: settingsAux } = await this.getByMigration({});
			newSettings = { ...settingsAux };
		}
		newSettings[companyId].status = status;
		return this.query()
			.patch({ settings: newSettings })
			.where('id', id);
	}
}

module.exports = TypeProcess;
