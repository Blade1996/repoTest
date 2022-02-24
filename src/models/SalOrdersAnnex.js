'use strict';

const helper = require('./helper');
const baseModel = require('./base');
const SalOrders = require('./SalOrders');
const TypeGeneral = require('./TypeGeneral');
const { Model, transaction } = require('objection');
const AnnexState = require('./enums/purchase-annex-enum.js');

class SalOrdersAnnex extends baseModel {
	static get tableName() {
		return 'sal_orders_annex';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_orders_annex.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
			groupClient: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.group },
				join: {
					from: 'com_general.id',
					to: 'sal_orders_annex.group_client_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['name', 'status'],
			properties: {
				name: {
					type: 'string',
				},
				status: {
					type: ['integer', 'null'],
				},
				comEmployeesId: {
					type: 'integer',
				},
				companyId: {
					type: 'integer',
				},
				documentsRelated: {
					type: ['object', 'null'],
					default: {},
				},
				summary: {
					type: ['object', 'null'],
					default: {},
				},
				description: {
					type: ['string', 'null'],
				},
				amount: {
					type: 'decimal',
				},
				minAmount: {
					type: ['integer', 'null'],
					default: 0,
				},
				maxAmount: {
					type: ['integer', 'null'],
					default: 0,
				},
				totalProcessed: {
					type: ['integer', 'null'],
					default: 0,
				},
				totalRegistered: {
					type: ['integer', 'null'],
					default: 0,
				},
				totalDocuments: {
					type: ['integer', 'null'],
					default: 0,
				},
				totalError: {
					type: ['integer', 'null'],
					default: 0,
				},
				groupClientId: {
					type: ['integer', 'null'],
				},
				serieId: {
					type: 'integer',
				},
				terminalId: {
					type: 'integer',
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
			'date_operation',
			'amount',
			'min_amount',
			'max_amount',
			'description',
			'total_documents',
			'total_processed',
			'total_registered',
			'total_error',
			'documents_related',
			'summary',
			'status',
			'terminal_id',
			'serie_id',
			'com_subsidiaries_id',
			'com_employee_id',
			'group_client_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get virtualAttributes() {
		return ['statusName'];
	}

	get statusName() {
		let data = {};
		switch (Number(this.status)) {
		case AnnexState.pending:
			data = { name: 'Pendiente', color: 'purple' };
			break;
		case AnnexState.finalized:
			data = { name: 'Finalizado', color: 'green' };
			break;
		case AnnexState.processing:
			data = { name: 'En proceso', color: 'blue' };
			break;
		default:
			break;
		}
		return data;
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('[groupClient(basicColumns)]')
			.where('company_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiariesId);

		if (filter.dateOperation) {
			query.whereRaw(`DATE(${this.tableName}.date_operation) = ?`, filter.dateOperation);
		}

		if (filter.search) {
			const fields = ['name', 'description'].map(i => `${this.tableName}.${i}`);
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}

		query.orderBy(`${this.tableName}.id`, 'desc');
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findById(id, companyId) {
		return this.query()
			.findById(id)
			.where('company_id', companyId);
	}

	static create(data, companyId) {
		const newData = { ...data };
		const knex = SalOrdersAnnex.knex();
		return transaction(knex, () =>
			this.query()
				.insert(newData)
				.then((documentAnnex) => {
					newData.id = documentAnnex.id;
					return SalOrders.editMultiple(
						documentAnnex.documentsRelated.orderIds,
						{ orderAnnexId: documentAnnex.id },
						companyId,
					);
				})
				.then(() => newData));
	}

	static updateSimple(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}
}

module.exports = SalOrdersAnnex;
