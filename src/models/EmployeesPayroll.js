'use strict';

const baseModel = require('./base');
const helper = require('./helper');
const { Model } = require('objection');
const TypeGeneral = require('./TypeGeneral');

class EmployeesPayroll extends baseModel {
	static get tableName() {
		return 'com_payroll_employees';
	}

	static get relationMappings() {
		return {
			bloodType: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.bloodType },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_employees.blood_type_id',
				},
			},
			typeStaff: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeStaff },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_employees.staff_id',
				},
			},
			typeCharges: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeCharges },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_employees.charge_id',
				},
			},
			typeEmployee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeEmployee },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_employees.type_employee_id',
				},
			},
			typeRemuneration: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/General.js`,
				filter: { 'com_general.type_general_id': TypeGeneral.typeRemuneration },
				join: {
					from: 'com_general.id',
					to: 'com_payroll_employees.remuneration_id',
				},
			},
			controlDate: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/GeneralEmployee.js`,
				filter: { 'com_general_employee.type_general_id': TypeGeneral.controlDate },
				join: {
					from: 'com_general_employee.id',
					to: 'com_payroll_employees.date_control_id',
				},
			},
			payrollDetails: {
				relation: Model.ManyToManyRelation,
				modelClass: `${__dirname}/PayrollConcepts.js`,
				filter: query =>
					query
						.where('com_payroll_concepts.flag_show', 1)
						.select(
							'com_payroll_details.amount',
							'com_payroll_details.formula as pivot.formula',
							'com_payroll_details.value as pivot.value',
							'com_payroll_details.flag_provision as pivot.flag_provision',
							'com_payroll_details.flag_taxable as pivot.flag_taxable',
						),
				join: {
					from: 'com_payroll_employees.id',
					through: {
						modelClass: `${__dirname}/PayrollDetails.js`,
						from: 'com_payroll_details.payroll_employee_id',
						to: 'com_payroll_details.concepts_id',
					},
					to: 'com_payroll_concepts.id',
				},
			},
			relationship: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/GeneralEmployee.js`,
				filter: { 'com_general_employee.type_general_id': TypeGeneral.relationship },
				join: {
					from: 'com_payroll_employees.id',
					to: 'com_general_employee.payroll_employee_id',
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
					type: ['string', 'null'],
				},
				urlImage: {
					type: ['string', 'null'],
				},
				name: {
					type: ['string', 'null'],
				},
				lastname: {
					type: ['string', 'null'],
				},
				nationality: {
					type: ['string', 'null'],
				},
				genderId: {
					type: ['integer', 'null'],
				},
				typePersonId: {
					type: ['integer', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				civilStatusId: {
					type: ['integer', 'null'],
				},
				accountingAccount: {
					type: ['string', 'null'],
				},
				bloodTypeId: {
					type: ['integer', 'null'],
				},
				driverLicense: {
					type: ['string', 'null'],
				},
				phone: {
					type: ['string', 'null'],
				},
				email: {
					type: ['string', 'null'],
				},
				referenceFullName: {
					type: ['string', 'null'],
				},
				referencePhone: {
					type: ['string', 'null'],
				},
				accounting_ext: {
					type: ['string', 'null'],
				},
				observation: {
					type: ['string', 'null'],
				},
				address: {
					type: ['string', 'null'],
				},
				comSubsidiariesId: {
					type: ['integer', 'null'],
				},
				comCompaniesId: {
					type: ['integer'],
				},
				comEmployeeId: {
					type: ['integer'],
				},
				departamentId: {
					type: ['integer', 'null'],
				},
				chargeCenterId: {
					type: ['integer', 'null'],
				},
				staffId: {
					type: ['integer', 'null'],
				},
				workRegimeId: {
					type: ['integer', 'null'],
				},
				chargeId: {
					type: ['integer', 'null'],
				},
				typeEmployeeId: {
					type: ['integer', 'null'],
				},
				employeeBossId: {
					type: ['integer', 'null'],
				},
				contractNumber: {
					type: ['string', 'null'],
				},
				remunerationId: {
					type: ['integer', 'null'],
				},
				salary: {
					type: ['number', 'null'],
					default: 0,
				},
				worthySalary: {
					type: ['number', 'null'],
					default: 0,
				},
				flagInsured: {
					type: ['boolean', 'null'],
				},
				flagBoss: {
					type: ['boolean', 'null'],
				},
				flagExtraHours: {
					type: ['boolean', 'null'],
				},
				flagLabor: {
					type: ['boolean', 'null'],
				},
				flagBonuses: {
					type: ['boolean', 'null'],
				},
				flagReentry: {
					type: ['boolean', 'null'],
				},
				categoryType: {
					type: ['integer', 'null'],
				},
				workedDays: {
					type: ['number', 'null'],
					default: 0,
				},
				maternityDays: {
					type: ['number', 'null'],
					default: 0,
				},
				medicalPermission: {
					type: ['number', 'null'],
					default: 0,
				},
				permitsDays: {
					type: ['number', 'null'],
					default: 0,
				},
				reserveFund: {
					type: ['boolean', 'null'],
				},
				dateControlId: {
					type: ['integer', 'null'],
				},
				methodPaymentId: {
					type: ['integer', 'null'],
				},
				bankId: {
					type: ['integer', 'null'],
				},
				accountTypeId: {
					type: ['integer', 'null'],
				},
				accountNumberBank: {
					type: ['string', 'null'],
				},
				loanAmount: {
					type: ['number', 'null'],
					default: 0,
				},
				originPaymentId: {
					type: ['integer', 'null'],
				},
				typeEmployerId: {
					type: ['integer', 'null'],
				},
				workRelationshipId: {
					type: ['integer', 'null'],
				},
				sectoralActivityId: {
					type: ['integer', 'null'],
				},
				discountInsuredId: {
					type: ['integer', 'null'],
				},
				affiliationNumber: {
					type: ['string', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			detailColumns: builder => builder.select(this.detailColumns()),
		};
	}

	static detailColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'url_image',
			'name',
			'lastname',
			'nationality',
			'type_person_id',
			'document_number',
			'date_birth',
			'civil_status_id',
			'accounting_account',
			'phone',
			'email',
			'accounting_ext',
			'address',
			'observation',
			'departament_id',
			'staff_id',
			'charge_id',
			'type_employee_id',
			'contract_number',
			'contract_date',
			'salary',
			'worthy_salary',
			'flag_extra_hours',
			'com_subsidiaries_id',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static defaultColumns(otherColumns = []) {
		let columns = [
			'id',
			'code',
			'url_image',
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
			'address',
			'observation',
			'com_subsidiaries_id',
			'com_companies_id',
			'com_employee_id',
			'departament_id',
			'charge_center_id',
			'staff_id',
			'work_regime_id',
			'charge_id',
			'type_employee_id',
			'employee_boss_id',
			'flag_boss',
			'years',
			'months',
			'days',
			'contract_number',
			'contract_date',
			'remuneration_id',
			'salary',
			'worthy_salary',
			'flag_extra_hours',
			'flag_labor',
			'category_type',
			'worked_days',
			'maternity_days',
			'medical_permission',
			'permits_days',
			'reserve_fund',
			'flag_bonuses',
			'flag_reentry',
			'date_control_id',
			'method_payment_id',
			'bank_id',
			'account_type_id',
			'account_number_bank',
			'loan_amount',
			'origin_payment_id',
			'type_employer_id',
			'work_relationship_id',
			'sectoral_activity_id',
			'discount_insured_id',
			'affiliation_number',
			'medical_history',
			'allergies',
			'diseases',
			'flag_active',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static get virtualAttributes() {
		return ['familyBurden'];
	}

	get familyBurden() {
		let data;
		if (this.relationship) {
			data = this.relationship.reduce((acum, item) => {
				const newAcum = { ...acum };
				if (item.flagBurden === 1) {
					newAcum.cantFamilyBurden = newAcum.cantFamilyBurden ? newAcum.cantFamilyBurden + 1 : 1;
				}
				if (item.occupation) {
					if (item.occupation.code === 'ESTUD' || item.occupation.code === 'ESTUDTRABJ') {
						newAcum.cantStudents = newAcum.cantStudents ? newAcum.cantStudents + 1 : 1;
					}
				}
				if (item.relationship) {
					if (item.relationship.code === 'HIJA' || item.relationship.code === 'HIJO') {
						newAcum.cantChildrens = newAcum.cantChildrens ? newAcum.cantChildrens + 1 : 1;
					}
				}
				return newAcum;
			}, {});
		}
		return data;
	}

	static create(data) {
		return this.query().insert(data);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('com_companies_id', companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static validateCode({ code, id, subsidiariesId }, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('code', code)
			.skipUndefined()
			.where('com_companies_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', subsidiariesId)
			.skipUndefined()
			.where('id', '!=', id)
			.first();
	}

	static getAllByCompanyId(companyId, filter = {}) {
		let query = this.query()
			.eager('[bloodType(selectColumns), typeStaff(selectColumns), typeCharges(selectColumns), typeEmployee(selectColumns), typeRemuneration(selectColumns), controlDate(selectColumns).[retireMotivate(selectColumns), retireMotivateInsured(selectColumns)], relationship(selectColumns).[occupation(selectColumns), relationship(selectColumns)] ]')
			.select(this.defaultColumns())
			.where('com_companies_id', companyId)
			.skipUndefined()
			.where('flag_boss', filter.flagBoss)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.subsidiariesId);
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static findByIdAndCompanyId(id, companyId, filter = {}) {
		return this.query()
			.eager('[bloodType(selectColumns), typeStaff(selectColumns), typeCharges(selectColumns), typeEmployee(selectColumns), typeRemuneration(selectColumns), controlDate(selectColumns).[retireMotivate(selectColumns), retireMotivateInsured(selectColumns)], relationship(selectColumns).[occupation(selectColumns), relationship(selectColumns)] ]')
			.select(this.defaultColumns())
			.where('com_companies_id', companyId)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.subsidiariesId)
			.findById(id);
	}

	static getAllByPayrollIdAndCompanyId(companyId, subsidiariesId, employeeIds, filter) {
		let query = this.query()
			.eager('[payrollDetails(selectColumns), typeEmployee(selectColumns), typeRemuneration(selectColumns), controlDate(selectColumns)]')
			.select(this.detailColumns())
			.where('com_companies_id', companyId)
			.where('com_subsidiaries_id', subsidiariesId);
		if (employeeIds && employeeIds.length > 0) {
			if (filter.isSelected && filter.isSelected === '1') {
				query.whereIn('id', employeeIds);
			} else if (filter.isSelected && filter.isSelected === '0') {
				query.whereNotIn('id', employeeIds);
			}
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static validEmployeeByRelationId(
		{
			staffId, companyId, costCenter, workingRelationship,
		},
		employeeId,
	) {
		return this.query()
			.select(this.defaultColumns())
			.where('com_companies_id', companyId)
			.skipUndefined()
			.where('staff_id', staffId)
			.skipUndefined()
			.where('charge_center_id', costCenter)
			.skipUndefined()
			.where('work_relationship_id', workingRelationship)
			.skipUndefined()
			.where('id', employeeId)
			.first();
	}
}

module.exports = EmployeesPayroll;
