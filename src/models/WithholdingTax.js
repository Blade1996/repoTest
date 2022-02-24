'use strict';

const baseModel = require('./base');
const { Model, transaction, raw } = require('objection');
const helper = require('./helper');
const format = require('date-fns/format');
const { isNullOrUndefined } = require('util');
const WithholdingTaxDetail = require('./WithholdingTaxDetail');
const FlagUse = require('./FlagUse');
const SalSeries = require('./SalSeries');
const MsTransactionStates = require('./MsTransactionStates');
const TypeMovement = require('./TypeMovement');
const TypeAmortization = require('./TypeAmortization');
const ModuleCode = require('./ModuleCode');
const TypeTransaction = require('./TypeTransaction');
const TypeEntity = require('./TypeEntity');
const Cash = require('./Cash');
const Transaction = require('./Transaction');
const entityStates = require('./enums/sales-entity-states-enum');

class WithholdingTax extends baseModel {
	static get tableName() {
		return 'com_withholding_tax';
	}

	static get relationMappings() {
		return {
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/WithholdingTaxDetail.js`,
				join: {
					from: 'com_withholding_tax.id',
					to: 'com_withholding_tax_detail.withholding_tax_id',
				},
			},
			purchase: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Purchases.js`,
				join: {
					from: 'com_withholding_tax.id',
					to: 'pur_documents.withholding_tax_id',
				},
			},
			module: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Module`,
				join: {
					from: 'com_withholding_tax.module_id',
					to: 'com_module.id',
				},
			},
			entityState: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/EntityState.js`,
				join: {
					from: 'com_withholding_tax.entity_state_id',
					to: 'ms_entity_states.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: [],
			properties: {
				purchaseDocumentId: {
					type: ['integer', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				numberOperation: {
					type: ['string', 'null'],
				},
				jsonTaxes: {
					type: ['object', 'null'],
				},
				serieId: {
					type: ['integer', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				serie: {
					type: ['string', 'null'],
				},
				number: {
					type: ['string', 'null'],
				},
				stateDocumentTax: {
					type: ['integer', 'null'],
					default: 1,
				},
				msgSri: {
					type: ['string', 'null'],
				},
				urlXml: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				authorizationNumber: {
					type: ['string', 'null'],
				},
				authorizationDate: {
					type: 'date',
				},
				environment: {
					type: ['string', 'null'],
				},
				emission: {
					type: ['string', 'null'],
				},
				password: {
					type: ['string', 'null'],
				},
				urlPassword: {
					type: ['string', 'null'],
				},
				moduleId: {
					type: ['integer', 'null'],
				},
				saleDocumentId: {
					type: ['integer', 'null'],
				},
				employeeId: {
					type: ['integer', 'null'],
				},
				documentAccountStatusId: {
					type: ['integer', 'null'],
				},
				transactionId: {
					type: ['integer', 'null'],
				},
				transactionBankId: {
					type: ['integer', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'purchase_document_id',
			'code',
			'description',
			'number_operation',
			'date_expiration',
			'date_accouting',
			'date_document',
			'json_taxes',
			'serie_id',
			'terminal_id',
			'serie',
			'number',
			'state_document_tax',
			'msg_sri',
			'url_xml',
			'document_number',
			'authorization_number',
			'authorization_date',
			'environment',
			'emission',
			'password',
			'url_password',
			'module_id',
			'sale_document_id',
			'document_account_status_id',
			'transaction_id',
			'transaction_bank_id',
			'employee_id',
			'created_at',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get virtualAttributes() {
		return ['statusTaxName', 'createdAtSri', 'detailsAmout'];
	}

	get statusTaxName() {
		let data = {};
		switch (this.stateDocumentTax) {
		case 1:
			data = { name: 'sin enviar', color: 'black', showDetails: false };
			break;
		case 2:
			data = { name: 'firmado', color: 'purple', showDetails: true };
			break;
		case 3:
			data = { name: 'error de firmado', color: 'red', showDetails: true };
			break;
		case 4:
			data = { name: 'enviado', color: 'purple', showDetails: true };
			break;
		case 5:
			data = { name: 'error de enviado', color: 'red', showDetails: true };
			break;
		case 6:
			data = {
				name: 'en proceso de autorización',
				color: 'yellow darken-2',
				showDetails: true,
			};
			break;
		case 7:
			data = { name: 'autorizado', color: 'green', showDetails: true };
			break;
		case 8:
			data = { name: 'error de autorizado', color: 'red', showDetails: true };
			break;
		case 9:
			data = { name: 'en proceso de envío', color: 'yellow darken-2', showDetails: false };
			break;
		default:
			break;
		}
		return data;
	}

	get createdAtSri() {
		return format(this.createdAt, 'DD/MM/YYYY');
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static match(query, search) {
		query.whereRaw('MATCH(code, number, serie, number_operation, description) AGAINST(?)', [
			search,
		]);
		return query;
	}

	get detailsAmout() {
		const data = [];
		const details = this.details && this.details.length > 0 ? this.details : [];
		if (Array.isArray(details) && details.length > 0) {
			const acumTotalItem = details.reduce((acum, item) => {
				const newAcum = { ...acum };
				if (item.nameTax && !isNullOrUndefined(item.nameTax)) {
					newAcum[`${item.nameTax}`] = (acum && acum[`${item.nameTax}`]) || {
						nameTax: `${item.nameTax}`,
						baseRecorded: 0,
						amountTax: 0,
						baseExempt: 0,
						baseIva: 0,
						baseTax: 0,
						baseZero: 0,
						baseSubtotal: 0,
					};
					newAcum[item.nameTax].baseSubtotal += item.baseSubtotal || 0;
					newAcum[item.nameTax].baseRecorded += item.baseRecorded || 0;
					newAcum[item.nameTax].baseExempt += item.baseExempt || 0;
					newAcum[item.nameTax].amountTax += item.amountTax || 0;
					newAcum[item.nameTax].baseZero += item.baseZero || 0;
					newAcum[item.nameTax].baseIva += item.baseIva || 0;
					newAcum[item.nameTax].baseTax += item.baseTax || 0;
				}
				return newAcum;
			}, {});
			const keys = Object.keys(acumTotalItem);
			keys.forEach((item) => {
				data.push({
					nameTax: `${acumTotalItem[`${item}`].nameTax}`,
					baseRecorded: acumTotalItem[`${item}`].baseRecorded.toFixed(2),
					amountTax: acumTotalItem[`${item}`].amountTax.toFixed(2),
					baseExempt: acumTotalItem[`${item}`].baseExempt.toFixed(2),
					baseIva: acumTotalItem[`${item}`].baseIva.toFixed(2),
					baseTax: acumTotalItem[`${item}`].baseTax.toFixed(2),
					baseZero: acumTotalItem[`${item}`].baseZero.toFixed(2),
					baseSubtotal: acumTotalItem[`${item}`].baseSubtotal.toFixed(2),
				});
			});
		}
		return data;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[purchase(selectColumns).[supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns)], details(selectColumns), module(selectColumns)]')
			.join('pur_documents as p', 'p.withholding_tax_id', `${this.tableName}.id`)
			.select(this.defaultColumns())
			.skipUndefined()
			.where('p.supplier_id', filter.supplierId)
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy(`${this.tableName}.id`);

		if (filter.ids) {
			query.whereIn('id', filter.ids);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async create(data) {
		try {
			const newData = { ...data };
			const Purchases = data.purchaseModel;
			const Sales = data.salesModel;
			const {
				typePaymentId, cashId, entityExternalId, currency, documentReference,
			} = newData;
			delete newData.purchaseModel;
			delete newData.salesModel;
			delete newData.typePaymentId;
			delete newData.cashId;
			delete newData.entityExternalId;
			delete newData.currency;
			delete newData.documentReference;
			const withTaxTxResponse = transaction(
				WithholdingTax,
				SalSeries,
				Purchases,
				Sales,
				Cash,
				Transaction,
				async (WithTaxTx, SeriesTx, PurchasesTx, SalesTx, CashTx, TransactionTx) => {
					let serieData = { serie: newData.serie, number: newData.number };
					if (data.serieId) {
						serieData = await SeriesTx.editNumber(data.serieId, data.companyId);
					}
					newData.serie = serieData.serie;
					newData.number = serieData.number;
					newData.numberOperation = `${newData.serie}-${newData.number}`;
					const newRecord = await WithTaxTx.query().insertGraph(newData);

					if (newRecord.purchaseDocumentId) {
						await PurchasesTx.editFlagConfigTaxes(
							newRecord.purchaseDocumentId,
							{
								flagConfigTaxes: FlagUse.alreadyUsed,
								withholdingTaxId: newRecord.id,
							},
							newRecord.companyId,
						);
					} else if (cashId && newRecord.saleDocumentId) {
						await SalesTx.editDueAmount(
							newRecord.saleDocumentId,
							{
								withholdingTaxId: newRecord.id,
							},
							newRecord.companyId,
						);

						const cash = await CashTx.getById(cashId, newRecord.companyId);
						if (!isNullOrUndefined(cash)) {
							// let balanceAmount =
							// 	cash.balance && cash.balance[currency] ? cash.balance[currency] : 0;
							// balanceAmount = Math.round(balanceAmount * 100) / 100;
							const newTransactions = newRecord.details.map((item) => {
								let amount = item.amountTax * -1;
								amount = Math.round(amount * 100) / 100;
								const newTransaction = {
									additionalInformation: {},
									salSaleDocumentsId: newRecord.saleDocumentId,
									stateId: MsTransactionStates.finalized,
									typePaymentId,
									paymentDate: newRecord.dateDocument,
									paymentAmount: amount,
									amount,
									employeeId: newRecord.employeeId,
									companyId: newRecord.companyId,
									warWarehousesId: newRecord.warehouseId,
									typeMovement: TypeMovement.expenses,
									cashId,
									typeAmortization: TypeAmortization.simple,
									moduleOriginId: ModuleCode.accountsReceivable,
									concept: `RETENCIÓN FUENTE CÓDIGO: ${item.codePercentageTax} PORCENTAJE: ${
										item.percentageTax
									}%`,
									entityExternalId,
									typeTransaction: TypeTransaction.cash,
									documentNumber: newRecord.numberOperation,
									currency,
									typeEntityId: TypeEntity.customer,
									reference: `Comprobante de retención ${
										newRecord.numberOperation
									} de ${documentReference}`,
									documentReference,
									documents: [`${documentReference}`],
									// balance: balanceAmount + amount,
									balance: TransactionTx.lastBalanceRaw(
										newRecord.companyId,
										cashId,
										currency,
										amount,
									),
								};
								return newTransaction;
							});
							const transactions = await TransactionTx.createMultiple(newTransactions);
							newRecord.transactions = transactions || [];
						}
					}
					return newRecord;
				},
			);
			return Promise.resolve(withTaxTxResponse);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static createFree(data) {
		return this.query().insertGraph(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[entityState(selectColumns), purchase(selectColumns).[supplier(selectColumns).msTypePerson(selectColumns), employee(selectColumns), typeDocument(documentTypeData), state(selectColumns), payment(selectColumns)], details(selectColumns), module(selectColumns)]')
			.findById(id)
			.where('company_id', companyId);
	}

	static getBySale(saleId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sale_document_id', saleId)
			.where('company_id', companyId)
			.first();
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

	static isIn(id, companyId) {
		return this.query()
			.select('id', 'company_id', 'purchase_document_id')
			.where('id', id)
			.where('company_id', companyId)
			.first();
	}

	static editAll(id, data, companyId) {
		const detailWithId = [];
		const detailNoId = [];
		data.details.forEach((item) => {
			if (item.id) {
				detailWithId.push(item);
			} else {
				const newItem = Object.assign({}, item);
				newItem.withholdingTaxId = id;
				detailNoId.push(newItem);
			}
		});
		const headerUpdate = Object.assign({}, data);
		delete headerUpdate.details;

		const knex = WithholdingTax.knex();
		let newWithholding;
		return transaction(knex, () => {
			const promise = this.query()
				.patch(headerUpdate)
				.where('id', id)
				.where('company_id', companyId);

			return promise
				.then((withholding) => {
					newWithholding = withholding;
					const promises = [];
					detailWithId.forEach((item) => {
						const newItem = Object.assign({}, item);
						delete newItem.id;
						promises.push(WithholdingTaxDetail.edit(item.id, newItem, id));
					});
					Promise.all(promises);
				})
				.then(() => WithholdingTaxDetail.create(detailNoId))
				.then(() => newWithholding);
		});
	}

	static editStateTaxes(companyId, id, data) {
		const newData = { stateDocumentTax: data.stateDocumentTax, msgSri: data.sunatError };
		if (data.qrUrl) {
			newData.urlXml = data.qrUrl;
		}
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static exportExcel({
		companyId,
		supplierId,
		typeDocumentId,
		purchaseDocumentId,
		startDate,
		endDate,
	}) {
		const withholdingTaxColumns = [
			'number_operation as numberOperation',
			'date_document as recordDocument',
			'created_at as dateWithholding',
		].map(c => `${this.tableName}.${c}`);
		const pColums = [
			'p.document_number as documentNumber',
			'p.currency as typeCurrency',
			'p.amount as quantityAmount',
			'p.created_at as datePurchase',
		];
		const psColums = ['ps.name as supplierName', 'ps.document_number as suppDocumentNumber'];
		const tdColums = ['td.name as documentName'];
		const rawColumns = [
			raw(`DATE_FORMAT(DATE(${this.tableName}.date_document), '%Y-%m-%d') as dateDocument`),
			raw(`DATE_FORMAT(DATE(${this.tableName}.created_at), '%Y-%m-%d') as createdAt`),
		];
		const columns = withholdingTaxColumns.concat(pColums, psColums, tdColums, rawColumns);

		const query = this.query()
			.select(columns)
			.innerJoin('pur_documents as p', 'p.withholding_tax_id', `${this.tableName}.id`)
			.innerJoin('com_ms_type_documents as td', 'td.id', 'p.type_document_id')
			.innerJoin('pur_suppliers as ps', 'ps.id', 'p.supplier_id')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where('p.supplier_id', supplierId)
			.skipUndefined()
			.where('p.type_document_id', typeDocumentId)
			.skipUndefined()
			.where('p.purchase_document_id', purchaseDocumentId)
			.groupBy(`${this.tableName}.id`);

		if (startDate && endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				endDate,
			);
		}

		return query;
	}

	static async cancel(data, credentials, commentary, DocumentTx) {
		try {
			const txResult = await transaction(
				WithholdingTax,
				DocumentTx,
				async (WithholdingTaxTx, PurchaseTx) => {
					const { purchase, id } = data || {};
					const cancelUserName = `${credentials.employee.name} ${credentials.employee.lastname}`;
					if (purchase) {
						await PurchaseTx.editFlagConfigTaxes(
							purchase.id,
							{
								withholdingTaxId: null,
								flagConfigTaxes: null,
							},
							credentials.cms_companies_id,
						);
					}
					const result = await WithholdingTaxTx.query()
						.patch({
							entityStateId: entityStates.cancel,
							commentary: `${cancelUserName}, ${commentary}`,
							dateCancel: new Date(),
						})
						.where('id', id);

					return result;
				},
			);
			return Promise.resolve(txResult);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static getPurchasesRetentionPdf(companyId, filter = {}, warehouseIds) {
		let query = this.query()
			.select(this.defaultColumns([
				raw('ANY_VALUE(wt.created_at) as datePurchases'),
				raw('ANY_VALUE(p.number) as numberPurchase'),
				raw('ANY_VALUE(p.document_number) as documentNumberPurchase'),
				raw('ANY_VALUE(wt.code_percentage_tax)'),
				raw('ANY_VALUE(wt.amount_tax)'),
				raw('ANY_VALUE(e.name) as nameEmployee'),
				raw('ANY_VALUE(t.name) as nameTerminal'),
			]))
			.eager('[details(selectColumns)]')
			.join('sal_terminals as t', 't.id', `${this.tableName}.terminal_id`)
			.join('pur_documents as p', 'p.withholding_tax_id', `${this.tableName}.id`)
			.join('com_withholding_tax_detail as wt', 'wt.withholding_tax_id', `${this.tableName}.id`)
			.join('com_employee as e', 'e.id', `${this.tableName}.employee_id`)
			.skipUndefined()
			.where('p.subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('p.supplier_id', filter.supplierId)
			.skipUndefined()
			.where('p.terminal_id', filter.terminalId)
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy(`${this.tableName}.id`);

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('p.warehouse_id', warehouseIds);
		}

		if (filter.ids) {
			query.whereIn('id', filter.ids);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getPurchasesRetentionPdfTotals(companyId, filter = {}, warehouseIds) {
		const rawColumns = [
			raw('ANY_VALUE(wt.code_percentage_tax) as codePorcentage'),
			raw('ANY_VALUE(wt.name_tax) as code'),
			raw('ANY_VALUE(sum(p.total_without_withholding)) as percentage'),
			raw('ANY_VALUE(ROUND((sum(p.total_without_withholding)/ 100), 2))  as valueRetention'),
		];
		let query = this.query()
			.select(rawColumns)
			.join('pur_documents as p', 'p.withholding_tax_id', `${this.tableName}.id`)
			.join('com_withholding_tax_detail as wt', 'wt.withholding_tax_id', `${this.tableName}.id`)
			.join('com_employee as e', 'e.id', `${this.tableName}.employee_id`)
			.skipUndefined()
			.where('p.subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('p.supplier_id', filter.supplierId)
			.skipUndefined()
			.where('p.terminal_id', filter.terminalId)
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy('wt.code_percentage_tax');

		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('p.warehouse_id', warehouseIds);
		}

		if (filter.ids) {
			query.whereIn('id', filter.ids);
		}

		if (filter.startDate && filter.endDate) {
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) >= ?`,
				filter.startDate,
			);
			query.whereRaw(
				`DATE(CONVERT_TZ(${this.tableName}.created_at, "+05:00", "+00:00")) <= ?`,
				filter.endDate,
			);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}
}

module.exports = WithholdingTax;
