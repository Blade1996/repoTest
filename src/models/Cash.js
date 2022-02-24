'use strict';

const baseModel = require('./base');
const { isNullOrUndefined } = require('util');
const helper = require('./helper');
const { transaction, raw, Model } = require('objection');
const SalSeries = require('./SalSeries');
const MsTypeDocument = require('./MsTypeDocument');
const { expenses } = require('./TypeMovement');

class Cash extends baseModel {
	static get tableName() {
		return 'com_cash';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name'],
			properties: {
				code: {
					type: ['string', 'null'],
				},
				name: {
					type: 'string',
				},
				description: {
					type: ['string', 'null'],
				},
				account: {
					type: ['string', 'null'],
				},
				type: {
					type: ['string', 'null'],
				},
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				flagGeneral: {
					type: ['integer', 'null'],
				},
				balance: {
					type: ['object', 'null'],
					default: {},
				},
				state: {
					type: ['object', 'null'],
					default: {},
				},
				flagControl: {
					type: ['integer', 'null'],
				},
				accountingAccount: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			basicColumns: builder => builder.select(this.basicColumns()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'name',
			'description',
			'account',
			'type',
			'war_warehouses_id',
			'terminal_id',
			'flag_general',
			'balance',
			'state',
			'flag_control',
			'accounting_account',
			'created_at',
			'flag_active',
			'subsidiary_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static basicColumns(otherColumns = []) {
		let columns = [
			'code',
			'name',
			'description',
			'account',
			'type',
			'war_warehouses_id',
			'flag_general',
			'balance',
			'state',
			'flag_control',
			'accounting_account',
			'created_at',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get relationMappings() {
		return {
			transaction: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/Transaction.js`,
				join: {
					from: 'com_cash.id',
					to: 'sal_transactions.cash_id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_cash.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			cashTerminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'sal_terminals.cash_id',
					to: 'com_cash.id',
				},
			},
		};
	}

	static getAclFilters(aclFilters = {}, flagAll = false) {
		const newAclFilters = { ...aclFilters };
		const { warehouses: warehousesConfig = {}, cash: cashFilters = {} } = newAclFilters;
		const { subsidiaries = {}, warehouses = {} } = warehousesConfig;
		warehousesConfig.warehouses = {
			fieldName: 'war_warehouses_id',
			values: warehouses.values,
		};
		newAclFilters.warehouses = warehousesConfig;
		delete newAclFilters.warehouses.subsidiaries;
		return {
			newAclFilters,
			subsidiaries:
				flagAll && subsidiaries.values && subsidiaries.values.length > 0
					? subsidiaries.values
					: undefined,
			cashIds:
				flagAll && cashFilters.values && cashFilters.values.length > 0
					? cashFilters.values
					: undefined,
		};
	}

	static getAll(filter = {}, companyId, aclFilters = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.eager('cashTerminal(basicColumns)')
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.subsidiary_id`, filter.subsidiaryId)
			.skipUndefined()
			.where(`${this.tableName}.war_warehouses_id`, filter.warWarehousesId)
			.skipUndefined()
			.where(`${this.tableName}.flag_active`, filter.flagActive)
			.groupBy(`${this.tableName}.id`);

		if (filter.notTerminal) {
			query.whereNotNull('terminal_id');
		}
		if (!isNullOrUndefined(filter.flagGeneral)) {
			query.where(`${this.tableName}.flag_general`, filter.flagGeneral);
		}
		if (filter.subsidiaryIds && filter.subsidiaryIds.length > 0) {
			query.whereIn('subsidiary_id', filter.subsidiaryIds);
		}
		if (filter.warWarehousesIds && filter.warWarehousesIds.length > 0) {
			query.whereIn('war_warehouses_id', filter.warWarehousesIds);
		}
		if (filter.cashIds && filter.cashIds.length > 0) {
			query.whereIn(`${this.tableName}.id`, filter.cashIds);
		}
		if (filter.flagAll && filter.subsidiaries) {
			query
				.innerJoin(
					'sal_terminals',
					'sal_terminals.war_warehouses_id',
					`${this.tableName}.war_warehouses_id`,
				)
				.whereIn('sal_terminals.com_subsidiaries_id', filter.subsidiaries);
		}
		if (!filter.flagAll && aclFilters) {
			query.aclFilter(aclFilters.warehouses, this.tableName);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data, serieData) {
		const knex = Cash.knex();
		let newData;
		return transaction(knex, () => {
			const promise = this.query().insert(data);

			return promise
				.then((cash) => {
					newData = cash;
					return MsTypeDocument.getByCode('RC', serieData.countryId);
				})
				.then((document) => {
					if (serieData && document) {
						const dataSerie = {
							comSubsidiariesId: serieData.comSubsidiariesId,
							salTerminalsId: serieData.salTerminalsId,
							salTypeDocumentsId: document.id,
							serie: 'RC',
							number: '0',
							companyId: serieData.comCompanyId,
							cashId: newData.id,
						};
						return SalSeries.create(dataSerie);
					}
					return null;
				})
				.then(() => newData);
		});
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}

	static updateMultiple(data, trx) {
		return this.query(trx).upsertGraph(data, {
			noDelete: true,
		});
	}

	static getById(id, companyId, flagActive, trx) {
		return this.query(trx)
			.select(this.defaultColumns())
			.eager('cashTerminal(selectColumns)')
			.findById(id)
			.where('company_id', companyId)
			.skipUndefined()
			.where('flag_active', flagActive);
	}

	static getByIdAndClosing(id, currency, companyId, flagActive, trx) {
		return this.query(trx)
			.select(raw('com_cash.id, com_cash.war_warehouses_id, com_cash.terminal_id, com_cash.balance, com_cash.flag_active, c.employee_id as closingEmployeeId, c.id as closingId'))
			.leftJoin(raw(
				'sal_cash_desk_closing c on c.cash_id = com_cash.id and c.terminal_id = com_cash.terminal_id and c.closed_at is null and c.currency = ?',
				[currency],
			))
			.where(`${this.tableName}.id`, id)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${this.tableName}.flag_active`, flagActive)
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

	static async lastBalance(companyId, cashId, currency = 'PEN') {
		const lastBalance = await this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where('id', cashId)
			.first();

		if (lastBalance && lastBalance.balance) {
			return lastBalance.balance[currency] ? lastBalance.balance[currency] : 0;
		}
		return 0;
	}

	static lastBalanceMultiple(companyId, cashIds) {
		return this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('id', cashIds);
	}

	static async updateBalance(companyId, cashId, newBalance = {}) {
		try {
			const lastBalance = await Cash.query()
				.select(this.defaultColumns())
				.where('company_id', companyId)
				.where('id', cashId)
				.first();

			const data = lastBalance.balance ? lastBalance.balance : {};
			const keysId = Object.keys(newBalance);
			if (keysId && keysId.length > 0) {
				keysId.forEach((i) => {
					let amount = newBalance[i];
					amount = Math.round(amount * 100) / 100;
					if (data[i]) {
						data[i] += amount;
					} else {
						data[i] = amount;
					}
				});
				const newData = await Cash.edit(cashId, { balance: data }, companyId);
				return Promise.resolve(newData);
			}
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static validateCode({ code, id }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.where('company_id', companyId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static async getCashPdf(companyId, filter = {}, warehouseIds) {
		const salTerminals = 'sal_terminals';
		const rawColumns = [
			raw(`FORMAT(JSON_EXTRACT(com_cash.balance, "$.${filter.currency}"), 2) as balance`),
		];
		const ptColumns = [`${this.tableName}.code`, `${this.tableName}.name`];
		const columns = ptColumns.concat(rawColumns);
		const query = this.query()
			.select(columns)
			.join(
				`${salTerminals}`,
				`${salTerminals}.war_warehouses_id`,
				`${this.tableName}.war_warehouses_id`,
			)
			.where(`${this.tableName}.company_id`, companyId)
			.skipUndefined()
			.where(`${salTerminals}.com_subsidiaries_id`, filter.comSubsidiaryId)
			.skipUndefined()
			.whereIn(`${salTerminals}.id`, filter.terminalIds);
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

		if (warehouseIds) {
			query.whereIn(`${salTerminals}.war_warehouses_id`, warehouseIds);
		}
		return query;
	}

	static async getMovementCashiers(companyId, filter = {}, warehouseIds) {
		const rawColumns = [
			raw('com_cash.id'),
			raw('com_cash.name'),
			raw('sum(st.amount) as totalAmount'),
		];
		const query = this.query()
			.select(rawColumns)
			.eager('[transaction(selectColumns)]')
			.join('sal_transactions as st', 'st.cash_id', 'com_cash.id')
			.modifyEager('transaction', (builder) => {
				builder
					.select([
						raw('sal_transactions.created_at'),
						raw('JSON_EXTRACT(sal_transactions.additional_information, "$.typeDocumentCode") as typeDocumentCode'),
						raw('com_ms_type_payments.code AS codePayment'),
						raw('sal_transactions.concept'),
						raw('sal_transactions.document_number AS paymentDocument'),
						raw('CASE WHEN sal_transactions.type_movement = 1 THEN "Ingreso" ELSE "Egreso" END AS frm'),
						raw('sal_transactions.amount AS amountTransaction'),
					])
					.join(
						'com_ms_type_payments',
						'com_ms_type_payments.id',
						'sal_transactions.type_payment_id',
					)
					.join(
						'sal_terminals',
						'sal_terminals.war_warehouses_id',
						'sal_transactions.war_warehouses_id',
					)
					.where('sal_transactions.currency', filter.currency)
					.skipUndefined()
					.where('sal_transactions.subsidiary_id', filter.comSubsidiaryId)
					.skipUndefined()
					.where('sal_transactions.type_movement', filter.typeMovement)
					.skipUndefined()
					.whereIn('sal_terminals.id', filter.terminalIds);
				if (filter.startDate && filter.endDate) {
					query.whereRaw(
						'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) >= ?',
						filter.startDate,
					);
					query.whereRaw(
						'DATE(CONVERT_TZ(sal_transactions.created_at, "+05:00", "+00:00")) <= ?',
						filter.endDate,
					);
				}

				if (warehouseIds) {
					query.whereIn('sal_terminals.war_warehouses_id', warehouseIds);
				}
			})
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy('com_cash.id');
		return query;
	}

	static async getMovementCashiersDetails(companyId, filter = {}, warehouseIds) {
		const transactionColumn = 'sal_transactions';
		const rawColumns = [
			raw('com_cash.id'),
			raw('com_cash.name'),
			raw('sum(st.amount) as totalAmount'),
		];
		const query = this.query()
			.select(rawColumns)
			.eager('[transaction(selectColumns)]')
			.join(`${transactionColumn} as st`, 'st.cash_id', 'com_cash.id')
			.modifyEager('transaction', (builder) => {
				builder
					.select([
						raw(`DATE_FORMAT(${transactionColumn}.created_at, '%d-%m-%Y') AS createdAt`),
						raw(`JSON_EXTRACT(${transactionColumn}.additional_information, "$.typeDocumentCode") as typeDocumentCode`),
						raw('com_ms_type_payments.code AS codePayment'),
						raw(`${transactionColumn}.concept`),
						raw(`${transactionColumn}.document_number AS paymentDocument`),
						raw(`CASE WHEN ${transactionColumn}.type_movement = 1 THEN "Ingreso" ELSE "Egreso" END AS frm`),
						raw(`CASE WHEN ${transactionColumn}.type_movement = 1 THEN ${transactionColumn}.amount END AS entry`),
						raw(`CASE WHEN ${transactionColumn}.type_movement = 2 THEN ${transactionColumn}.amount END AS egress`),
					])
					.join(
						'com_ms_type_payments',
						'com_ms_type_payments.id',
						`${transactionColumn}.type_payment_id`,
					)
					.join(
						'sal_terminals',
						'sal_terminals.war_warehouses_id',
						`${transactionColumn}.war_warehouses_id`,
					)
					.where(`${transactionColumn}.currency`, filter.currency)
					.skipUndefined()
					.where(`${transactionColumn}.subsidiary_id`, filter.comSubsidiaryId)
					.skipUndefined()
					.where(`${transactionColumn}.type_movement`, filter.typeMovement)
					.skipUndefined()
					.whereIn('sal_terminals.id', filter.terminalIds);
				if (filter.startDate && filter.endDate) {
					query.whereRaw(
						`DATE(CONVERT_TZ(${transactionColumn}.created_at, "+05:00", "+00:00")) >= ?`,
						filter.startDate,
					);
					query.whereRaw(
						`DATE(CONVERT_TZ(${transactionColumn}.created_at, "+05:00", "+00:00")) <= ?`,
						filter.endDate,
					);
				}

				if (warehouseIds) {
					query.whereIn('sal_terminals.war_warehouses_id', warehouseIds);
				}
			})
			.where(`${this.tableName}.company_id`, companyId)
			.groupBy('com_cash.id');
		return query;
	}

	static resetCashBalance(id, amount, currency, companyId) {
		return this.query()
			.patch({
				balance: raw(`JSON_SET(balance, "$.${currency}", ?)`, [amount]),
			})
			.where('id', id)
			.where('company_id', companyId);
	}

	static updateCashBalance(id, amount, currency, companyId, typeMovement = expenses, dataUpdate) {
		const newAmount = typeMovement === expenses ? amount * -1 : amount;
		const editData = dataUpdate || {
			balance: raw(
				`JSON_SET(balance, "$.${currency}", JSON_EXTRACT(balance, "$.${currency}") + ?)`,
				[newAmount],
			),
		};
		return this.query()
			.patch(editData)
			.where('id', id)
			.where('company_id', companyId);
	}

	static updateAmount(id, price, companyId, currency) {
		return this.query()
			.patch({
				balance: raw(`JSON_SET(balance, "$.${currency}", JSON_EXTRACT(balance, "$.${currency}") + ${price})`),
			})
			.where('id', id);
	}
}

module.exports = Cash;
