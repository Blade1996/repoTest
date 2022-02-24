'use strict';

const objection = require('objection');
const baseModel = require('./base');
const helper = require('./helper');

class PayrollDetails extends baseModel {
	static get tableName() {
		return 'com_payroll_details';
	}

	static get relationMappings() {
		return {};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name'],
			properties: {
				codeConcepts: {
					type: ['string'],
				},
				amount: {
					type: ['number', 'null'],
					default: 0.0,
				},
				formula: {
					type: ['string', 'null'],
				},
				typeItem: {
					type: ['integer'],
				},
				typeFormula: {
					type: ['integer'],
				},
				flagProvision: {
					type: ['boolean', 'integer'],
				},
				flagShow: {
					type: ['boolean', 'integer'],
				},
				comEmployeeId: {
					type: ['integer'],
				},
				flagActive: {
					type: ['boolean'],
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
			'code_concepts',
			'amount',
			'formula',
			'flag_locked',
			'flag_accounted',
			'flag_provision',
			'flag_paid',
			'date_paid',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static create(data, company, employeeId, paDetails, paEmployees) {
		const knex = PayrollDetails.knex();
		const payrollDetails = [];
		paEmployees.addEmployee.forEach((item) => {
			paDetails.forEach((item2) => {
				payrollDetails.push({
					headingId: data.headingId,
					flagLocked: data.flagLocked,
					dateDaid: data.dateDaid,
					comSubsidiariesId: data.comSubsidiariesId,
					payrollEmployeeId: item.id,
					conceptsId: item2.id,
					codeConcepts: item2.code,
					value: item2.value,
					amount: item2.amount,
					formula: item2.formula,
					typeItem: item2.typeItem,
					typeFormula: item2.typeFormula,
					flagTaxable: item2.flagTaxable,
					flagProvision: item2.flagProvision,
					comEmployeeId: employeeId,
					companyId: company.id,
				});
			});
		});
		return objection.transaction(knex, async (trx) => {
			const newRecord = await this.query(trx).insertGraph(payrollDetails);
			const promises = [];
			paEmployees.reset.forEach((item) => {
				promises.push(this.removeDetailsByEmployeeId(data.headingId, item.id));
			});
			await Promise.all(promises);
			return newRecord;
		});
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static removeDetailsByEmployeeId(headingId, employeeId, id) {
		return this.query()
			.softDelete()
			.skipUndefined()
			.where('id', id)
			.where('heading_id', headingId)
			.where('payroll_employee_id', employeeId);
	}
}

module.exports = PayrollDetails;
