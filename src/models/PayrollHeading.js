'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const TypeGeneral = require('./TypeGeneral');

class PayrollHeading extends baseModel {
	static get tableName() {
		return 'com_payroll_heading';
	}

	static get relationMappings() {
		return {
			typePayroll: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typePayroll },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_heading.type_payroll_id',
				},
			},
			employees: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/EmployeesPayroll.js`,
				filter: query => query.groupBy('com_payroll_employees.id'),
				join: {
					from: 'com_payroll_heading.id',
					through: {
						modelClass: `${__dirname}/PayrollDetails.js`,
						from: 'com_payroll_details.heading_id',
						to: 'com_payroll_details.payroll_employee_id',
					},
					to: 'com_payroll_employees.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name'],
			properties: {
				code: {
					type: ['string'],
				},
				name: {
					type: ['string'],
				},
				description: {
					type: ['string', 'null'],
				},
				observation: {
					type: ['string', 'null'],
				},
				decimal: {
					type: ['integer'],
					default: 2,
				},
				typePayrollId: {
					type: ['integer'],
				},
				accountingSeat: {
					type: ['string', 'null'],
				},
				flagProvision: {
					type: ['boolean'],
				},
				flagAccounted: {
					type: ['boolean'],
				},
				flagLocked: {
					type: ['boolean'],
				},
				flagActive: {
					type: ['boolean'],
					default: true,
				},
				comSubsidiariesId: {
					type: ['integer'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			selectColumnsEmployee: builder => builder.select(this.defaultEmployee()),
		};
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'name',
			'description',
			'observation',
			'date_start',
			'date_end',
			'decimal',
			'accounting_seat',
			'com_subsidiaries_id',
			'flag_accounted',
			'flag_provision',
			'flag_locked',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static defaultEmployee(otherColumns = []) {
		let columns = [
			'name',
			'lastname',
			'nationality',
			'gender_id',
			'type_person_id',
			'document_number',
			'date_birth',
			'civil_status_id',
			'accounting_account',
			'blood_type_id',
			'driver_license',
			'phone',
			'email',
			'reference_full_name',
			'reference_phone',
			'accounting_ext',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static validateCode({
		code, accountingSeat, id, flagActive, comSubsidiariesId,
	}, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('code', code)
			.skipUndefined()
			.where('accounting_seat', accountingSeat)
			.skipUndefined()
			.where('company_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', comSubsidiariesId)
			.skipUndefined()
			.where('flag_active', flagActive)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static getAll(companyId, filter = {}) {
		let query = this.query()
			.eager('[typePayroll(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('com_subsidiaries_id', filter.comSubsidiariesId)
			.where('company_id', companyId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findById(id, companyId) {
		return this.query()
			.eager('[typePayroll(selectColumns), employees(detailColumns).[controlDate(selectColumns), payrollDetails(selectColumns).[conceptType(selectColumns)]]]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('company_id', companyId)
			.findById(id);
	}
}

module.exports = PayrollHeading;
