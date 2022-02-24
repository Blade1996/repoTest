'use strict';

require('dotenv').config();
const Podium = require('podium');
const dbConfig = require('../../config/objection');
const Terminal = require('../../models/Terminal');
const MsTypeDocument = require('../../models/MsTypeDocument');
const SalSeries = require('../../models/SalSeries');
const Sales = require('../../models/Sales');
const ComSubsidiaries = require('../../models/ComSubsidiaries');
const { isNullOrUndefined } = require('util');
const { unSent, signature, signatureError } = require('../../models/StatusTax');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('conversionSaleNote');

async function conversionSaleNote() {
	try {
		const time = '05:00:00';
		const endTime = '08:00:00';
		const timeDate = new Date();
		const hours = timeDate.getHours();
		const minutes = timeDate.getMinutes();
		const seconds = timeDate.getSeconds();
		const timeLocal = `${`0${hours}`.slice(-2)}:${`0${minutes}`.slice(-2)}:${`0${seconds}`.slice(-2)}`;
		if (time < timeLocal && timeLocal < endTime) {
			const data = await Terminal.getListSaleTrasformCrom({ time, endTime });
			data.companyId = Number(data.companyId);
			if (isNullOrUndefined(data)) {
				return {};
			}
			const typeDocuments = await MsTypeDocument.getByCodes(1, ['NTV', 'BOL']); // validar esto no se puede hacer la operacion si no hay serie NTV o BOL
			const typeDocumentBol = typeDocuments.find(i => i.code === 'BOL');
			// se toma el ultimo documento validado como enviado
			const ultimateDocumentValid = await Sales.getByUltimateDocumentErrorSunat(
				data.id,
				data.companyId,
				[unSent, signature, signatureError],
				typeDocumentBol.id,
			);
			const countDocuments = await Sales.getByCountDocuments(
				data.id,
				data.companyId,
				ultimateDocumentValid && ultimateDocumentValid.id,
				[unSent, signature, signatureError],
				typeDocumentBol.id,
			);
			if (isNullOrUndefined(countDocuments)) {
				return Terminal.editSalesCronDate(data.id, data.companyId);
			}
			const quantity = Math.round((countDocuments.count * data.porcentage) / 100);
			const salesConversion = await Sales.getConversionSaleNote(
				data.id,
				data.companyId,
				ultimateDocumentValid && ultimateDocumentValid.id,
				quantity,
				[unSent, signature, signatureError],
				typeDocumentBol.id,
			);
			if (isNullOrUndefined(salesConversion)) {
				return Terminal.editSalesCronDate(data.id, data.companyId);
			}
			const typeDocumentNtv = typeDocuments.find(i => i.code === 'NTV');
			const series = await SalSeries.getAllSeriesCompaniesCrom(
				Number(data.companyId),
				data.comSubsidiariesId,
				data.id,
			);
			if (!series) {
				return Terminal.editSalesCronDate(data.id, data.companyId);
			}
			// eslint-disable-next-line max-len
			const serieN = series.find(s => s.salTerminalsId === data.id && s.salTypeDocumentsId === typeDocumentNtv.id);
			// eslint-disable-next-line max-len
			const serieB = series.find(s => s.salTerminalsId === data.id && s.salTypeDocumentsId === typeDocumentBol.id);

			if (!serieN || !serieB) {
				return Terminal.editSalesCronDate(data.id, data.companyId);
			}

			const newData = [];
			if (salesConversion && salesConversion.length > 0) {
				salesConversion.forEach((f) => {
					const newF = { ...f };
					newF.serieId = serieN.id;
					serieN.number = `${Number(serieN.number) + 1}`;
					serieB.number = `${Number(serieB.number) - 1}`;
					delete serieN.terminal;
					delete serieN.typeDocument;
					delete serieN.subsidiary;
					delete serieB.terminal;
					delete serieB.typeDocument;
					delete serieB.subsidiary;
					newData.push({
						id: newF.id,
						serie: serieN.serie,
						number: `${Number(serieN.number)}`,
						documentNumber: `${serieN.serie}-${Number(serieN.number)}`,
						serieId: serieN.serieId,
						salTypeDocumentId: serieN.salTypeDocumentsId,
					});
				});
			}
			const subsidiary = {
				id: data.comSubsidiariesId,
				companyId: data.companyId,
			};
			const datass = [{ ...serieN }, { ...serieB }];
			if (subsidiary) {
				// esta parte solo se debe hacer como referencia
				await ComSubsidiaries.editSalesCronDate(subsidiary.id, subsidiary.companyId);
			}
			await Terminal.editSalesCronDate(data.id, data.companyId);
			const updateMulti = await Sales.updateMultiple(newData, datass);
			return updateMulti;
		}
		return {};
	} catch (error) {
		return error;
	}
}

module.exports = conversionSaleNote;
