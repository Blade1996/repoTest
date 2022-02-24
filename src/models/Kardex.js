'use strict';

const simpleAxios = require('../api/shared/simple-axios');
const format = require('date-fns/format');
const SalesStates = require('./SalesStates');
const PurMsState = require('./PurMsState');
const MsTypeDocument = require('./MsTypeDocument');
const SaleStateMachine = require('./SaleStateMachine');
const ModuleCode = require('./ModuleCode');
const Module = require('./Module');
const { ungrouped } = require('./enums/product-group-enum');
const Country = require('./enums/country-enum');
const helper = require('../../src/shared/helper');
const { sqs, externalBd } = require('./enums/type-process-register-kardex-enum');
const { byBd } = require('./enums/type-register-kardex-enum');
const modules = require('./enums/module-data-enum');
const {
	tableSales,
	tableRemissionGuides,
	tableOrders,
	tablePurchases,
} = require('./enums/table-sales-purchases-enum');
const {
	exiMerchandise,
	merchandiseIntake,
	entryByReturnSale,
	orderReversalEntry,
	cotReversalEntry,
} = require('./enums/type-document-external-enum');
const { applyCalculation, applyNotCalculation } = require('./enums/status-operation-enums');

const IN_OPERATION = 1;
const OUT_OPERATION = 2;

function getAdditionalInformation(sale) {
	const additionalInformation = { flagKardexValued: !!sale.flagKardexValued };
	if (
		(sale.flagCancel && sale.documentTypeCode === entryByReturnSale) ||
		sale.flagExternalDispatched
	) {
		return {
			...additionalInformation,
			ruc: sale.subsidiary && sale.subsidiary.ruc,
			codeProject: (sale.company && sale.company.codeProject) || process.env.CODE_PROJECT,
			companyCode: sale.company && sale.company.aclCode,
			typeDocumentCode: sale.documentTypeCode,
			subsidiaryAclCode: sale.subsidiary && sale.subsidiary.subsidiaryAclCode,
			flagExternalOrderDispatched: sale.flagExternalDispatched,
		};
	}
	return additionalInformation;
}

function getModule(moduleId) {
	const data = Object.values(modules);
	return data.find(i => i.id === moduleId);
}

async function sendKardexToQueue(sale, typeOperation, companyId) {
	// downPaymentDocuments, details, employee, customer
	try {
		let flag = true;
		let flagInvolveStock = true;
		let typeDocumentName;
		let documentNumber;
		let moduleCode = ModuleCode.sales;
		const { downPaymentDocument, codeRepair, typeDocument } = sale;
		let processId;
		let tableNameJapi = tableSales;
		let description;
		if (!sale.remissionGuide && !sale.orderEcommerce) {
			flag = false;
			processId = `${sale.id}-${sale.serie}-${sale.number}-${companyId}`;
			if (sale.documentTypeCode === orderReversalEntry) {
				processId = `${processId}-${sale.orderId}-${orderReversalEntry}`;
			}
			if (sale.documentTypeCode === cotReversalEntry) {
				processId = `${processId}-${sale.salDocumentsId}-${cotReversalEntry}`;
			}
			if (codeRepair) {
				processId = `${processId}-${codeRepair}`;
			}
			if (
				((sale.salStatesId === SaleStateMachine.stateIds.finished ||
					sale.salStatesId === SaleStateMachine.stateIds.anuSunat ||
					sale.salStatesId === SaleStateMachine.stateIds.canceled ||
					sale.kardexRepair) &&
					MsTypeDocument.moveKardex(typeDocument.code)) ||
				sale.flagForceMoveKardex
			) {
				documentNumber = `${sale.serie}-${sale.number}`;
				typeDocumentName = typeDocument.name;
				flag = true;
			}
		} else if (sale.remissionGuide) {
			typeDocumentName = 'GUIA DE REMISION';
			documentNumber = sale.number;
			processId = `${sale.id}-${sale.serie}-${sale.number}-${companyId}`;
			tableNameJapi = tableRemissionGuides;
		} else if (sale.orderEcommerce) {
			typeDocumentName = 'PEDIDO ECOMMERCE';
			documentNumber = `${sale.number}`;
			flagInvolveStock = false;
			moduleCode = ModuleCode.ecommerce;
			processId = `${sale.id}-${sale.commerceId}-${sale.number}-${companyId}`;
			if (sale.documentTypeCode === orderReversalEntry) {
				processId = `${processId}-${sale.orderId}-${orderReversalEntry}`;
			}
			if (codeRepair) {
				processId = `${processId}-${codeRepair}`;
			}
			tableNameJapi = tableOrders;
			description =
				typeOperation === IN_OPERATION
					? 'Reingreso de productos por pedido anulado'
					: 'Salida de productos por pedido';
		}
		if (flag) {
			const { name: moduleName } = getModule(moduleCode);
			const kardexData = {
				companyId,
				id: sale.flagCancel ? `${processId}-cancel` : processId,
				documentId: sale.id,
				externalReferenceId: sale.externalReferenceId,
				kardex: [],
				typeOperation,
				documentTypeCode: sale.documentTypeCode,
				tableNameJapi,
				moduleName,
				flagCancel: sale.flagCancel,
			};
			// eslint-disable-next-line max-len
			const onlyStorableProducts = sale.details.filter(p => p.brandId && (p.warWarehousesId || p.warehouseId));
			kardexData.kardex = onlyStorableProducts.reduce((acum, product) => {
				const newAcum = [...acum];
				if (downPaymentDocument && product.flagDispatch) {
					return newAcum;
				}
				const newProduct = {
					saleDetailId: product.saleDetailId && codeRepair ? product.saleDetailId : product.id,
					productId: product.warProductsId || product.productId,
					warehouseId: product.warWarehousesId || product.warehouseId,
					documentNumber: `${documentNumber}`,
					documentId: sale.id,
					externalReferenceId: sale.externalReferenceId,
					documentType: typeDocumentName,
					brandId: product.brandId,
					quantity: product.unitQuantity ? product.unitQuantity : product.quantity,
					price: product.price || product.salePrice,
					priceCost: !sale.flagCancel && product.priceCost ? product.priceCost : 0,
					series: product.series,
					flagDispatch: flagInvolveStock,
					moduleId: moduleCode,
					moduleName,
					userId: sale.comEmployeeId,
					userName: sale.employee ? sale.employee.name : '',
					entityName:
						sale.customer && sale.customer.typePerson ? sale.customer.typePerson.fullName : '',
					tableName: tableNameJapi,
					operation: typeOperation === IN_OPERATION ? 1 : 0,
					groupType: product.groupType || ungrouped,
					statusOperation:
						sale.flagCancel && !sale.authorizationNumber ? applyNotCalculation : applyCalculation,
					typeProcessRegister: sale.typeRegisterKardex === byBd ? externalBd : sqs,
					companyId,
				};
				newProduct.additionalInformation = getAdditionalInformation(sale);
				newProduct.total = newProduct.priceCost ? newProduct.quantity * newProduct.priceCost : 0;
				newProduct.createdAt = sale.createdAt;
				newProduct.updatedAt = sale.createdAt;
				newProduct.operationDate = sale.createdAt;
				newProduct.description =
					description ||
					(newProduct.statusOperation === applyNotCalculation
						? 'Reingreso de productos por venta anulada'
						: 'Salida de productos por venta');
				newAcum.push(newProduct);
				return newAcum;
			}, []);
			return Promise.resolve(kardexData);
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

function getCostMN({ countryId, additionalInformation, currency }, priceCost = 0) {
	let newPriceCost = priceCost;
	const { exchangeRate } = additionalInformation || {};
	const { value } = exchangeRate || {};
	if (countryId === Country.peru && currency !== 'PEN' && value) {
		newPriceCost *= value;
		newPriceCost = helper.roundTo(newPriceCost);
	}
	return newPriceCost;
}

async function sendKardexPurchase(purchase, companyId, typeOperation = IN_OPERATION) {
	try {
		const {
			countryId, additionalInformation, currency, state, typeDocument,
		} = purchase;
		const moduleData = getModule(ModuleCode.purchases, true);
		if (PurMsState.moveKardex(state.code) && MsTypeDocument.moveKardex(typeDocument.code)) {
			const kardexData = {
				companyId,
				id: `${purchase.id}-${purchase.documentNumber}-${companyId}`,
				kardex: [],
				documentTypeCode: merchandiseIntake,
				tableNameJapi: tablePurchases,
				documentId: purchase.id,
				typeOperation,
				moduleName: moduleData.name,
				flagCancel: purchase.flagCancel,
			};
			const newDetails = purchase.details.map((product) => {
				const dateTime = new Date(purchase.dateDocument);
				let series = [];
				if (product.series && product.series.length) {
					series = product.series.map((i) => {
						const newI = { ...i };
						newI.productId = product.productId;
						newI.warehouseId = product.warWarehousesId;
						newI.brandId = product.brandId;
						newI.priceList = product.priceList;
						return newI;
					});
				}
				const newProduct = {
					saleDetailId: purchase.flagCancel ? null : product.id,
					productId: product.productId,
					brandId: product.brandId,
					warehouseId: purchase.warehouseId,
					documentNumber: `${purchase.documentNumber}`,
					documentId: purchase.id,
					documentType: typeDocument.name,
					flagDispatch: true,
					groupType: product.groupType || ungrouped,
					quantity: product.unitQuantity ? product.unitQuantity : product.quantity,
					priceCost: getCostMN({ countryId, additionalInformation, currency }, product.price),
					series,
					moduleId: ModuleCode.purchases,
					moduleName: moduleData.name,
					userId: purchase.comEmployeesId,
					userName: purchase.employee ? purchase.employee.name : '',
					entityName: purchase.supplier && purchase.supplier.name ? purchase.supplier.name : '',
					tableName: tablePurchases,
					operation: typeOperation === IN_OPERATION ? 1 : 0,
					createdAt: format(
						new Date(dateTime.setHours(dateTime.getHours() + 5)),
						'YYYY-MM-DD HH:mm:ss',
					),
					updatedAt: format(
						new Date(dateTime.setHours(dateTime.getHours() + 5)),
						'YYYY-MM-DD HH:mm:ss',
					),
					operationDate: purchase.dateDocument,
					description: 'Ingresa de productos por compra',
					additionalInformation: {
						ruc: purchase.subsidiary && purchase.subsidiary.ruc,
						codeProject:
							(purchase.company && purchase.company.codeProject) || process.env.CODE_PROJECT,
						companyCode: purchase.company && purchase.company.aclCode,
						typeDocumentCode: merchandiseIntake,
						subsidiaryAclCode: purchase.subsidiary && purchase.subsidiary.subsidiaryAclCode,
						lot: product.additionalInformation && product.additionalInformation.lot,
						flagKardexValued: !!purchase.flagKardexValued,
					},
					dueDate: product.additionalInformation && product.additionalInformation.expirationDate,
					statusOperation: applyCalculation,
					total: product.quantity * product.price,
					typeProcessRegister: purchase.typeRegisterKardex === byBd ? externalBd : sqs,
					companyId,
				};
				return newProduct;
			});
			kardexData.kardex = newDetails;
			return Promise.resolve(kardexData);
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

async function updateKardex(
	sale,
	typeOperation,
	{ hapiAxios, authorization },
	kardexUrl = 'kardex',
) {
	try {
		let flag = true;
		let typeDocumentName;
		let documentNumber;
		const tableNameJapi = tableSales;
		if (!sale.remissionGuide) {
			flag = false;
			const promises = [
				SalesStates.getById(sale.salStatesId),
				MsTypeDocument.getById(sale.salTypeDocumentId, undefined, { comCountryId: sale.countryId }),
			];
			const [state, typeDocument] = await Promise.all(promises);
			if (
				state.code === SaleStateMachine.stateCodes.finished &&
				MsTypeDocument.moveKardex(typeDocument.code)
			) {
				documentNumber = `${sale.serie}-${sale.number}`;
				typeDocumentName = typeDocument.name;
				flag = true;
			}
		}

		if (flag) {
			const { name: moduleName } = await Module.getById(ModuleCode.sales);
			const kardexData = {
				typeOperation,
				kardex: [],
				documentTypeCode: typeOperation === IN_OPERATION ? merchandiseIntake : exiMerchandise,
				tableNameJapi,
			};
			const onlyStorableProducts = sale.details.filter(p => p.brandId && p.warWarehousesId);
			kardexData.kardex = onlyStorableProducts.map((product) => {
				const newProduct = {
					productId: product.warProductsId,
					warehouseId: product.warWarehousesId,
					documentNumber: documentNumber || sale.number,
					documentId: sale.id,
					documentType: typeDocumentName || 'GUIA DE REMISION',
					brandId: product.brandId,
					quantity: product.unitQuantity ? product.unitQuantity : product.quantity,
					price: product.price,
					priceCost: product.priceCost || 0,
					series: product.series,
					flagDispatch: true,
					moduleId: ModuleCode.sales,
					moduleName,
					userId: sale.userId,
					userName: sale.employee ? sale.employee.name : '',
					entityName:
						sale.customer && sale.customer.typePerson ? sale.customer.typePerson.fullName : '',
					tableName: tableSales,
					operation: typeOperation === IN_OPERATION ? 1 : 0,
					statusOperation: sale.flagCancel ? applyNotCalculation : applyCalculation,
				};
				newProduct.total = newProduct.priceCost ? newProduct.quantity * newProduct.priceCost : 0;
				return newProduct;
			});
			if (!hapiAxios && authorization) {
				return simpleAxios.post(`${process.env.PRODUCTS_URL}/${kardexUrl}`, kardexData, {
					headers: {
						authorization,
					},
				});
			}
			return hapiAxios.post(`/${kardexUrl}`, kardexData);
		}
		return Promise.resolve();
	} catch (error) {
		return Promise.reject(error);
	}
}

const methods = {
	IN_OPERATION,
	OUT_OPERATION,
	sendKardexToQueue,
	updateKardex,
	sendKardexPurchase,
};

module.exports = methods;
