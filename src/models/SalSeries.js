'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model, raw } = require('objection');
const { physical, electronic } = require('./TypeBilling');
const MsTypeDocument = require('./MsTypeDocument');
const TypeDevice = require('./enums/TypeDevice');
const country = require('./enums/country-enum');
const {
	configCompanySerie0,
	configCompanySerieP,
	configCompanySerieA,
} = require('../shared/helper');

class SalSeries extends baseModel {
	static get tableName() {
		return 'sal_series';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_series.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'sal_series.sal_terminals_id',
					to: 'sal_terminals.id',
				},
			},
			typeDocument: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeDocument.js`,
				join: {
					from: 'sal_series.sal_type_documents_id',
					to: 'com_ms_type_documents.id',
				},
			},
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/SalSeries.js`,
				join: {
					from: 'sal_series.id',
					to: 'sal_series.notes_type_document_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comSubsidiariesId', 'salTypeDocumentsId', 'number'],
			properties: {
				comSubsidiariesId: {
					type: 'integer',
				},
				salTerminalsId: {
					type: ['integer', 'null'],
				},
				salTypeDocumentsId: {
					type: 'integer',
				},
				serie: {
					type: 'string',
				},
				number: {
					type: 'string',
				},
				flagBillingDefault: {
					type: 'integer',
				},
				description: {
					type: ['string', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				typeBilling: {
					type: ['integer', 'null'],
					default: physical,
				},
				flagSendBilling: {
					type: ['integer', 'boolean', 'null'],
				},
				codeTaxes: {
					type: ['string', 'null'],
				},
				companyTemplateId: {
					type: ['integer', 'null'],
				},
				notesTypeDocumentId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		const columns = [
			'id',
			'serie',
			'number',
			'flag_billing_default',
			'sal_type_documents_id',
			'com_subsidiaries_id',
			'sal_terminals_id',
			'company_id',
			'description',
			'cash_id',
			'type_billing',
			'flag_send_billing',
			'code_taxes',
			'company_template_id',
			'notes_type_document_id',
		].map(c => `${this.tableName}.${c}`);
		return columns.concat(otherColumns);
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return ['availability', 'availabilityTerminalName', 'codePrefix'];
	}

	get availability() {
		const disable = this.terminal && this.terminal.device;
		return !disable;
	}

	get codePrefix() {
		const { qpCode, companyId } = this;
		let prefix = qpCode;
		if (qpCode && companyId) {
			if (this.companyId && configCompanySerie0(this.companyId)) {
				prefix = `${qpCode.substring(0, 1)}0`;
			}
			if (this.comCompanyId && configCompanySerieP(this.comCompanyId)) {
				prefix = `${qpCode.substring(0, 1)}P`;
			}
			if (this.comCompanyId && configCompanySerieA(this.comCompanyId)) {
				prefix = `${qpCode.substring(0, 1)}A`;
			}
		}
		return prefix;
	}

	get availabilityTerminalName() {
		const disable = this.terminal && this.terminal.device;
		const availabilityRaw = disable ? 'deshabilitado' : 'habilitado';
		return `${this.serie} - ${this.terminal && this.terminal.name} - ${availabilityRaw}`;
	}

	static getAll(filter = {}, companyId) {
		const terminalTable = 'sal_terminals';
		let query = this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns).device(selectColumns), typeDocument(documentTypeData)]')
			.select(this.defaultColumns())
			.leftJoin(`${terminalTable}`, `${terminalTable}.id`, `${this.tableName}.sal_terminals_id`)
			.where((builder) => {
				builder
					.where(`${terminalTable}.type_device`, '=', TypeDevice.web)
					.orWhereNull(`${terminalTable}.type_device`);
			})
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.com_subsidiaries_id`, filter.subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.type_billing`, filter.typeBilling)
			.skipUndefined()
			.where(`${this.tableName}.sal_type_documents_id`, filter.typeDocumentId)
			.groupBy(`${this.tableName}.id`);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getById(id, companyId, { terminalId }) {
		return this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns)]')
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId)
			.skipUndefined()
			.where('sal_terminals_id', terminalId);
	}

	static async seriesFound(
		companyId,
		terminalsId,
		subsidiaryId,
		{
			terminalIdOff, serieIdOff, fatherSerieId, countryId, typeDocumentCode, typeDocumentId,
		},
	) {
		if (terminalIdOff && serieIdOff) {
			return this.getById(serieIdOff, companyId, { terminalId: terminalIdOff });
		}
		const series = await this.getByDefaultBilling(
			terminalsId,
			subsidiaryId,
			typeDocumentId,
			companyId,
			fatherSerieId,
		);
		if (countryId === country.ecuador && typeDocumentCode === 'FAC') {
			return series.find(s => s.typeBilling === electronic);
		}
		return series.find(s => s.flagSendBilling) || (series.length > 0 && series[0]);
	}

	static getUserTerminal(
		terminalId,
		subsidiaryId,
		typeDocumentId,
		companyId,
		fatherSerieId,
		typeBilling,
	) {
		return this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns)]')
			.select(this.defaultColumns())
			.where('com_subsidiaries_id', subsidiaryId)
			.where('sal_terminals_id', terminalId)
			.where('sal_type_documents_id', typeDocumentId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('notes_type_document_id', fatherSerieId)
			.skipUndefined()
			.where('type_billing', typeBilling)
			.first();
	}

	static getByDefaultBilling(terminalId, subsidiaryId, typeDocumentId, companyId, fatherSerieId) {
		return this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns)]')
			.select(this.defaultColumns())
			.where('com_subsidiaries_id', subsidiaryId)
			.where('sal_terminals_id', terminalId)
			.where('sal_type_documents_id', typeDocumentId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('notes_type_document_id', fatherSerieId);
	}

	static getByCompanyTypeDocument(companyId, typeDocumentId, id) {
		return this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns)]')
			.select(this.defaultColumns())
			.where('sal_type_documents_id', typeDocumentId)
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', id)
			.first();
	}

	static create(data, trx) {
		return this.query(trx).insert(data);
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static getByCash(cashId, companyId) {
		const typeDocument = 'com_ms_type_documents';
		return this.query()
			.select(this.defaultColumns())
			.innerJoin(typeDocument, `${typeDocument}.id`, `${this.tableName}.sal_type_documents_id`)
			.where(`${typeDocument}.code`, 'RC')
			.where('cash_id', cashId)
			.where('company_id', companyId)
			.first();
	}

	static editNumberById(id, companyId) {
		return this.query()
			.patchAndFetchById(id, { number: raw('number+??', [1]) })
			.where('company_id', companyId);
	}

	static createEdit(data, options, trx) {
		return this.query(trx).upsertGraph(data, options);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static async updateNumber(id) {
		const serie = await this.query()
			.select('id', 'serie', 'number')
			.where('id', id)
			.first();
		const nextNumber = Number(serie.number) + 1;
		await serie.$query().patch({ number: String(nextNumber) });
		return nextNumber;
	}

	static withTypeDocuments(companyId, subsidiaryId, terminalId) {
		const typeDocumentTable = 'sal_type_documents';
		const terminalTable = 'sal_terminals';
		const msTypeDocumentTable = 'com_ms_type_documents';
		const msTypeDocumentColumns = [
			'name',
			'code',
			'qp_code',
			'description AS descriptionTypeDocument',
		]
			.map(c => `${msTypeDocumentTable}.${c}`)
			.concat([
				`${terminalTable}.sunat_code`,
				`${terminalTable}.print_code`,
				raw('com_ms_type_documents.code_taxes as codeTaxesTypeDocument'),
			]);
		return this.query()
			.select(this.defaultColumns(msTypeDocumentColumns))
			.join(
				typeDocumentTable,
				`${typeDocumentTable}.com_type_document_id`,
				`${this.tableName}.sal_type_documents_id`,
			)
			.join(
				msTypeDocumentTable,
				`${msTypeDocumentTable}.id`,
				`${typeDocumentTable}.com_type_document_id`,
			)
			.join(terminalTable, `${terminalTable}.id`, `${this.tableName}.sal_terminals_id`)
			.skipUndefined()
			.where(`${this.tableName}.com_subsidiaries_id`, subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.sal_terminals_id`, terminalId)
			.whereNull(`${typeDocumentTable}.deleted_at`)
			.whereNull(`${msTypeDocumentTable}.deleted_at`)
			.where(`${this.tableName}.company_id`, companyId)
			.where(`${typeDocumentTable}.com_company_id`, companyId);
	}

	static getBySubsidiaryTerminal({
		companyId,
		comSubsidiariesId,
		salTerminalsId,
		salTypeDocumentsId,
	}) {
		return this.query()
			.eager('[terminal(selectColumns), subsidiary(selectColumns)]')
			.select(this.defaultColumns())
			.where(`${SalSeries.tableName}.com_subsidiaries_id`, comSubsidiariesId)
			.where(`${SalSeries.tableName}.sal_terminals_id`, salTerminalsId)
			.where(`${SalSeries.tableName}.sal_type_documents_id`, salTypeDocumentsId)
			.where(`${SalSeries.tableName}.company_id`, companyId)
			.first();
	}

	static getByCashId(cashId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('cash_id', cashId)
			.first();
	}

	static editNumber(id, companyId, trx) {
		return this.query(trx)
			.patchAndFetchById(id, { number: raw('number+??', [1]) })
			.where('company_id', companyId);
	}

	static getBySubsidiaryElectronic(subsidiaryId, companyId) {
		return this.query()
			.where(`${SalSeries.tableName}.com_subsidiaries_id`, subsidiaryId)
			.where(`${SalSeries.tableName}.company_id`, companyId)
			.where(`${SalSeries.tableName}.type_billing`, electronic)
			.first();
	}

	static getSerieEcommerce(companyId, { typeDocumentId, commerceId }) {
		return this.query()
			.where(`${SalSeries.tableName}.company_id`, companyId)
			.where(`${SalSeries.tableName}.sal_type_documents_id`, typeDocumentId)
			.innerJoin('sal_terminals', 'sal_terminals.id', `${SalSeries.tableName}.sal_terminals_id`)
			.where('sal_terminals.sal_type_terminals_id', 2)
			.skipUndefined()
			.where('sal_terminals.commerce_id', commerceId)
			.first();
	}

	static async buildSeries(data, typeDocumetsCode) {
		const typedocuments = await MsTypeDocument.getByCodes(data.countryId, typeDocumetsCode);
		return typedocuments.map((typeDoc, i) => ({
			comSubsidiariesId: data.subsidiaryId,
			serie: `0${i + 1}`,
			number: '0',
			typeBilling: electronic,
			salTypeDocumentsId: typeDoc.id,
			companyId: data.companyId,
		}));
	}

	static getByMsTypeDocument(msTypeDocumentCode, flagyType, terminalId, companyId) {
		const typeDocumentTable = 'sal_type_documents';
		const msTypeDocumentTable = 'com_ms_type_documents';
		return this.query()
			.where(`${SalSeries.tableName}.company_id`, companyId)
			.where(`${SalSeries.tableName}.sal_terminals_id`, terminalId)
			.join(
				typeDocumentTable,
				`${typeDocumentTable}.com_type_document_id`,
				`${this.tableName}.sal_type_documents_id`,
			)
			.join(
				msTypeDocumentTable,
				`${msTypeDocumentTable}.id`,
				`${typeDocumentTable}.com_type_document_id`,
			)
			.where(`${msTypeDocumentTable}.code`, msTypeDocumentCode)
			.where(`${msTypeDocumentTable}.flag_type`, flagyType)
			.first();
	}

	static getSerieEcommerces(companyId, { typeDocumentId, commerceIds }) {
		return this.query()
			.select(this.defaultColumns('com_ecommerce_company.code as commerceCode'))
			.where(`${SalSeries.tableName}.company_id`, companyId)
			.where(`${SalSeries.tableName}.sal_type_documents_id`, typeDocumentId)
			.innerJoin('sal_terminals', 'sal_terminals.id', `${SalSeries.tableName}.sal_terminals_id`)
			.innerJoin('com_ecommerce_company', 'com_ecommerce_company.id', 'sal_terminals.commerce_id')
			.where('sal_terminals.sal_type_terminals_id', 2)
			.skipUndefined()
			.whereIn('sal_terminals.commerce_id', commerceIds);
	}

	static async getAllSeriesCompaniesCrom(companyId, subsidiaryId, terminalId) {
		const query = this.query()
			.select(this.defaultColumns())
			.whereIn(`${this.tableName}.sal_type_documents_id`, [1, 3])
			.where('sal_series.company_id', companyId)
			.where('sal_series.com_subsidiaries_id', subsidiaryId)
			.where('sal_series.sal_terminals_id', terminalId)
			.groupBy(`${this.tableName}.id`);
		return query;
	}

	static updateMultiple(data) {
		const options = {
			noDelete: true,
			noInsert: true,
		};
		return this.query().upsertGraph(data, options);
	}
}

module.exports = SalSeries;
