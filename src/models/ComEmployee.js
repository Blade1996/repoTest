'use strict';

const { Model, transaction, raw } = require('objection');
const helper = require('./helper');
const baseModel = require('./base');
const Person = require('./../models/Person');
const ComPerson = require('./../models/ComPerson');
const TypeEntity = require('./../models/TypeEntity');
const TerminalUser = require('./../models/TerminalUser');
const simpleAxios = require('../api/shared/simple-axios');
const stateConexion = require('./enums/state-conexion-devices-enums');
const { support, admin } = require('./enums/code-type-rol-enum');
const { configFilterDefault } = require('./../shared/validations');
const { isDevOrProd } = require('./../shared/helper');
const { isNullOrUndefined } = require('util');
const codeTypeRol = require('./enums/code-type-rol-enum');

class ComEmployee extends baseModel {
	static get tableName() {
		return 'com_employee';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'com_employee.company_id',
					to: 'com_companies.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'com_employee.com_subsidiaries_id',
					to: 'com_subsidiaries.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'com_employee.sal_terminals_id',
					to: 'sal_terminals.id',
				},
			},
			person: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Person.js`,
				join: {
					from: 'com_employee.person_id',
					to: 'ms_person.id',
				},
			},
			cash: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Cash.js`,
				join: {
					from: 'com_employee.cash_id',
					to: 'com_cash.id',
				},
			},
			devices: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Device.js`,
				filter: query =>
					query
						.where('com_devices.state_conexion', stateConexion.available)
						.where('com_devices.flag_active', 1)
						.orderBy('com_devices.created_at', 'desc'),
				join: {
					from: 'com_employee.id',
					to: 'com_devices.employee_id',
				},
			},
			dataSellers: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSeller.js`,
				join: {
					from: 'com_employee.id',
					to: 'com_sellers.employee_id',
				},
			},
			terminalsUser: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/TerminalUser.js`,
				join: {
					from: 'com_employee.id',
					to: 'com_terminal_users.user_id',
				},
			},
			delivery: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Delivery.js`,
				join: {
					from: 'com_employee.id',
					to: 'com_delivery.employee_id',
				},
			},
		};
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
			selectColumnsVendor: builder => builder.select(this.defaultColumnsVendor()),
			selectColumnsTerminal: builder => builder.select(this.defaultColumnsTerminal()),
			idOnly: builder => builder.select(`${this.tableName}.id`),
			aclBasicColumns: builder => builder.select('id', 'acl_user_code', 'email'),
		};
	}

	static get virtualAttributes() {
		return ['fullname', 'autocomplete'];
	}

	get fullname() {
		let fullname = this.name;
		if (this.lastname) {
			fullname = `${this.name} ${this.lastname}`;
		}
		return fullname;
	}

	get autocomplete() {
		const name = this.name ? this.name : '';
		const lastname = this.lastname ? this.lastname : '';
		const documentNumber = this.documentNumber ? this.documentNumber : '';
		const code = this.code ? this.code : '';
		const email = this.email ? this.email : '';

		const autocomplete = `${name} ${lastname} ${documentNumber} ${code} ${email}`;
		return autocomplete;
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['comSubsidiariesId', 'name', 'email'],
			properties: {
				code: {
					type: 'string',
				},
				aclUserId: {
					type: 'integer',
				},
				roleId: {
					type: 'integer',
				},
				appId: {
					type: 'integer',
				},
				housekeepingScore: {
					type: 'integer',
				},
				comSubsidiariesId: {
					type: 'integer',
				},
				comMsStateEmpId: {
					type: 'integer',
				},
				warWarehousesId: {
					type: ['integer', 'null'],
				},
				salTerminalsId: {
					type: ['integer', 'null'],
				},
				name: {
					type: 'string',
				},
				lastname: {
					type: ['string', 'null'],
				},
				nationality: {
					type: 'string',
				},
				email: {
					type: 'string',
				},
				phone: {
					type: ['string', 'null'],
				},
				gender: {
					type: 'integer',
				},
				dateBirth: {
					type: 'date',
				},
				civilStatus: {
					type: 'date',
				},
				sonNumber: {
					type: 'integer',
				},
				group: {
					type: 'integer',
				},
				dateHealing: {
					type: 'date',
				},
				languages: {
					type: 'json',
				},
				subsidiaries: {
					type: 'json',
				},
				urlImage: {
					type: 'string',
				},
				codeTypeRol: {
					type: ['string', 'null'],
				},
				tokenDevice: {
					type: 'string',
				},
				configFilters: {
					type: ['object', 'null'],
				},
				flagAdmin: {
					type: ['integer', 'null'],
					default: 1,
				},
				aclUserCode: {
					type: 'string',
				},
				flagActive: {
					type: 'boolean',
				},
				personId: {
					type: ['integer', 'null'],
				},
				flagTypePerson: {
					type: ['integer', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				level: {
					type: ['string', 'null'],
				},
				cashId: {
					type: ['integer', 'null'],
				},
				flagDisplayStock: {
					type: 'boolean',
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static defaultColumns() {
		return [
			'id',
			'acl_user_id',
			'com_subsidiaries_id',
			'war_warehouses_id',
			'sal_terminals_id',
			'name',
			'lastname',
			'email',
			'url_image',
			'code_type_rol',
			'flag_admin',
			'acl_user_code',
			'code',
			'role_id',
			'specialty',
			'level',
			'phone',
			'token_device',
			'config_filters',
			'flag_active',
			'person_id',
			'flag_type_person',
			'document_number',
			'company_id',
			'cash_id',
			'flag_display_stock',
			'additional_information',
		];
	}

	static defaultColumnsVendor(otherColumns = []) {
		let columns = [
			'id',
			'name',
			'lastname',
			'email',
			'url_image',
			'code',
			'role_id',
			'specialty',
			'phone',
			'flag_type_person',
			'document_number',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static defaultColumnsTerminal(otherColumns = []) {
		let columns = [
			'id',
			'name',
			'lastname',
			'email',
			'url_image',
			'flag_admin',
			'acl_user_code',
			'code',
			'role_id',
			'specialty',
			'phone',
			'flag_type_person',
			'document_number',
			'token_device',
			'flag_active',
			'person_id',
			'flag_type_person',
			'document_number',
			'company_id',
		].map(c => `${this.tableName}.${c}`);
		columns = columns.concat(otherColumns);
		return columns;
	}

	static match(query, search) {
		query.whereRaw('MATCH(name, lastname, email, code) AGAINST(?)', [search]);
		return query;
	}

	static setCashClosing(typeRolCode) {
		return [codeTypeRol.vendor, codeTypeRol.reseller].indexOf(typeRolCode) > -1;
	}

	static validAdminRoleGlobal(typeRolCode) {
		return (
			[codeTypeRol.superAdmin, codeTypeRol.admin, codeTypeRol.support].indexOf(typeRolCode) > -1
		);
	}

	static getAclFilters(aclFilters = {}) {
		const newAclFilters = { ...aclFilters };
		const { warehouses: warehousesConfig = {} } = newAclFilters;
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
				subsidiaries.values && subsidiaries.values.length > 0 ? subsidiaries.values : undefined,
		};
	}

	static getAll(filter = {}, companyId, aclFilters = {}) {
		let query = this.query()
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			})
			.skipUndefined()
			.where('war_warehouses_id', filter.warehouseId)
			.skipUndefined()
			.where('cash_id', filter.cashId)
			.skipUndefined()
			.where('com_subsidiaries_id', filter.subsidiaryId);

		if (aclFilters && aclFilters.warehouses) {
			query.aclFilter(aclFilters.warehouses, this.tableName);
		}

		if (filter.warehouseIds && filter.warehouseIds.length > 0) {
			query.whereIn('war_warehouses_id', filter.warehouseIds);
		}

		if (filter.subsidiaries && filter.subsidiaries.length > 0) {
			query.whereIn('com_subsidiaries_id', filter.subsidiaries);
		}

		if (filter.flagActive) {
			query = query.where('flag_active', filter.flagActive);
		}
		if (filter.search) {
			query = this.match(query, filter.search);
		}
		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static getQuantityOfEmployee(companyId) {
		return this.query()
			.where('company_id', companyId)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			})
			.count('*')
			.first();
	}

	static getAllProduction(filter = {}, companyId, ids) {
		const { search } = filter;
		let query = this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.whereIn('id', ids)
			.where('company_id', companyId)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			});

		if (search) {
			query = this.match(query, search);
		}
		const result = this.includePaginationAndSort(query, filter);
		return result;
	}

	static getByCash(cashId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('cash_id', cashId)
			.where('company_id', companyId);
	}

	static getAllCash() {
		return this.query()
			.select(this.defaultColumns())
			.where('cash_id', null)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			});
	}

	static getById(id, trx) {
		return this.query(trx)
			.select(this.defaultColumns())
			.findById(id);
	}

	static getBySalTerminalId(salTerminalsId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('sal_terminals_id', salTerminalsId)
			.where('flag_active', true)
			.where('company_id', companyId)
			.first();
	}

	static getByAclUserCode(code) {
		return this.query()
			.eager('[company(basicColumns), subsidiary(selectColumns), terminal(selectColumns), cash(selectColumns), dataSellers(selectColumns), delivery(selectColumns)]')
			.select(this.defaultColumns())
			.where('acl_user_code', code)
			.first();
	}

	static getByFlagAdmin(comCompaniesId) {
		return this.query()
			.eager('[subsidiary(selectColumns), terminal(selectColumns), cash(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', comCompaniesId)
			.where('flag_admin', true)
			.first();
	}

	static create(data, trx) {
		const newData = { ...data };
		newData.configFilters = !isNullOrUndefined(data.configFilters)
			? data.configFilters
			: configFilterDefault();
		return this.query(trx).insert(newData);
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.skipUndefined()
			.where('company_id', companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static getByEmail(email, companyId) {
		return this.query()
			.select('id')
			.where('email', email)
			.where('company_id', companyId)
			.first();
	}

	static getByCode(code, companyId) {
		return this.query()
			.select('id')
			.where('code', code)
			.where('company_id', companyId)
			.first();
	}

	static getAllReport(id, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.skipUndefined()
			.where('id', id)
			.skipUndefined()
			.where('company_id', companyId)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			});
	}

	static getBySubsidiary(subsidiaryId) {
		return this.query()
			.select(this.defaultColumns())
			.eager('[company(selectColumns).country(selectColumns), subsidiary(selectColumns), terminal(selectColumns), cash(selectColumns)]')
			.where('com_subsidiaries_id', subsidiaryId)
			.where((builder) => {
				builder.where('code_type_rol', '!=', support).orWhereNull('code_type_rol');
			})
			.first();
	}

	static updateDisplayStock(ids, flagDisplayStock, companyId) {
		return this.query()
			.patch({ flagDisplayStock })
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static getAllByIds(ids, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.whereIn('id', ids)
			.where('company_id', companyId);
	}

	static async createDelivery(
		dataDelivery,
		{ password, url = '/user/registerapps', roleCodeGlobal },
		company,
		authorization,
	) {
		const newData = { ...dataDelivery };
		const knex = ComEmployee.knex();
		const result = await transaction(knex, async (trx) => {
			const dataPerson = await Person.getByDocument(newData.documentNumber);
			let newComPerson;
			if (dataPerson) {
				let flag = false;
				const dataComPerson = await ComPerson.getById(dataPerson.id, newData.companyId);
				if (dataComPerson) {
					if (dataComPerson.typeEntity !== TypeEntity.delivery) {
						flag = true;
					} else {
						newComPerson = dataComPerson;
					}
				} else {
					flag = true;
				}
				if (flag) {
					newComPerson = await ComPerson.create(
						{
							personId: dataPerson.id,
							companyId: newData.companyId,
							aclCode: newData.code,
							typeEntity: TypeEntity.delivery,
							aclId: null,
							email: newData.email,
						},
						trx,
					);
				}
			} else {
				newComPerson = await ComPerson.createMultiple(
					{
						companyId: newData.companyId,
						aclCode: newData.code,
						typeEntity: TypeEntity.delivery,
						aclId: null,
						email: newData.email,
						person: {
							documentNumber: newData.documentNumber,
							fullname: `${newData.name} ${newData.lastname}`,
							flagTypePerson: newData.flagTypePerson,
							nationality: null,
							email: newData.email,
						},
					},
					trx,
				);
			}
			newData.personId = newComPerson.personId;

			const newRecord = await ComEmployee.create(
				{
					...newData,
					codeTypeRol: newData.roleCodeGlobal || roleCodeGlobal || admin,
				},
				trx,
			);
			if (isDevOrProd()) {
				try {
					const dataAcl = {
						nombreComercial: `${newData.name} ${newData.lastname}`,
						razonSocial: `${newData.name} ${newData.lastname}`,
						ruc: newData.documentNumber,
						codeProject: process.env.CODE_PROJECT,
						flagEdit: newData.flagEdit || false,
						email: newData.email,
						roleId: newData.roleId,
						codeTypeRole: newData.roleCodeGlobal || roleCodeGlobal || admin,
						password,
						status: 1,
						codeUser: newData.code,
						aclUserCode: newData.email,
						codeApps: ['makidriver'],
					};
					if (company && company.hash) {
						dataAcl.hash = company.hash;
					}
					const headers = authorization ? { authorization } : undefined;
					await simpleAxios.post(`${process.env.ACL_URL}${url}`, dataAcl, { headers });
				} catch (error) {
					if (
						error.response.status === 400 ||
						error.response.status === 500 ||
						error.response.status === 405
					) {
						return trx.rollback(error);
					}
				}
			}
			return Promise.resolve(newRecord);
		});
		return result;
	}

	static async createEmployee(
		data,
		{
			terminalId, warehouseId, password, url = '/user/registerapps', dataExternal, terminal,
		},
		codeCompany,
		httpAcl,
	) {
		const newData = { ...data };
		const knex = ComEmployee.knex();
		const result = await transaction(knex, async (trx) => {
			const dataPerson = await Person.getByDocument(newData.documentNumber);
			let newComPerson;
			if (dataPerson) {
				let flag = false;
				const dataComPerson = await ComPerson.getById(dataPerson.id, newData.companyId);
				if (dataComPerson) {
					if (dataComPerson.typeEntity !== TypeEntity.employee) {
						flag = true;
					} else {
						newComPerson = dataComPerson;
					}
				} else {
					flag = true;
				}
				if (flag) {
					newComPerson = await ComPerson.create(
						{
							personId: dataPerson.id,
							companyId: newData.companyId,
							aclCode: newData.code,
							typeEntity: TypeEntity.employee,
							aclId: null,
							email: newData.email,
						},
						trx,
					);
				}
			} else {
				newComPerson = await ComPerson.createMultiple(
					{
						companyId: newData.companyId,
						aclCode: newData.code,
						typeEntity: TypeEntity.employee,
						aclId: null,
						email: newData.email,
						person: {
							documentNumber: newData.documentNumber,
							fullname: `${newData.name} ${newData.lastname}`,
							flagTypePerson: newData.flagTypePerson,
							nationality: null,
							email: newData.email,
						},
					},
					trx,
				);
			}
			newData.personId = newComPerson.personId;
			newData.salTerminalsId = terminalId;
			newData.warWarehousesId = warehouseId;
			const terminalArray =
				newData.terminals && Array.isArray(newData.terminals)
					? [...newData.terminals]
					: { ...newData.terminals };
			delete newData.terminals;
			const newRecord = await ComEmployee.create(newData, trx);
			if (terminalId) {
				let dataTerminalUser;
				if (Array.isArray(terminalArray) && terminalArray.length > 0) {
					dataTerminalUser = terminalArray.map(item => ({
						terminalId: item.terminalId,
						userId: newRecord.id,
						name: item.name || null,
						flagDefault: item.flagDefault || false,
						companyId: newData.companyId,
					}));
				} else {
					dataTerminalUser = {
						name: terminal && terminal.name,
						terminalId: newData.salTerminalsId,
						userId: newRecord.id,
						companyId: newData.companyId,
					};
				}
				await TerminalUser.createMultiple(dataTerminalUser, trx);
			}
			if (isDevOrProd()) {
				try {
					const dataAcl = {
						email: newData.email,
						password,
						codeUser: newData.code,
						status: true,
						codeCompany,
						roleId: newData.roleId,
					};
					await httpAcl.post(url, dataExternal || dataAcl);
				} catch (error) {
					if (
						error.response.status === 400 ||
						error.response.status === 500 ||
						error.response.status === 405
					) {
						return trx.rollback(error);
					}
				}
			}
			return Promise.resolve(newRecord);
		});
		return result;
	}

	static updateConfigFilters(id, updateDataEmployee, companyId, trx) {
		return this.query(trx)
			.patch(updateDataEmployee)
			.where('id', id)
			.where('company_id', companyId);
	}

	static findByConfigFilter(employees, { warehouseId }) {
		return employees.filter((emp) => {
			const warehousesId =
				emp.configFilters &&
				emp.configFilters.warehouses &&
				emp.configFilters.warehouses.warehouses &&
				emp.configFilters.warehouses.warehouses.values;
			return warehousesId && warehousesId.find(w => w === warehouseId);
		});
	}

	static getAllButMe(id, companyId, trx) {
		return this.query(trx)
			.whereNot('id', id)
			.where('company_id', companyId);
	}

	static deleteAllButMe(id, companyId, trx) {
		return this.query(trx)
			.softDelete()
			.whereNot('id', id)
			.where('company_id', companyId);
	}

	static async buildAndCreateEmployee(data, httpAcl, trx) {
		const configFilters = configFilterDefault(
			[data.warehouse.id],
			[data.subsidiary.id],
			[data.commerce.id],
		);
		const employeeBuilt = {
			comSubsidiariesId: data.subsidiary.id,
			name: data.name,
			lastname: data.surName,
			code: data.email,
			email: data.email,
			phone: data.phone,
			flagAdmin: 1,
			flagTypePerson: data.flagTypePerson,
			documentNumber: data.documentNumber,
			configFilters,
			companyId: data.company.id,
			aclUserCode: data.email,
			codeTypeRol: data.roleCodeGlobal || admin,
			roleId: data.roleId,
			additionalInformation: {
				plan: data.jsonPlan && data.jsonPlan.employeePlan,
			},
		};
		const aclUser = {
			nombreComercial: `${data.name} ${data.surName}`,
			razonSocial: `${data.name} ${data.surName}`,
			ruc: data.documentNumber,
			hash: data.company.hash,
			codeProject: process.env.CODE_PROJECT,
			flagEdit: data.flagEdit || false,
			email: data.email,
			roleId: data.roleId,
			codeTypeRole: data.roleCodeGlobal || admin,
			password: data.password,
			status: 1,
			codeUser: data.email,
			aclUserCode: data.email,
			codeApps: data.codeApps,
		};
		const employee = await ComEmployee.createEmployeeNoTrx(
			employeeBuilt,
			{
				terminalId: data.terminal.id,
				warehouseId: data.warehouse.id,
				password: data.password,
				url: '/user-company',
				dataExternal: aclUser,
				terminal: data.terminal,
			},
			data.company.aclCode,
			httpAcl,
			trx,
		);
		return employee;
	}

	static async createEmployeeNoTrx(
		data,
		{
			terminalId, warehouseId, password, url = '/user/registerapps', dataExternal, terminal,
		},
		codeCompany,
		httpAcl,
		trx,
	) {
		const newData = { ...data };
		const dataPerson = await Person.getByDocument(newData.documentNumber);
		let newComPerson;
		if (dataPerson) {
			let flag = false;
			const dataComPerson = await ComPerson.getById(dataPerson.id, newData.companyId);
			if (dataComPerson) {
				if (dataComPerson.typeEntity !== TypeEntity.employee) {
					flag = true;
				} else {
					newComPerson = dataComPerson;
				}
			} else {
				flag = true;
			}
			if (flag) {
				newComPerson = await ComPerson.create(
					{
						personId: dataPerson.id,
						companyId: newData.companyId,
						aclCode: newData.code,
						typeEntity: TypeEntity.employee,
						aclId: null,
						email: newData.email,
					},
					trx,
				);
			}
		} else {
			newComPerson = await ComPerson.createMultiple(
				{
					companyId: newData.companyId,
					aclCode: newData.code,
					typeEntity: TypeEntity.employee,
					aclId: null,
					email: newData.email,
					person: {
						documentNumber: newData.documentNumber,
						fullname: `${newData.name} ${newData.lastname}`,
						flagTypePerson: newData.flagTypePerson,
						nationality: null,
						email: newData.email,
					},
				},
				trx,
			);
		}
		newData.personId = newComPerson.personId;
		newData.salTerminalsId = terminalId;
		newData.warWarehousesId = warehouseId;
		const terminalArray =
			newData.terminals && Array.isArray(newData.terminals)
				? [...newData.terminals]
				: { ...newData.terminals };
		delete newData.terminals;
		const newRecord = await ComEmployee.create(newData, trx);
		if (terminalId) {
			let dataTerminalUser;
			if (Array.isArray(terminalArray) && terminalArray.length > 0) {
				dataTerminalUser = terminalArray.map(item => ({
					terminalId: item.terminalId,
					userId: newRecord.id,
					name: item.name || null,
					flagDefault: item.flagDefault || false,
					companyId: newData.companyId,
				}));
			} else {
				dataTerminalUser = {
					name: terminal && terminal.name,
					terminalId: newData.salTerminalsId,
					userId: newRecord.id,
					companyId: newData.companyId,
				};
			}
			await TerminalUser.createMultiple(dataTerminalUser, trx);
		}
		if (isDevOrProd()) {
			try {
				const dataAcl = {
					email: newData.email,
					password,
					codeUser: newData.code,
					status: true,
					codeCompany,
					roleId: newData.roleId,
				};
				await httpAcl.post(url, dataExternal || dataAcl);
			} catch (error) {
				if (
					error.response.status === 400 ||
					error.response.status === 500 ||
					error.response.status === 405
				) {
					return trx.rollback(error);
				}
			}
		}
		return newRecord;
	}

	static async getSalesEmployeePdf(filter = {}, companyId, warehouseIds) {
		const query = this.query()
			.select([
				raw('com_employee.name AS nameEmployee'),
				raw('com_employee.document_number'),
				raw('com_employee.phone'),
				raw('com_employee.email'),
				raw('JSON_EXTRACT(com_employee.additional_information, "$.percentageWin") as percentage'),
				raw('(CASE WHEN JSON_EXTRACT(com_employee.additional_information, "$.percentageWin") THEN (JSON_EXTRACT(com_employee.additional_information, "$.percentageWin") / 100) * sum(sd.amount) ELSE sum(sd.amount) END)  as amountPercentage'),
				raw('ANY_VALUE((CASE WHEN sd.amount_credit > 0 THEN sum(sd.amount_credit) ELSE null END))  as totalAmountCredit'),
				raw('ANY_VALUE((CASE WHEN sd.amount_cash > 0 THEN sum(sd.amount_cash) ELSE null END))  as totalAmountCash'),
				raw('sum(sd.taxes) as totaIvas'),
				raw('sum(sd.amount) as amount'),
			])
			.join('sal_documents as sd', 'sd.com_employee_id', `${this.tableName}.id`)
			.join('com_ms_type_documents as ctd', 'ctd.id', 'sd.sal_type_document_id')
			.skipUndefined()
			.where('sd.com_subsidiary_id', filter.comSubsidiaryId)
			.skipUndefined()
			.where('sd.terminal_id', filter.terminalId)
			.where('sd.com_company_id', companyId)
			.whereIn('ctd.code', ['BOL', 'FAC', 'NTV'])
			.where('sd.sal_states_id', '!=', 3)
			.groupBy('com_employee.id');
		if (warehouseIds && warehouseIds.length > 0) {
			query.whereIn('sd.warehouse_id', warehouseIds);
		}
		if (filter.employeeIds && filter.employeeIds.length > 0) {
			query.whereIn('com_employee.id', filter.employeeIds);
		}
		if (filter.flagNotNotes) {
			query.whereNotIn('sd.sal_type_document_id', filter.flagNotNotes);
		}
		if (filter.startDate && filter.endDate) {
			query.whereRaw('DATE(CONVERT_TZ(sd.created_at, "+05:00", "+00:00")) >= ?', filter.startDate);
			query.whereRaw('DATE(CONVERT_TZ(sd.created_at, "+05:00", "+00:00")) <= ?', filter.endDate);
		}
		const result = await query;
		const data = result.map((element) => {
			const newe = element;
			newe.percentage = newe.percentage ? JSON.parse(element.percentage) : 0;
			return newe;
		});
		return data;
	}
}

module.exports = ComEmployee;
