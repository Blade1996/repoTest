'use strict';

const { ballotSunat, unsubscribeSunat } = require('./enums/type-summary-enums');
const { Model, ref, transaction } = require('objection');
const Customer = require('./Customer');
const baseModel = require('./base');
const helper = require('./helper');
const Sales = require('./Sales');

class DocumentsSummaries extends baseModel {
	static get tableName() {
		return 'com_documents_summaries';
	}

	static get relationMappings() {
		return {
			relatedDocuments: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					to: ref('com_documents_summaries.documents_related').castTo(Array),
					from: 'sal_documents.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_documents_summaries.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: [
				'documentsRelated',
				'numericalIdentification',
				'currency',
				'comEmployeeId',
				'comSubsidiariesId',
			],
			properties: {
				documentsRelated: {
					type: 'array',
				},
				typeSummary: {
					type: 'integer',
					default: ballotSunat,
				},
				numericalIdentification: {
					type: 'string',
				},
				currency: {
					type: ['string', 'null'],
				},
				comEmployeeId: {
					type: 'integer',
				},
				comSubsidiariesId: {
					type: 'integer',
				},
				emissionDate: {
					type: ['string', 'null'],
				},
				commentary: {
					type: ['string', 'null'],
				},
				statusTax: {
					type: ['integer', 'null'],
				},
				sunatError: {
					type: ['string', 'null'],
				},
				sendingState: {
					type: ['integer', 'null'],
				},
				subsidiaryRzSocial: {
					type: ['string', 'null'],
				},
				subsidiaryAddress: {
					type: ['string', 'null'],
				},
				subsidiaryName: {
					type: ['string', 'null'],
				},
				subsidiaryRuc: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['statusTaxName'];
	}

	get statusTaxName() {
		let data = {};
		switch (this.statusTax) {
		case 1:
			data = { name: 'sin enviar', color: 'black', showDetails: false };
			break;
		case 2:
			data = { name: 'en proceso', color: 'yellow darken-2', showDetails: false };
			break;
		case 3:
			data = { name: 'validado', color: 'green', showDetails: true };
			break;
		case 4:
			data = { name: 'error', color: 'red', showDetails: true };
			break;
		case 5:
			data = { name: 'firmado', color: 'purple', showDetails: true };
			break;
		case 6:
			data = { name: 'error al firmar', color: 'red', showDetails: true };
			break;
		default:
			break;
		}
		return data;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns() {
		return [
			'id',
			'documents_related',
			'type_summary',
			'flag_cancel_documents',
			'numerical_identification',
			'emission_date',
			'currency',
			'commentary',
			'status_tax',
			'sunat_error',
			'sending_state',
			'com_employee_id',
			'com_subsidiaries_id',
			'subsidiary_rz_social',
			'subsidiary_address',
			'subsidiary_name',
			'subsidiary_ruc',
			'created_at',
		];
	}

	static getAll(companyId, typeSummary, filter = {}) {
		let query = this.query()
			.eager('[relatedDocuments(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where((builder) => {
				builder.where('type_summary', typeSummary).orWhere('flag_cancel_documents', 1);
			})
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiaryId)
			.where('company_id', companyId);

		if (typeSummary === unsubscribeSunat) {
			query.where((builder) => {
				builder.where('type_summary', typeSummary).orWhere('flag_cancel_documents', 1);
			});
		} else {
			query.where('type_summary', typeSummary);
		}
		if (filter.flagCancelDocuments === false) {
			query.where('flag_cancel_documents', 0);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getDocumentBySubsidiary(companyId, typeSummary, filter = {}) {
		const query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('type_summary', typeSummary)
			.skipUndefined()
			.where('currency', filter.currency)
			.skipUndefined()
			.where('status_tax', filter.statusTax)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('flag_cancel_documents', filter.flagCancelDocuments)
			.skipUndefined()
			.where('emission_date', filter.emissionDate)
			.where('company_id', companyId)
			.first();
		return query;
	}

	static create(data, flagCancelDocuments = false) {
		try {
			let response = null;
			const newData = { ...data };
			const knex = DocumentsSummaries.knex();
			delete newData.cashId;
			const saleResulTx = transaction(knex, () =>
				this.query()
					.insert(newData)
					.then((documentsRelated) => {
						response = { ...documentsRelated, flagCancelDocuments };
						return Sales.updateSummaryDocuments(response);
					})
					.then(() => response));

			return Promise.resolve(saleResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static update(id, data, flagCancelDocuments = false) {
		try {
			const knex = DocumentsSummaries.knex();
			const newData = { ...data };
			delete newData.cashId;
			const saleResulTx = transaction(knex, () =>
				this.query()
					.patchAndFetchById(id, newData)
					.then((documentsRelated) => {
						const response = documentsRelated;
						response.flagCancelDocuments = flagCancelDocuments;
						return Sales.updateSummaryDocuments(response);
					})
					.then(() => null));

			return Promise.resolve(saleResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getById(id, companyId, typeSummary = undefined) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.skipUndefined()
			.where('type_summary', typeSummary)
			.where('company_id', companyId);
	}

	static getByIds(ids, companyId, typeSummary = undefined) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.skipUndefined()
			.where('type_summary', typeSummary)
			.where('company_id', companyId);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static getListFacturacion(companyId, typeSummary, filter = {}) {
		let query = this.query()
			.eager('[subsidiary(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId);

		if (filter.ids) {
			query.whereIn('id', filter.ids);
		}

		if (typeSummary === unsubscribeSunat) {
			query.where((builder) => {
				builder.where('type_summary', typeSummary).orWhere('flag_cancel_documents', 1);
			});
		} else {
			query.where('type_summary', typeSummary);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static updateStatusTax(
		id,
		companyId,
		status,
		messageError,
		typeSummary,
		authorization = null,
		authorizationDate = null,
	) {
		const knex = DocumentsSummaries.knex();
		return transaction(knex, () =>
			this.query()
				.patchAndFetchById(id, { statusTax: status, sunatError: messageError, sendingState: 4 })
				.where('type_summary', typeSummary)
				.where('company_id', companyId)
				.then((documentsRelated) => {
					const response = { ...documentsRelated };
					response.typeSummary = typeSummary;
					response.authorization = authorization;
					response.authorizationDate = authorizationDate;
					return Sales.updateSummaryDocuments(response, status, Customer);
				}));
	}

	static removeDocumentsByIds(id, data, companyId) {
		const dataNew = { ...data };
		delete dataNew.documentsRelatedIds;
		delete dataNew.documentsRemove;
		const knex = DocumentsSummaries.knex();
		return transaction(knex, () =>
			this.query()
				.patch(dataNew)
				.where('id', id)
				.where('company_id', companyId)
				.then(() =>
					Sales.updateSummaryRelated(companyId, {
						ids: data.documentsRemove,
						data: { ballotSummaryId: null },
					})));
	}
}

module.exports = DocumentsSummaries;
