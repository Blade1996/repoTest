'use strict';

const Sales = require('./../models/Sales');
const ComDiscountDocuments = require('./../models/ComDiscountDocuments');
const SaleDocumentsDetail = require('./../models/SaleDocumentsDetail');
const ModuleCode = require('./../models/ModuleCode');
const { notDispatchable, pending } = require('./../models/enums/status-dispatch-guides-enum');
const { departureCotNotDispatched } = require('./../models/enums/type-document-external-enum');

async function afterCreate({
	newDownPaymentDocumentsIds,
	newRecord,
	exchangeNtcIds,
	companyId,
	saleOrigin,
	applyCoupon,
	dataValidOrigin,
}) {
	let downPaymentDocument = false;
	if (newDownPaymentDocumentsIds && newDownPaymentDocumentsIds.length > 0) {
		downPaymentDocument = true;
		const dataUpdate = { downPaymentDocumentId: newRecord.id };
		await Sales.editDocumentsRelatedToAdvances(newDownPaymentDocumentsIds, companyId, dataUpdate);
	}
	if (exchangeNtcIds) {
		await Sales.editFlagUseMultiple(companyId, exchangeNtcIds, true);
	}
	if (saleOrigin && saleOrigin.typeDocument.code === 'COT') {
		await SaleDocumentsDetail.editByIds(saleOrigin.details.map(i => i.id), saleOrigin.id, {
			salDocumentsId: newRecord.id,
			salDocumentsNumber: newRecord.documentNumber,
		});
	}
	if (applyCoupon && applyCoupon.length > 0) {
		await ComDiscountDocuments.createBatch(applyCoupon, newRecord.id);
	}
	if (dataValidOrigin && saleOrigin) {
		await Sales.editFlagUseAndDetails(companyId, {
			newRecord,
			saleOrigin,
			dataValidOrigin,
		});
	}
	return Promise.resolve({ downPaymentDocument });
}

function setParametersKardex({
	dataSale,
	country,
	exiMerchandise,
	settings,
	downPaymentDocument,
	details,
}) {
	const newDataSale = { ...dataSale };
	newDataSale.countryId = country;
	newDataSale.documentTypeCode = exiMerchandise;
	newDataSale.flagKardexValued = settings.flagKardexValued;
	newDataSale.downPaymentDocument = downPaymentDocument;
	newDataSale.details = dataSale.details.map((item) => {
		const newItem = { ...item };
		const p = details.find((i) => {
			const prodId = i.warProductsId === item.warProductsId;
			const unitCode = i.unitCode === item.unitCode;
			return prodId && unitCode;
		});
		if (p && p.flagControlSerie) {
			newItem.series = p.series;
		}
		return newItem;
	});

	if (dataSale.typeDocument.code === 'COT') {
		newDataSale.documentTypeCode = departureCotNotDispatched;
	}
	newDataSale.flagForceMoveKardex = !!settings[`${dataSale.typeDocument.code}MoveKardex`];
	return newDataSale;
}

function setParameterDetails({
	data, details, seriesDetail, employee,
}) {
	const newData = { ...data };
	let pointsTotal = 0;
	let onlyStorableProducts = 0;
	const newDetail = details.map((item) => {
		const newItem = { ...item };
		onlyStorableProducts += newItem.brandId && newItem.warWarehousesId ? 1 : 0;
		if (item.series && item.series.length > 0 && seriesDetail.length > 0) {
			const array = item.series.map(id => seriesDetail.find(it => it.id === id));
			newItem.additionalInformation = Object.assign(item.additionalInformation || {}, {
				series: array,
			});
		}
		if (employee.company && employee.company.flagLoyalti && item.productPoint) {
			pointsTotal += item.productPoint;
		}
		return newItem;
	});
	newData.details = newDetail;
	newData.totalPoints = pointsTotal;
	newData.sendKardexStatus = onlyStorableProducts === 0 ? notDispatchable : pending;
	newData.sendKardexMessage = onlyStorableProducts === 0 ? 'Venta no despachable' : null;
	return newData;
}

async function afterDelete({ httpNewProducts, companyId, id }) {
	return httpNewProducts.post('/kardex/recalculate', {
		companyId,
		documentId: id,
		moduleId: ModuleCode.sales,
		typeOperation: 0,
	});
}

module.exports = {
	afterCreate,
	setParametersKardex,
	setParameterDetails,
	afterDelete,
};
