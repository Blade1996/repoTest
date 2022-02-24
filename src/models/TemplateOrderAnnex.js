'use strict';

const sqs = require('./sqs');
const Sales = require('./Sales');
const Mapping = require('./Mapping');
const { raw, transaction } = require('objection');
const SalOrders = require('./SalOrders');
const ModuleCode = require('./ModuleCode');
const SalOrdersAnnex = require('./SalOrdersAnnex');
const MsTypePayment = require('./MsTypePayment');
const MsTypeDocument = require('./MsTypeDocument');
const SalExchangeRate = require('./SalExchangeRate');
const simpleAxios = require('./../api/shared/simple-axios');
const { validPaymentOrderByNdc, roundLimit } = require('./../shared/helper');
const { juridica, ruc, rucNatural } = require('./TypePerson');
const OrderAnnexEnum = require('./enums/orders-annex-enum.js');

class TemplateOrderAnnex {
	static async validDocumentAnnex(dataAnnex, authorization) {
		const {
			cashId,
			summary,
			companyId,
			documentsRelated,
			maxAmount,
			serieId,
			terminalId,
			warehouse,
			countryId,
			countryCode,
			employeeId,
			groupClient,
			currencyDefault,
			typeDocumentCode,
			flagAutoDocuments,
		} = dataAnnex;
		const filter = {
			orderIds: documentsRelated.orderIds,
			flagSale: false,
			relationAdd: ['customerSimple'],
		};
		let amountOrders = 0;
		const dataOrders = await SalOrders.getAllBasic(companyId, filter);
		const pendindOrders = [];
		let customer;
		let customerIdFix;
		dataOrders.forEach((i) => {
			let newtypeDocumentCode = typeDocumentCode;
			if (groupClient && groupClient.length > 0) {
				const randInt = roundLimit(1, groupClient.length - 1);
				customer = groupClient[randInt];
				customerIdFix = groupClient[randInt] && groupClient[randInt].id;
			}
			if (flagAutoDocuments) {
				// consultar informacion de clinetes o crear cliente
				const { customerBillId, dataBill, customer: customerOrder } = i;
				const { typeDocument, flagTypePerson } = dataBill || {};
				if (typeDocument === 'FAC') {
					customerIdFix =
						customerBillId ||
						(customer && customer.ruc && customer.id) ||
						(customerOrder && customerOrder.ruc && customerOrder.id);
				} else {
					customerIdFix =
						(customer && customer.ruc && customer.id) ||
						(flagTypePerson &&
							[juridica, ruc, rucNatural].indexOf(flagTypePerson) > -1 &&
							customerBillId) ||
						(customerOrder && customerOrder.ruc && customerOrder.id);
				}
				if (customerIdFix) {
					newtypeDocumentCode = 'FAC';
				}
			}
			const taxesJson = {
				id: i.id,
				authorization,
				orderIds: [],
				warehouse,
				countryId,
				countryCode,
				employeeId: i.employeeId || employeeId,
				maxAmount,
				serieId,
				cashId,
				terminalId,
				summary,
				customerIdFix,
				currencyDefault,
				typeDocumentCode: newtypeDocumentCode,
				flagAutoDocuments,
				customer,
				total: 0,
				quantity: 0,
			};
			amountOrders += i.total;
			taxesJson.orderIds.push(i.id);
			taxesJson.total += amountOrders;
			taxesJson.quantity += 1;
			pendindOrders.push(taxesJson);
		});
		return pendindOrders;
	}

	static structureOrders(annexId, dataOrder, type) {
		const taxesJson = { ...dataOrder, type };
		taxesJson.annexId = annexId;
		taxesJson.type = 'simple';
		if (
			taxesJson.quantity === 1 &&
			taxesJson.total > taxesJson.maxAmount &&
			taxesJson.maxAmount !== 0
		) {
			taxesJson.type = 'multiple';
		}
		return taxesJson;
	}

	static templateAnnex(annexId, structure, companyId, type) {
		const taxesJson = this.structureOrders(annexId, structure, type);

		const timeId = new Date().getTime();
		const sqsId = `${taxesJson.id}-${companyId}-${type}-${timeId}`;

		const dataRaw = {
			status: OrderAnnexEnum.pending,
			totalDocuments: raw('total_documents+??', [1]),
		};

		return SalOrdersAnnex.updateSimple(annexId, dataRaw, companyId)
			.then(() =>
				sqs(
					{
						idCompany: companyId,
						data: taxesJson,
					},
					type,
					sqsId,
					process.env.SQS_FACT_URL,
				))
			.catch(error => Promise.reject(error));
	}

	static geneteStructureOrders(payload, companyId, type) {
		const structureData = {};
		return SalExchangeRate.defaultRate()
			.then((exchangeData) => {
				structureData.exchangeRate = exchangeData.amount;
				return MsTypePayment.getAll({ countryId: payload.countryId }, 1);
			})
			.then((msTypePayment) => {
				structureData.msTypePayment = msTypePayment;
				const filter = {
					orderIds: payload.orderIds,
					relationAdd: ['details', 'customerSimple'],
					flagSale: false,
				};
				return SalOrders.getAllBasic(companyId, filter);
			})
			.then((orders) => {
				structureData.orders = orders;
				const { countryId } = payload;
				return validPaymentOrderByNdc(structureData.orders, {
					companyId,
					countryId,
					MsTypeDocument,
					Sales,
					ModuleCode,
				});
			})
			.then((paymentByNdc) => {
				structureData.paymentByNdc = paymentByNdc;
				return this.processingOrder(structureData, payload, type, companyId);
			})
			.catch(error => Promise.reject(error));
	}

	static async processingOrder(structureData, payload, type, companyId) {
		const totalOrders = structureData.orders.length;
		const {
			cashId,
			customer,
			warehouse,
			employeeId,
			terminalId,
			countryCode,
			authorization,
			currencyDefault,
			flagAutoDocuments,
		} = payload;
		let { serieId, customerIdFix, typeDocumentCode } = payload;
		if (payload.type === 'simple' && totalOrders === 1) {
			// eslint-disable-next-line no-console
			console.log('ORDERS', `TYPE_ORDER_${type}`, payload);
			const {
				orders, exchangeRate, msTypePayment, paymentByNdc,
			} = structureData;
			let [order] = orders;
			order = { ...order, currency: order.currency || currencyDefault };
			if (flagAutoDocuments) {
				// consultar informacion de clinetes o crear cliente
				const { customerBillId, dataBill, customer: customerOrder } = order;
				const { typeDocument } = dataBill || {};
				if (typeDocument === 'FAC') {
					customerIdFix =
						customerBillId ||
						(customer && customer.ruc && customer.id) ||
						(customerOrder && customerOrder.ruc && customerOrder.id);
				} else {
					customerIdFix =
						(customer && customer.ruc && customer.id) ||
						(customerOrder && customerOrder.ruc && customerOrder.id);
				}
				if (customerIdFix) {
					typeDocumentCode = 'FAC';
					serieId = undefined;
				}
			}
			const saleBuilt = Mapping.convertOrderToSale({
				terminalId,
				serieId,
				cashId,
				flagDispatch: false,
				order,
				employeeId,
				exchangeRate,
				warehouse,
				msTypePayment,
				countryCode,
				paymentByNdc,
				customerIdFix,
				typeDocumentCode,
			});
			return this.createSimpleSale(
				typeDocumentCode,
				saleBuilt,
				authorization,
				payload.id,
				companyId,
			);
		} else if (payload.type === 'multiple' && totalOrders === 1) {
			// eslint-disable-next-line no-console
			console.log('ORDERS', `TYPE_ORDER_${payload.type}`);
			return (
				this.updateStatusSales(payload.idSale, payload.idCompany, 'Documento firmado')
					// eslint-disable-next-line no-console
					.then(console.log)
					// eslint-disable-next-line no-console
					.catch(console.log)
			);
		}
		return Promise.resolve();
	}

	static createSimpleSale(typeDocumentCode, saleBuilt, authorization, orderId, companyId) {
		return simpleAxios
			.post(
				`${process.env.SELF_DOMAIN}/sale-documents/${typeDocumentCode}/type-document`,
				saleBuilt,
				{
					headers: {
						authorization,
					},
				},
			)
			.then((response) => {
				if (response.status === 201) {
					return SalOrders.updateFlagSale(orderId, companyId);
				}
				return Promise.reject(response);
			})
			.then(() => Promise.resolve())
			.catch((error) => {
				// eslint-disable-next-line no-console
				console.log('error createSimpleSale', error.response);
				const sunatError = {
					// eslint-disable-next-line max-len
					message:
						(error.response && error.response.data.message) || (error.data && error.data.message),
					statusCode: 400,
				};
				return Promise.reject(sunatError);
			});
	}

	static async updateSqsOrderAnnex(data, companyId) {
		try {
			const {
				id: orderId, annexId, orderIds, typeDocumentCode,
			} = data;

			const dataRaw = {
				status: raw(`CASE WHEN total_documents-1 = total_processed THEN ${OrderAnnexEnum.finalized} ELSE ${
					OrderAnnexEnum.processing
				} END`),
				totalProcessed: raw('total_processed+??', [1]),
			};

			const salOrderAnnexResulTx = await transaction(
				SalOrdersAnnex,
				SalOrders,
				async (SalOrdersAnnexTx, SalOrdersTx) => {
					const salOrder = await SalOrdersTx.getOrderBasic(orderId, companyId, undefined, true);
					if (!salOrder) {
						dataRaw.totalError = raw('total_error+??', [1]);
						await SalOrdersTx.updateFlagSale(orderIds[0], companyId, {
							additionalInfo: raw('JSON_SET(additional_info, "$.errorAnnex", "Error al crear documento de venta")'),
						});
					} else {
						const documentsAnnex = await SalOrdersAnnexTx.findById(annexId, companyId);
						const { summary } = documentsAnnex;
						const total = summary[`${typeDocumentCode}`] ? summary[`${typeDocumentCode}`] + 1 : 1;
						dataRaw.summary = raw(`JSON_SET(summary, "$.${typeDocumentCode}", ${total})`);
						dataRaw.totalRegistered = raw('total_registered+??', [1]);
					}
					return dataRaw;
				},
			);
			return Promise.resolve(salOrderAnnexResulTx);
		} catch (error) {
			return Promise.reject(error);
		}
	}

	static async updateDocumentAnnex(id, data, companyId, documentsRelated) {
		try {
			const purDocumentResulTx = await transaction(
				SalOrdersAnnex,
				SalOrders,
				async (SalOrdersAnnexTx, SalOrdersTx) => {
					const { detailsErrors, orderIds } = documentsRelated;

					await SalOrdersTx.updateFlagSale(orderIds[0], companyId, {
						additionalInfo: raw(`JSON_SET(additional_info, "$.errorAnnex", "${detailsErrors}")`),
					});
					const documentsAnnex = await SalOrdersAnnexTx.query()
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
}

module.exports = TemplateOrderAnnex;
