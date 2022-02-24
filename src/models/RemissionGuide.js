'use strict';

const objection = require('objection');
const { Model } = require('objection');
const baseModel = require('./base');
const helper = require('./helper');
const SaleDocumentsDetail = require('./SaleDocumentsDetail');
const SalSeries = require('./SalSeries');
const format = require('date-fns/format');
const StatusDispatch = require('./enums/status-dispatch-guides-enum');

class RemissionGuide extends baseModel {
	static get tableName() {
		return 'sal_remission_guides';
	}

	static get relationMappings() {
		return {
			company: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Company.js`,
				join: {
					from: 'sal_remission_guides.company_id',
					to: 'com_companies.id',
				},
			},
			sales: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Sales.js`,
				join: {
					from: 'sal_remission_guides.sal_sale_documents_id',
					to: 'sal_documents.id',
				},
			},
			employee: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComEmployee.js`,
				join: {
					from: 'sal_remission_guides.employee_id',
					to: 'com_employee.id',
				},
			},
			details: {
				relation: Model.HasManyRelation,
				modelClass: `${__dirname}/RemissionGuideDetail.js`,
				join: {
					from: 'sal_remission_guides.id',
					to: 'sal_remission_guides_detail.sal_remission_guide_id',
				},
			},
			courier: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Courier.js`,
				join: {
					from: 'sal_remission_guides.courier_id',
					to: 'com_courier.id',
				},
			},
			delivery: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Delivery.js`,
				join: {
					from: 'sal_remission_guides.delivery_id',
					to: 'com_delivery.id',
				},
			},
			subsidiary: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/ComSubsidiaries.js`,
				join: {
					from: 'sal_remission_guides.subsidiary_id',
					to: 'com_subsidiaries.id',
				},
			},
			terminal: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/Terminal.js`,
				join: {
					from: 'sal_remission_guides.terminal_id',
					to: 'sal_terminals.id',
				},
			},
			salSerie: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalSeries.js`,
				join: {
					from: 'sal_remission_guides.serie_id',
					to: 'sal_series.id',
				},
			},
			order: {
				relation: Model.HasOneRelation,
				modelClass: `${__dirname}/SalOrders.js`,
				join: {
					from: 'sal_remission_guides.order_id',
					to: 'sal_orders.id',
				},
			},
		};
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['companyId', 'number', 'employeeId'],
			properties: {
				salSaleDocumentsId: {
					type: 'integer',
				},
				number: {
					type: 'string',
				},
				employeeId: {
					type: 'integer',
				},
				transportData: {
					type: ['object', 'null'],
				},
				driverCelphone: {
					type: ['string', 'null'],
				},
				destination: {
					type: ['string', 'null'],
				},
				driverName: {
					type: ['string', 'null'],
				},
				driverLicensePlate: {
					type: ['string', 'null'],
				},
				driverLicense: {
					type: ['string', 'null'],
				},
				observation: {
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
				courierId: {
					type: ['integer', 'null'],
				},
				additionalInformation: {
					type: ['array', 'null'],
					default: [],
				},
				serieId: {
					type: ['integer', 'null'],
				},
				serie: {
					type: ['string', 'null'],
				},
				documentNumber: {
					type: ['string', 'null'],
				},
				warehouseId: {
					type: ['integer', 'null'],
				},
				terminalId: {
					type: ['integer', 'null'],
				},
				subsidiaryId: {
					type: ['integer', 'null'],
				},
				route: {
					type: ['string', 'null'],
				},
				rzSocialAddressee: {
					type: ['string', 'null'],
				},
				reason: {
					type: ['string', 'null'],
				},
				recipientDocument: {
					type: ['string', 'null'],
				},
				originAddress: {
					type: ['string', 'null'],
				},
				establishmentCode: {
					type: ['string', 'null'],
				},
				flagGroup: {
					type: ['boolean', 'null'],
					default: false,
				},
				statusDispatch: {
					type: ['integer', 'null'],
					default: 1,
				},
				dateRegisteKardex: {
					type: ['date', 'null'],
				},
				sendKardexStatus: {
					type: ['integer', 'null'],
				},
				sendKardexMessage: {
					type: ['string', 'null'],
				},
				deliveryId: {
					type: ['integer', 'null'],
				},
				transportAgencyId: {
					type: ['integer', 'null'],
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
			'sal_sale_documents_id',
			'number',
			'employee_id',
			'transport_data',
			'driver_celphone',
			'destination',
			'driver_name',
			'driver_license_plate',
			'driver_license',
			'observation',
			'authorization_number',
			'authorization_date',
			'environment',
			'emission',
			'password',
			'url_password',
			'state_document_tax',
			'msg_sri',
			'url_xml',
			'created_at',
			'courier_id',
			'additional_information',
			'serie_id',
			'serie',
			'document_number',
			'warehouse_id',
			'terminal_id',
			'subsidiary_id',
			'route',
			'flag_group',
			'rz_social_addressee',
			'reason',
			'recipient_document',
			'origin_address',
			'departure_date',
			'arrival_date',
			'establishment_code',
			'status_dispatch',
			'date_register_kardex',
			'send_kardex_status',
			'send_kardex_message',
			'delivery_id',
			'transport_agency_id',
		].map(c => `${this.tableName}.${c}`);

		columns = columns.concat(otherColumns);

		return columns;
	}

	static get virtualAttributes() {
		return ['createdAtSri', 'statusTaxName'];
	}

	get createdAtSri() {
		return format(this.createdAt, 'DD/MM/YYYY');
	}

	get statusTaxName() {
		let data = { name: 'sin enviar', color: 'black', showDetails: false };
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

	static match(query, search) {
		query.whereRaw(
			'MATCH(number, transport_data, driver_celphone, destination, driver_name, driver_license_plate, driver_license, observation) AGAINST(?)',
			[search],
		);
		return query;
	}

	static getAll(filter = {}, companyId) {
		let query = this.query()
			.eager('[sales(selectColumns), employee(selectColumns), details(selectColumns), courier(selectColumns)]')
			.select(this.defaultColumns())
			.skipUndefined()
			.where('employee_id', filter.employeeId)
			.skipUndefined()
			.where('state_document_tax', filter.stateDocumentTax)
			.where('company_id', companyId);

		if (filter.search) {
			query = this.match(query, filter.search);
		}
		if (filter.startDate && filter.endDate) {
			query.whereBetween('created_at', [filter.startDate, filter.endDate]);
		}

		query = this.includePaginationAndSort(query, filter);
		return query;
	}

	static async create(data, Sales, states) {
		const newData = { ...data };
		const knex = RemissionGuide.knex();
		return objection.transaction(knex, async (trx) => {
			if (newData.serieId) {
				const serieData = await SalSeries.editNumber(data.serieId, data.companyId, trx);
				newData.serie = serieData.serie;
				newData.number = serieData.number;
				newData.documentNumber = `${newData.serie}-${newData.number}`;
			}
			const newRecord = await this.query(trx).insertGraph(newData);
			if (newRecord.salSaleDocumentsId) {
				const newdetails = newRecord.details;
				const documentIds = newdetails.map(item => item.salSaleDocumentsDetailId);
				await SaleDocumentsDetail.editFlagDispatch(documentIds, newRecord.id, trx);
				if (states && Sales) {
					await Sales.editStatesId(data.companyId, newRecord.salSaleDocumentsId, states.id, trx);
				}
			}
			return newRecord;
		});
	}

	static getById(id, companyId) {
		return this.query()
			.eager('[salSerie(selectColumns), company(selectColumns).country(selectColumns), terminal(selectColumns), subsidiary(selectColumns), courier(selectColumns).typePerson(selectColumns), sales(selectColumns).[company(selectColumns), subsidiary(selectColumns), payment(selectColumns), typeDocument(documentTypeData), customer(selectColumns)], employee(selectColumns), details(selectColumns).saleDetail(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static getByIdsBilling(ids, companyId) {
		return this.query()
			.eager('[salSerie(selectColumns), company(selectColumns).country(selectColumns), terminal(selectColumns), subsidiary(selectColumns), courier(selectColumns).typePerson(selectColumns), delivery(selectColumns).[typePerson(selectColumns), vehicle(selectColumns)], sales(selectColumns).[company(selectColumns), subsidiary(selectColumns), payment(selectColumns), typeDocument(documentTypeData), customer(selectColumns)], employee(selectColumns), details(selectColumns).saleDetail(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.whereIn('id', ids);
	}

	static getByIdSimple(id, companyId) {
		return this.query()
			.eager('[company(selectColumns), subsidiary(selectColumns), courier(selectColumns).typePerson(selectColumns), sales(selectColumns).[typeDocument(documentTypeData), customer(selectColumns)], order(selectColumns).[customer(selectColumns)], employee(selectColumns), details(selectColumns).saleDetail(selectColumns)]')
			.select(this.defaultColumns())
			.where('company_id', companyId)
			.findById(id);
	}

	static getByCourier(courierId, companyId) {
		return this.query()
			.select(this.defaultColumns())
			.where('courier_id', courierId)
			.where('company_id', companyId)
			.first();
	}

	static edit(id, data, companyId) {
		return this.query()
			.patch(data)
			.where('id', id)
			.where('company_id', companyId);
	}

	static remove(id) {
		return this.query()
			.softDelete()
			.where('id', id);
	}

	static editSendKardexStatus(ids, message) {
		return this.query()
			.patch({ sendKardexStatus: StatusDispatch.delivered, sendKardexMessage: message })
			.whereIn('id', ids);
	}

	static removeByOrder(orderId, companyId) {
		return this.query()
			.softDelete()
			.where('order_id', orderId)
			.where('company_id', companyId);
	}

	static removeByOrderIds(orderIds, companyId) {
		return this.query()
			.softDelete()
			.whereIn('order_id', orderIds)
			.where('company_id', companyId);
	}
}

module.exports = RemissionGuide;
