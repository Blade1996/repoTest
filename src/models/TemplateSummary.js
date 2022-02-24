'use strict';

const sendMessage = require('./sqs');
const DocumentsSummaries = require('./DocumentsSummaries');
const Sales = require('./Sales');
const helper = require('./helper');
const StatusTax = require('./StatusTax');
const format = require('date-fns/format');
const TypePerson = require('./TypePerson');
const sqsTypes = require('./../sqs/sqsTypes');
const Country = require('./../models/Country');
const {
	configCompanySerie0,
	configCompanySerieP,
	configCompanySerieA,
} = require('../shared/helper');
const { ballotSunat, unsubscribeSunat } = require('./enums/type-summary-enums');

async function TemplateSummary(summaryDocuments, companyId, type) {
	const signature = type === sqsTypes.signature ? 1 : 0;
	const {
		id: referenceId,
		numericalIdentification,
		typeSummary,
		statusTax,
		authorization,
	} = summaryDocuments;
	const country = await Country.getByCode('PER');
	const { configTaxes } = country;
	let confTaxesIcbper;
	if (configTaxes) {
		confTaxesIcbper = configTaxes.ICBPER;
	}
	const typeDocumentCode = typeSummary === ballotSunat ? 'RC' : 'RA';
	const taxesJson = {
		authorization,
		verificar_registros: false,
		saleId: `${referenceId}${companyId}`,
		companyId,
		status: statusTax,
		flagIgv: null,
		signature,
		cabeceraDocumento: [],
		documentosRelacionados: [],
	};
	const cabeceraDocumento = [
		{
			version_del_UBL: '2.0',
			version_de_la_estructura_del_documento: '1.0',
			fecha_de_generacion: format(summaryDocuments.emissionDate, 'YYYY-MM-DD'),
			fecha_de_emision: helper.localDate(summaryDocuments.createdAt, 'YYYY-MM-DD HH:mm:ss'),
			apellidos_y_nombres_denominacion_o_razon_social: summaryDocuments.subsidiaryRzSocial,
			numeracion_identificador_resumen: numericalIdentification,
			numero_de_RUC: `${summaryDocuments.subsidiaryRuc}!6`,
			tipo_de_documento_catalogo_01: typeDocumentCode,
		},
	];

	if (typeSummary === ballotSunat) {
		cabeceraDocumento[0].tipo_de_moneda_en_la_cual_se_emite = summaryDocuments.currency;
		cabeceraDocumento[0].firma_digital = '';
	}

	taxesJson.cabeceraDocumento = cabeceraDocumento;
	const filter = summaryDocuments.flagCancelDocuments
		? { summaryUnsubscribeId: referenceId }
		: { ballotSummaryId: referenceId };
	const documentsRelated = await Sales.getDocumentByDocumentSummaryId(companyId, filter);
	const newDetails = documentsRelated.map((item, index) => {
		const { codeTaxes: codeTaxesDocument } = item.typeDocument;
		const infoDocument = item.documentNumber.split('-');
		let serieNumeric = infoDocument[0];
		if (serieNumeric.length !== 2) {
			serieNumeric = serieNumeric.slice(-2);
		}
		let qpCode = codeTaxesDocument === '03' ? 'BB' : 'FF';
		if (configCompanySerie0(companyId)) {
			qpCode = `${qpCode.substring(0, 1)}0`;
		}
		if (configCompanySerieP(companyId)) {
			qpCode = `${qpCode.substring(0, 1)}P`;
		}
		if (configCompanySerieA(companyId)) {
			qpCode = `${qpCode.substring(0, 1)}A`;
		}
		let serie = `${qpCode}${serieNumeric}`;
		if (codeTaxesDocument === '07') {
			const { typeDocument } = item.documentRelated;
			const codeTaxesR = typeDocument.codeTaxes;
			qpCode = codeTaxesR === '03' ? 'BB' : 'FF';
			if (configCompanySerie0(companyId)) {
				qpCode = `${qpCode.substring(0, 1)}0`;
			}
			if (configCompanySerieP(companyId)) {
				qpCode = `${qpCode.substring(0, 1)}P`;
			}
			if (configCompanySerieA(companyId)) {
				qpCode = `${qpCode.substring(0, 1)}A`;
			}
			serie = `${qpCode}${serieNumeric}`;
		}
		const newItem = {
			tipo_de_documento_catalogo_01: item.typeDocument.codeTaxes,
			numeracion_conformada_por_serie: serie,
			numero_correlativo: infoDocument[1],
			numero_de_orden_del_item: index + 1,
			saleId: item.id,
			correo_del_cliente: item.customer.email,
		};
		if (typeSummary === unsubscribeSunat) {
			newItem.motivo_o_sustento = summaryDocuments.commentary;
		} else if (typeSummary === ballotSunat) {
			let taxFactAmount = 0;
			if (item.taxesAmount) {
				let {
					recorded, inactive, exonerated, free, icbper,
				} = item.taxesAmount;
				recorded = recorded ? Number(recorded) : 0;
				inactive = inactive ? Number(inactive) : 0;
				exonerated = exonerated ? Number(exonerated) : 0;
				icbper = icbper ? Number(icbper) : 0;
				free = free ? Number(free) : 0;
				if (summaryDocuments.flagCancelDocuments) {
					newItem.estado_documento = 3;
				} else {
					newItem.estado_documento = 1;
				}
				if (codeTaxesDocument === '07') {
					const { typeDocument, documentNumber } = item.documentRelated;
					const documentNumberNew = documentNumber.split('-');
					let serieNumericNew = documentNumberNew[0];
					if (serieNumericNew.length !== 2) {
						serieNumericNew = serieNumericNew.slice(-2);
					}
					const codeTaxesR = typeDocument.codeTaxes;
					qpCode = codeTaxesR === '03' ? 'BB' : 'FF';
					if (configCompanySerie0(companyId)) {
						qpCode = `${qpCode.substring(0, 1)}0`;
					}
					if (configCompanySerieP(companyId)) {
						qpCode = `${qpCode.substring(0, 1)}P`;
					}
					if (configCompanySerieA(companyId)) {
						qpCode = `${qpCode.substring(0, 1)}A`;
					}
					serieNumericNew = `${qpCode}${serieNumericNew}`;
					newItem.serie_y_numero_de_documento_relacionado = `${codeTaxesR}!${serieNumericNew}-${
						documentNumberNew[1]
					}`;
				}
				if (item.customer && item.customer.msTypePerson) {
					newItem.tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario = `${
						item.customer.person.documentNumber
					}!${item.customer.msTypePerson.codeTaxes}`;
				} else {
					const codeTaxesNew =
						item.customer.flagTypePerson !== TypePerson.juridica &&
						item.customer.flagTypePerson !== TypePerson.ruc
							? '1'
							: '6';
					cabeceraDocumento[0].tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario = `${
						item.customer.typePerson.documentNumber
					}!${codeTaxesNew}`;
				}
				if (item.customer && item.customer.flagGeneric) {
					newItem.tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario = '00000000!1';
				}
				newItem.total_valor_de_venta_operaciones_gravadas = `${recorded.toFixed(2)}!01`;
				newItem.total_valor_de_venta_operaciones_inafectas = `${inactive.toFixed(2)}!02`;
				newItem.total_valor_de_venta_operaciones_exoneradas = `${exonerated.toFixed(2)}!03`;
				// newItem.total_valor_de_venta_operaciones_exportacion = `${exonerated.toFixed(2)}!04`;
				newItem.total_valor_de_venta_operaciones_gratuitas = `${free.toFixed(2)}!05`;
				newItem.sumatoria_otros_cargos = item.tip > 0 ? `true!${item.tip.toFixed(2)}` : 'true!0';
				newItem.sumatoria_IGV = `${item.formatNumbers.taxes}!${
					item.formatNumbers.taxes
				}!1000!IGV!VAT`;
				newItem.sumatoria_ISC = '!!!!';
				newItem.sumatoria_otros_tributos = '!!!!';
				newItem.importe_total_de_la_venta_o_sesion_en_uso_o_del_servicio_prestado = `${
					item.formatNumbers.amount
				}`;
				if (icbper > 0 && confTaxesIcbper) {
					const dateYear = helper.localDate(item.createdAt, 'YYYY');
					taxFactAmount = confTaxesIcbper.reduce((acum, auxItem) => {
						let newValue = acum;
						if (auxItem.year === dateYear.toString()) {
							newValue = auxItem.amount;
						} else if (auxItem.default && newValue === 0) {
							newValue = auxItem.amount;
						}
						return newValue;
					}, 0);
					newItem.sumatoria_ICBPER = `${icbper.toFixed(2)}!${taxFactAmount.toFixed(2)}!1000!ICBPER!OTH`;
				}
			}
		}
		return newItem;
	});
	taxesJson.documentosRelacionados = newDetails;

	const timeId = new Date().getTime();
	const id = `${referenceId}-${numericalIdentification}-${companyId}-${type}-${timeId}`;
	return DocumentsSummaries.edit(
		referenceId,
		{
			statusTax: StatusTax.inProcess,
			sunatError: 'Documento en proceso de envío',
		},
		companyId,
	)
		.then(() => {
			sendMessage(
				{
					idSale: referenceId,
					typeDocumentCode,
					idCompany: companyId,
					data: taxesJson,
					authorization,
				},
				type,
				id,
				process.env.SQS_FACT_URL,
			);
		})
		.catch(error => Promise.reject(error));
}

module.exports = TemplateSummary;
