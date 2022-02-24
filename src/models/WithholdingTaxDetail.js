'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');

class WithholdingTaxDetail extends baseModel {
	static get tableName() {
		return 'com_withholding_tax_detail';
	}

	static get relationMappings() {
		return {
			purchase: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/WithholdingTax.js`,
				join: {
					from: 'com_withholding_tax_detail.withholding_tax_id',
					to: 'com_withholding_tax.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['withholdingTaxId'],
			properties: {
				withholdingTaxId: {
					type: 'integer',
				},
				baseZero: {
					type: ['number', 'null'],
					default: 0,
				},
				baseRecorded: {
					type: ['number', 'null'],
					default: 0,
				},
				baseTax: {
					type: ['number', 'null'],
					default: 0,
				},
				namePercentageTax: {
					type: ['string', 'null'],
				},
				codePercentageTax: {
					type: ['string', 'null'],
				},
				percentageTax: {
					type: ['number', 'null'],
					default: 0,
				},
				amountTax: {
					type: ['number', 'null'],
					default: 0,
				},
				codeAccounting: {
					type: ['string', 'null'],
				},
				codeTax: {
					type: ['string', 'null'],
				},
				nameTax: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				baseExempt: {
					type: ['number', 'null'],
					default: 0,
				},
				baseIva: {
					type: ['number', 'null'],
					default: 0,
				},
				numberOrder: {
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
			'withholding_tax_id',
			'base_zero',
			'base_recorded',
			'base_tax',
			'name_percentage_tax',
			'code_percentage_tax',
			'percentage_tax',
			'amount_tax',
			'code_accounting',
			'code_tax',
			'name_tax',
			'description',
			'base_exempt',
			'base_iva',
			'number_order',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static get virtualAttributes() {
		return ['baseSubtotal', 'formatNumbers'];
	}

	get formatNumbers() {
		const subtotal = this.baseZero || this.baseRecorded || this.baseTax;
		const data = {
			baseRecorded: this.baseRecorded ? this.baseRecorded.toFixed(2) : '0.00',
			amountTax: this.amountTax ? this.amountTax.toFixed(2) : '0.00',
			baseExempt: this.baseExempt ? this.baseExempt.toFixed(2) : '0.00',
			baseIva: this.baseIva ? this.baseIva.toFixed(2) : '0.00',
			baseTax: this.baseTax ? this.baseTax.toFixed(2) : '0.00',
			baseZero: this.baseZero ? this.baseZero.toFixed(2) : '0.00',
			baseSubtotal: subtotal ? subtotal.toFixed(2) : '0.00',
		};
		return data;
	}

	get baseSubtotal() {
		return this.baseZero || this.baseRecorded || this.baseTax;
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getById(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.findById(id)
			.where('company_id', companyId);
	}

	static edit(id, data, withholdingTaxId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('withholding_tax_id', withholdingTaxId);
	}

	static remove(id, companyId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('company_id', companyId);
	}

	static findMultiple(ids, companyId) {
		return this.query()
			.select('id', 'company_id')
			.where('company_id', companyId)
			.whereIn('id', ids);
	}
}

module.exports = WithholdingTaxDetail;
