'use strict';

const moment = require('moment');
const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const TypeGeneral = require('./TypeGeneral');

class GeneralEmployee extends baseModel {
	static get tableName() {
		return 'com_general_employee';
	}

	static get relationMappings() {
		return {
			general: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				join: {
					from: 'com_general_employee.general_id',
					to: 'com_general.id',
				},
			},
			typeGeneral: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/MsTypeGeneral.js`,
				join: {
					from: 'com_general_employee.type_general_id',
					to: 'ms_type_general.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'com_general_employee.com_employee_id',
					to: 'com_employee.id',
				},
			},
			recognitions: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.recognitions },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.number',
				},
			},
			reprimands: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeReprimands },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.number',
				},
			},
			relationship: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.relationship },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.number',
				},
			},
			retireMotivate: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.retireMotivate },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.number',
				},
			},
			retireMotivateInsured: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.retireMotivate },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.general_id',
				},
			},
			occupation: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeOccupation },
				join: {
					from: 'com_general.id',
					to: 'com_general_employee.general_id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			require: ['name', 'typeGeneralPayrollId'],
			properties: {
				dataEmployee: {
					type: ['object', 'null'],
				},
				searchField: {
					type: ['string', 'null'],
				},
				description: {
					type: ['string', 'null'],
				},
				number: {
					type: ['integer', 'null'],
				},
				code: {
					type: ['string', 'null'],
				},
				accumulatedDays: {
					type: ['integer', 'null'],
				},
				days: {
					type: ['integer', 'null'],
				},
				flagInsured: {
					type: ['boolean', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get virtualAttributes() {
		return ['workTimeView'];
	}

	get workTimeView() {
		moment.locale('es');
		const dateIn = moment(this.dateInput, 'YYYY-MMM-DD');
		const dateOut = moment(this.dateOutput, 'YYYY-MMM-DD');
		return moment.duration(dateOut - dateIn).humanize();
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'data_employee',
			'search_field',
			'description',
			'date',
			'flag_burden',
			'code',
			'date_input',
			'date_output',
			'accumulated_days',
			'insured_ingress',
			'insured_exit',
			'days',
			'flag_insured',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static defaultColumnsAdditionalFields(otherColumns = []) {
		let columns = ['id', 'description as value', 'flag_active'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			selectColumnsAdditional: builder => builder.select(this.defaultColumnsAdditionalFields()),
		};
	}

	static limitColumns(otherColumns = []) {
		let columns = ['id', 'code', 'description', 'flag_active'].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static getAllEmployedByTypeGeneral(idEmployee, typeGeneral, filter = {}) {
		let query = this.query()
			.eager('[recognitions(selectColumns), reprimands(selectColumns), relationship(selectColumns), occupation(selectColumns)]')
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneral)
			.where('payroll_employee_id', idEmployee)
			.skipUndefined()
			.where('number', filter.number);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getAllByLimitedColumns(idEmployee, typeGeneral, filter = {}, otherColumns = []) {
		let query = this.query()
			.eager('[retireMotivate(selectColumns), retireMotivateInsured(selectColumns)]')
			.select(this.limitColumns(otherColumns))
			.where('type_general_id', typeGeneral)
			.where('payroll_employee_id', idEmployee)
			.skipUndefined()
			.where('number', filter.number);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findByIdAndLimitedColumns(id, typeGeneral, employeeId, otherColumns = []) {
		return this.query()
			.eager('[retireMotivate(selectColumns), retireMotivateInsured(selectColumns)]')
			.select(this.limitColumns(otherColumns))
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('payroll_employee_id', employeeId)
			.findById(id);
	}

	static findById(id, typeGeneral, otherColumns = []) {
		return this.query()
			.select(this.limitColumns(otherColumns))
			.where('type_general_id', typeGeneral)
			.findById(id);
	}

	static edit(id, data) {
		return this.query()
			.patch(data)
			.where('id', id);
	}

	static findByIdAndTypeGeneral(id, typeGeneral, employeeId) {
		return this.query()
			.eager('[recognitions(selectColumns), reprimands(selectColumns), relationship(selectColumns), occupation(selectColumns)]')
			.select(this.defaultColumns())
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('payroll_employee_id', employeeId)
			.findById(id);
	}

	static remove(id, typeGeneral, employeeId) {
		return this.query()
			.softDelete()
			.where('id', id)
			.where('type_general_id', typeGeneral)
			.skipUndefined()
			.where('payroll_employee_id', employeeId);
	}

	static createAdditionalFields(data, companyId, typeGeneral, employeePayrollId, employeeId) {
		const newData = data.map((item) => {
			const newItem = {};
			newItem.description = item.value;
			newItem.number = item.id;
			newItem.comEmployeeId = employeeId;
			newItem.typeGeneralId = typeGeneral;
			newItem.payrollEmployeeId = employeePayrollId;
			if (item.fildsEmployeeId) {
				newItem.id = item.fildsEmployeeId;
			}
			return newItem;
		});
		const options = {
			unrelate: false,
		};
		return this.query().upsertGraph(newData, options);
	}
}

module.exports = GeneralEmployee;
