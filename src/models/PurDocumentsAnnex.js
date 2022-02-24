'use strict';

const Aws = require('./Aws');
const helper = require('./helper');
const baseModel = require('./base');
const ComFiles = require('./ComFiles');
const { purchases } = require('./ModuleCode');
const { isNullOrUndefined } = require('util');
const MsTypeTransaction = require('./MsTypeTransaction');
const { Model, transaction, raw } = require('objection');
const ParserXml = require('./../shared/helperParserXml');
const PurchaseAnnex = require('./enums/purchase-annex-enum.js');
const DocumentAccountStatus = require('./DocumentAccountStatus');
const PurDocumentsAnnexDetails = require('./PurDocumentsAnnexDetails');
const format = require('date-fns/format');

class PurDocumentsAnnex extends baseModel {
	static get tableName() {
		return 'pur_documents_annex';
	}

	static get relationMappings() {
		return {
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'pur_documents_annex.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
			files: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/ComFiles.js`,
				join: {
					from: 'pur_documents_annex.id',
					to: 'com_files.pur_document_annex_id',
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
			'date_start',
			'date_end',
			'description',
			'total_documents',
			'total_processed',
			'total_registered',
			'total_error',
			'documents_related',
			'summary',
			'status',
			'com_subsidiaries_id',
			'com_employee_id',
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
		case PurchaseAnnex.pending:
			data = { name: 'Pendiente', color: 'purple' };
			break;
		case PurchaseAnnex.finalized:
			data = { name: 'Finalizado', color: 'green' };
			break;
		case PurchaseAnnex.processing:
			data = { name: 'En proceso', color: 'blue' };
			break;
		default:
			break;
		}
		return data;
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.eager('[subsidiary(selectColumns), files(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiariesId);

		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.date_start) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.date_end) <= ?`, filter.endDate);
		}

		if (filter.search) {
			const fields = ['name', 'description', 'inline_additional'].map(i => `${this.tableName}.${i}`);
			const value = `%${filter.search}%`;
			query.where((builder) => {
				fields.forEach((field) => {
					builder.orWhere(`${field}`, 'like', value);
				});
			});
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findByFilters(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiariesId);
		if (filter.startDate && filter.endDate) {
			query.whereRaw(`DATE(${this.tableName}.date_start) >= ?`, filter.startDate);
			query.whereRaw(`DATE(${this.tableName}.date_end) <= ?`, filter.endDate);
		}
		query = query.first();
		return query;
	}

	static findById(id, companyId) {
		return this.query()
			.findById(id)
			.where('company_id', companyId);
	}

	static updateSimple(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static create(data) {
		const newData = { ...data };
		const knex = PurDocumentsAnnex.knex();
		delete newData.documentsRelated;
		delete newData.fileTxtPurchase;
		delete newData.nameArchive;
		let documentAnnex;
		return transaction(knex, () =>
			this.query()
				.insert(newData)
				.then((fileDocuments) => {
					documentAnnex = fileDocuments;
					newData.id = fileDocuments.id;
					const dataFile = {
						purDocumentAnnexId: fileDocuments.id,
						codeTable: 'PUR_ANNEX',
						urlFile: data.fileTxtPurchase,
						description: `${data.nameArchive}`,
						companyId: data.companyId,
						registerId: null,
					};
					return ComFiles.create(dataFile);
				})
				.then(() => {
					newData.id = documentAnnex.id;
					const dataFile = data.documentsRelated.map((item) => {
						const acumNew = { ...item };
						acumNew.purDocumentAnnexId = documentAnnex.id;
						return acumNew;
					});
					return PurDocumentsAnnexDetails.createMultiple(dataFile, {
						unrelate: false,
					});
				})
				.then(() => newData));
	}

	static edit(id, data) {
		const newData = { ...data };
		const knex = PurDocumentsAnnex.knex();
		delete newData.documentsRelated;
		delete newData.fileTxtPurchase;
		delete newData.id;
		delete newData.nameArchive;
		return transaction(knex, () =>
			this.query()
				.patch(newData)
				.where('id', id)
				.then(() => {
					const dataFile = {
						purDocumentAnnexId: data.id,
						codeTable: 'PUR_ANNEX',
						urlFile: data.fileTxtPurchase,
						description: `${data.nameArchive}`,
						companyId: data.companyId,
						registerId: null,
					};
					return ComFiles.create(dataFile);
				})
				.then(() => PurDocumentsAnnexDetails.getByAnnexId(data.companyId, id))
				.then((annexDetails) => {
					const dataFile = data.documentsRelated.reduce((acum, item) => {
						const newAcum = [...acum];
						const newItem = { ...item };
						const annexDetail = annexDetails.find(i => i.accessKey === newItem.accessKey);
						if (annexDetail) {
							newItem.id = annexDetail.id;
							newItem.detailsErrors = 'New Register';
							newAcum.push(newItem);
						}
						newAcum.push(newItem);
						return newAcum;
					}, []);
					return PurDocumentsAnnexDetails.createMultiple(dataFile);
				})
				.then(() => data));
	}

	static async updateDocumentAnnex(id, data, companyId, documentsRelated) {
		try {
			const purDocumentResulTx = await transaction(
				PurDocumentsAnnex,
				PurDocumentsAnnexDetails,
				async (DocumentsAnnexTx, AnnexDetailsTx) => {
					const { relatedId, detailsErrors, infoData } = documentsRelated;

					const annexDetails = await AnnexDetailsTx.getByAccessKey(relatedId, companyId);
					if (!isNullOrUndefined(annexDetails)) {
						const newData = detailsErrors || 'New Register';
						await AnnexDetailsTx.edit(annexDetails.id, {
							detailsErrors: newData,
						});
					} else {
						const dataFile = {
							purDocumentAnnexId: id,
							documentsRelated: infoData,
							companyId,
							accessKey: relatedId,
						};
						await AnnexDetailsTx.create(dataFile);
					}
					const documentsAnnex = await DocumentsAnnexTx.query()
						.patch(data)
						.where('id', id)
						.where('company_id', companyId);
					return documentsAnnex;
				},
			);
			return Promise.resolve(purDocumentResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async updateSqsPurchaseAnnex(response, data) {
		try {
			const {
				authorization, annexId, id, typeEmission, additionalFields,
			} = data;
			let comCountryId;
			let documentToJson;
			let documentstructure;
			const { company } = authorization.employee;
			const {
				cms_companies_id: companyId,
				com_subsidiaries_id: subsidiaryId,
				war_warehouses_id: warehouseId,
				employee,
			} = authorization;
			const accessKey = additionalFields.secretCode;
			if (company && company.country) {
				comCountryId = company.country.id;
			}
			const dataRaw = {
				status: raw(`CASE WHEN total_documents-1 = total_processed THEN ${PurchaseAnnex.finalized} ELSE ${
					PurchaseAnnex.processing
				} END`),
				totalProcessed: raw('total_processed+??', [1]),
			};

			const bucketName =
				authorization.employee.company.settings.bucketSaleError ||
				authorization.employee.company.settings.bucket;

			const purDocumentResulTx = await transaction(
				PurDocumentsAnnex,
				DocumentAccountStatus,
				PurDocumentsAnnexDetails,
				MsTypeTransaction,
				async (DocumentsAnnexTx, AccountStatusTx, AnnexDetailsTx, TypeTransactionTx) => {
					const { autorizacion } = response.data.autorizaciones;
					let xmlFile = autorizacion[0].comprobante.replace(/\\n/gi, '');
					xmlFile = xmlFile.replace(/\\"/gi, '"');

					documentToJson = ParserXml.fastXmlParser(xmlFile);
					documentstructure = ParserXml.structureDocument(documentToJson);

					const documentStatus = await AccountStatusTx.getByAccessKey(accessKey, companyId);
					if (!isNullOrUndefined(documentStatus)) {
						dataRaw.totalError = raw('total_error+??', [1]);
						const documentRelated = await AnnexDetailsTx.getByAccessKey(id, companyId);
						if (documentRelated) {
							await AnnexDetailsTx.edit(documentRelated.id, {
								detailsErrors: 'Error Ingresado con anterioridad',
							});
						}
					} else {
						const filename = `${bucketName}/${response.data.claveAccesoConsultada}.xml`;
						const fileXml = await Aws(xmlFile, filename, process.env.AWS_S3_BUCKET_MAKI, 'utf-8');
						dataRaw.totalRegistered = raw('total_registered+??', [1]);
						const documentAnnexDetailsRelated = await AnnexDetailsTx.getByAccessKey(id, companyId);
						if (documentAnnexDetailsRelated) {
							await AnnexDetailsTx.remove(documentAnnexDetailsRelated.id);
						}

						const msTypeDocument = await TypeTransactionTx.getFilterById(
							undefined,
							documentstructure.typeDocumentCode,
							{ comCountryId, flagType: purchases },
						);

						if (!isNullOrUndefined(msTypeDocument)) {
							const {
								amount,
								description,
								currency,
								details,
								taxes,
								additionalInformation,
							} = documentstructure;
							additionalInformation.typeEmission = typeEmission;
							additionalInformation.fileXml = fileXml.Location;
							const emissionDate = additionalFields.emissionDate.split('/');
							let authorizationDate = additionalFields.authorizationDate.split(' ');
							authorizationDate = authorizationDate[0].split('/');
							const documentRelated = {
								moduleId: purchases,
								typeTransactionId: msTypeDocument.id,
								amount,
								dueAmount: 0,
								status: 1,
								description,
								documentNumber: additionalFields.serie,
								accessKey,
								currency,
								emissionDate: format(
									new Date(emissionDate[2], emissionDate[1] - 1, emissionDate[0]),
									'YYYY-MM-DD',
								),
								receptionDate: format(
									new Date(authorizationDate[2], authorizationDate[1] - 1, authorizationDate[0]),
									'YYYY-MM-DD',
								),
								purDocumentAnnexId: annexId,
								companyId,
								details: details || taxes,
								additionalInformation,
								employeeId: employee.id || null,
								subsidiaryId,
								warehouseId,
							};

							await AccountStatusTx.create(documentRelated);

							const documentsAnnex = await DocumentsAnnexTx.findById(annexId, companyId);
							const { summary } = documentsAnnex;
							const total = summary[documentstructure.typeDocumentCode]
								? summary[documentstructure.typeDocumentCode] + 1
								: 1;
							dataRaw.summary = raw(`JSON_SET(summary, "$.${documentstructure.typeDocumentCode}", ${total})`);
						}
					}

					const DocumentsAnneResponse = await DocumentsAnnexTx.query()
						.patchAndFetchById(annexId, dataRaw)
						.where('company_id', authorization.cms_companies_id);
					return DocumentsAnneResponse;
				},
			);
			return Promise.resolve(purDocumentResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}
}

module.exports = PurDocumentsAnnex;
