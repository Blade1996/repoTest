/* eslint-disable max-len */
/* eslint-disable no-console */

'use strict';

const sqs = require('./sqs');
const simpleAxios = require('./../api/shared/simple-axios');
const AwsUploadFile = require('./AwsUploadFile');
const sqsTypes = require('./../sqs/sqsTypes');
const helper = require('./helper');
const Sales = require('./Sales');
const StatusTax = require('./StatusTax');
const TypePerson = require('./TypePerson');
const DocumentsSummaries = require('./DocumentsSummaries');
const {
	configCompanySerie0,
	configCompanySerieP,
	configCompanySerieA,
	isNullOrUndefined,
} = require('../shared/helper');
const TypeSummary = require('./enums/type-summary-enums');

class TemplateSales {
	static newNumber(number) {
		let newN = number;
		if (newN.length < 8) {
			while (newN.length < 8) {
				newN = `0${newN}`;
			}
		}
		return newN;
	}

	static async structureSale(dataSale, companyId, type) {
		try {
			const { configTaxes } = dataSale.company.country;
			let confTaxesIcbper;
			if (configTaxes) {
				confTaxesIcbper = configTaxes.ICBPER;
			}
			let filePdfSale = dataSale.dataResponseTaxes;
			let signature = 0;
			if (type === sqsTypes.signature) {
				if (
					isNullOrUndefined(filePdfSale) ||
					!(dataSale.dataResponseTaxes && dataSale.dataResponseTaxes.documentUrl)
				) {
					filePdfSale = await AwsUploadFile(dataSale, dataSale.templateCode);
				}
				signature = 1;
			}
			let { serie, number } = dataSale;
			if (serie.length !== 2) {
				serie = serie.slice(-2);
			}
			number = this.newNumber(number);
			const { codeTaxes: codeTaxesDocument } = dataSale.typeDocument;
			let qpCode = codeTaxesDocument === '03' ? 'BB' : 'FF';
			if (dataSale.company && configCompanySerie0(dataSale.company.id)) {
				qpCode = `${qpCode.substring(0, 1)}0`;
			}
			if (dataSale.company && configCompanySerieP(dataSale.company.id)) {
				qpCode = `${qpCode.substring(0, 1)}P`;
			}
			if (dataSale.company && configCompanySerieA(dataSale.company.id)) {
				qpCode = `${qpCode.substring(0, 1)}A`;
			}
			let documentNumber = `${qpCode}${serie}-${number}`;
			let documentNumberR;
			let codeTaxesR;
			if (codeTaxesDocument === '07') {
				const {
					serie: serieRelated,
					number: numberRelated,
					typeDocument,
				} = dataSale.documentRelated;
				codeTaxesR = typeDocument.codeTaxes;

				qpCode = codeTaxesR === '03' ? 'BB' : 'FF';
				if (dataSale.company && configCompanySerie0(dataSale.company.id)) {
					qpCode = `${qpCode.substring(0, 1)}0`;
				}
				if (dataSale.company && configCompanySerieP(dataSale.company.id)) {
					qpCode = `${qpCode.substring(0, 1)}P`;
				}
				if (dataSale.company && configCompanySerieA(dataSale.company.id)) {
					qpCode = `${qpCode.substring(0, 1)}A`;
				}
				documentNumber = `${qpCode}${serie}-${number}`;
				number = this.newNumber(numberRelated);
				serie = serieRelated;
				if (serieRelated.length !== 2) {
					serie = serieRelated.slice(-2);
				}
				documentNumberR = `${qpCode}${serie}-${number}`;
			}
			const taxesJson = {
				authorization: dataSale.authorization,
				verificar_registros: false,
				saleId: dataSale.id,
				companyId,
				status: dataSale.statusTax,
				flagIgv: dataSale.company.flagIgv,
				signature,
				cabeceraDocumento: [],
				itemsDocumento: [],
				typeCatalogCode: codeTaxesDocument === '07' ? dataSale.typeCatalogSunat.code : '',
			};
			const mtoIGV = dataSale.formatNumbers.taxes;
			const cabeceraDocumento = [
				{
					link_documento_digital_pdf: filePdfSale && filePdfSale.documentUrl,
					fecha_de_emision: helper.localDate(dataSale.createdAt, 'YYYY-MM-DD HH:mm:ss'),
					firma_digital: '',
					apellidos_y_nombres_denominacion_o_razon_social: dataSale.subsidiaryRzSocial,
					nombre_comercial: dataSale.subsidiaryName,
					domicilio_fiscal: `150131!${dataSale.subsidiaryAddress}!!LIMA!LIMA!!PE`,
					numero_de_RUC: `${dataSale.subsidiaryRuc}!6`,
					tipo_de_documento_catalogo_01: dataSale.typeDocument.codeTaxes,
					numeracion_conformada_por_serie_y_numero_correlativo: documentNumber,
					appelidos_y_nombres_del_adquiriente_o_usuario: dataSale.customer.typePerson.fullName,
					total_valor_de_venta_operaciones_gravadas: `1001!${dataSale.formatNumbers.subtotal}`,
					total_valor_de_venta_operaciones_inafectas: '1002!0.00',
					total_valor_de_venta_operaciones_exoneradas: '1003!0.00',
					sumatoria_IGV: `${mtoIGV}!${mtoIGV}!1000!IGV!VAT`,
					sumatoria_ISC: '!!!!',
					sumatoria_ICBPER: '!!!!',
					sumatoria_otros_tributos: '!!!!',
					sumatoria_otros_cargos: dataSale.tip > 0 ? `${dataSale.tip}` : '',
					total_descuentos: '!',
					tipo_y_numero_de_la_guia_de_remision_relacionada_con_la_operacion_que_se_factura: '¦',
					tipo_de_numero_de_otro_documento_y_codigo_relacionado_con_la_opcion_que_se_factura: '¦',
					version_del_UBL: '2.0',
					version_de_la_estructura_del_documento: '1.0',
					valor_referencial_del_servicio_de_transporte_de_bienes_realizado_por_via_terrestre: '!',
					nombre_y_matricula_de_la_embarcacion_pesquera_utilizada_para_efectuar_la_extraccion: '!',
					descripcion_del_tipo_y_cantidad_de_la_especie_vendida: '!',
					series_y_numeros_de_documentos_relacionados_por_anticipos: '¦¦¦¦!¦¦¦¦',
					importe_total_de_las_ventas_por_concepto_de_anticipos: '',
					importe_de_las_ventas_menos_base_imponible: `${dataSale.formatNumbers.subtotal}!${
						dataSale.formatNumbers.amount
					}`,
					lugar_de_la_descarga: '!',
					fecha_de_la_descarga: '!',
					numero_de_registro_MTC: '!',
					configuracion_vehicular: '!',
					punto_de_origen: '!',
					punto_de_destino: '!',
					valor_referencial_preliminar: '!',
					fecha_de_consumo: '!',
					total_valor_de_venta_operaciones_gratuitas: '',
					porcentaje_de_detraccion: '',
					codigo_de_bienes_y_servicios_sujetos_al_sistema: '',
					numero_de_cuenta_del_proveedor_en_el_banco_de_la_nacion: '',
					orden_de_compra: '',
					condiciones_de_pago: 0,
					fecha_de_vencimiento: '',
					observacion: '',
					direccion_del_cliente: dataSale.customer.address || '',
					correo_del_cliente: dataSale.customer.email || '',
					tipo_de_cambio: dataSale.formatNumbers.exchangeRate,
					extraOficial_paciente: '',
					extraOficial_prf_nro: '',
					extraOficial_plan: '',
					extraOficial_caja: '',
					extraOficial_s_caja: '',
					extraOficial_usuario: 'MJARAMILLO',
					extraOficial_correo_contacto: dataSale.subsidiary ? dataSale.subsidiary.email : '',
					extraOficial_cf: '',
					extraOficial_sf: '',
				},
			];
			if (
				dataSale.caDocument &&
				dataSale.caDocument.details &&
				dataSale.caDocument.details.length > 0
			) {
				let feeDocument = '';
				dataSale.caDocument.details.forEach((i) => {
					feeDocument +=
						feeDocument !== ''
							? `!${i.expirationDate}¦${i.amount.toFixed(2)}`
							: `${i.expirationDate}¦${i.amount.toFixed(2)}`;
				});
				cabeceraDocumento[0].observacion = feeDocument;
				cabeceraDocumento[0].condiciones_de_pago = dataSale.caDocument.details.length;
			}
			if (dataSale.customer && dataSale.customer.msTypePerson) {
				cabeceraDocumento[0].tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario = `${
					dataSale.customer.typePerson.documentNumber
				}!${dataSale.customer.msTypePerson.codeTaxes}`;
			} else {
				const codeTaxesNew =
					dataSale.customer.flagTypePerson !== TypePerson.juridica &&
					dataSale.customer.flagTypePerson !== TypePerson.ruc
						? '1'
						: '6';
				cabeceraDocumento[0].tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario = `${
					dataSale.customer.typePerson.documentNumber
				}!${codeTaxesNew}`;
			}
			if (dataSale.customer && dataSale.customer.flagGeneric) {
				cabeceraDocumento[0].tipo_y_numero_de_documento_de_identidad_del_adquiriente_o_usuario =
					'00000000!1';
			}
			let taxFactAmount = 0;
			if (dataSale.taxesAmount) {
				let {
					recorded, inactive, exonerated, icbper, free,
				} = dataSale.taxesAmount;
				recorded = recorded ? Number(recorded) : 0;
				inactive = inactive ? Number(inactive) : 0;
				exonerated = exonerated ? Number(exonerated) : 0;
				free = free ? Number(free) : 0;
				icbper = icbper ? Number(icbper) : 0;
				cabeceraDocumento[0].total_valor_de_venta_operaciones_gravadas = `1001!${recorded.toFixed(2)}`;
				cabeceraDocumento[0].total_valor_de_venta_operaciones_inafectas = `1002!${inactive.toFixed(2)}`;
				cabeceraDocumento[0].total_valor_de_venta_operaciones_exoneradas = `1003!${exonerated.toFixed(2)}`;
				cabeceraDocumento[0].total_valor_de_venta_operaciones_gratuitas = `1004!${free.toFixed(2)}`;
				if (icbper > 0 && confTaxesIcbper) {
					const dateYear = helper.localDate(dataSale.createdAt, 'YYYY');
					taxFactAmount = confTaxesIcbper.reduce((acum, item) => {
						let newValue = acum;
						if (item.year === dateYear.toString()) {
							newValue = item.amount;
						} else if (item.default && newValue === 0) {
							newValue = item.amount;
						}
						return newValue;
					}, 0);
					cabeceraDocumento[0].sumatoria_ICBPER = `${icbper.toFixed(2)}!${taxFactAmount.toFixed(2)}!1000!ICBPER!OTH`;
				}
			}

			if (codeTaxesDocument === '07') {
				cabeceraDocumento[0].codigo_del_tipo_de_nota_de_credito_electronica = `${documentNumberR}!${
					dataSale.typeCatalogSunat.code
				}`;
				cabeceraDocumento[0].serie_y_numero_del_documento_que_modifica = documentNumberR;
				cabeceraDocumento[0].importe_total = dataSale.formatNumbers.amount;
				cabeceraDocumento[0].monto_en_letras = `1000¦${dataSale.amountInWords}`;
				cabeceraDocumento[0].motivo_o_sustento = dataSale.typeCatalogSunat.description;
				cabeceraDocumento[0].tipo_de_documento_del_documento_que_modifica = codeTaxesR;
				cabeceraDocumento[0].tipo_de_moneda_en_la_cual_se_emite_la_nota_de_credito_electronica =
					dataSale.currency;

				cabeceraDocumento[0].documento_de_referencia_guia_de_remision = '';
				cabeceraDocumento[0].documento_de_referencia_otros_documentos_relacionados = '';
			} else {
				cabeceraDocumento[0].descuentos_globales = dataSale.discountGlobal
					? `${dataSale.discountGlobal.toFixed(2)}`
					: '';
				cabeceraDocumento[0].direccion_en_el_pais_del_adquiriente_o_lugar_de_destino = '';
				cabeceraDocumento[0].importe_de_la_percepcion_de_la_moneda_nacional = '!!!';
				cabeceraDocumento[0].importe_total_de_la_venta_o_sesion_en_uso_o_del_servicio_prestado =
					dataSale.formatNumbers.amount;
				cabeceraDocumento[0].leyendas = `1000¦${dataSale.amountInWords}`;
				cabeceraDocumento[0].tipo_de_moneda_en_la_cual_se_emite_la_factura_electronica =
					dataSale.currency;
			}
			if (dataSale.discount) {
				// total descuentos por item!!
				cabeceraDocumento[0].total_descuentos = `2005!${dataSale.discount}`;
			}
			if (dataSale.flagAdvance) {
				cabeceraDocumento[0].tipo_de_documento_catalogo_51 = '0101';
			}
			const { downPaymentDocuments } = dataSale;
			if (downPaymentDocuments && downPaymentDocuments.length > 0) {
				let textDocument = '';
				let totalAmount = 0;
				downPaymentDocuments.forEach((downPayment) => {
					let { serie: serieNew, number: numberNew } = downPayment;
					if (serieNew.length !== 2) {
						serieNew = serieNew.slice(-2);
					}
					numberNew = this.newNumber(numberNew);
					totalAmount += downPayment.amount;
					textDocument += textDocument !== '' ? '!' : '';
					qpCode = 'FF';
					if (dataSale.company && configCompanySerie0(dataSale.company.id)) {
						qpCode = `${qpCode.substring(0, 1)}0`;
					}
					if (dataSale.company && configCompanySerieP(dataSale.company.id)) {
						qpCode = `${qpCode.substring(0, 1)}P`;
					}
					if (dataSale.company && configCompanySerieA(dataSale.company.id)) {
						qpCode = `${qpCode.substring(0, 1)}A`;
					}
					textDocument += `${downPayment.amount}¦02¦${qpCode}${serieNew}¦${
						dataSale.customer.msTypePerson.codeTaxes
					}¦${numberNew}`;
				});
				cabeceraDocumento[0].series_y_numeros_de_documentos_relacionados_por_anticipos = textDocument;
				cabeceraDocumento[0].importe_total_de_las_ventas_por_concepto_de_anticipos = totalAmount.toFixed(2);

				// ->setMtoImpVenta(136) // subTotal - Anticipos: 236 - 100
				let mtoImpVenta = dataSale.formatNumbers.amount;
				mtoImpVenta -= totalAmount;
				cabeceraDocumento[0].importe_total_de_la_venta_o_sesion_en_uso_o_del_servicio_prestado = mtoImpVenta.toFixed(2);

				const codeDiscount = '05';
				// if (mtoImpVenta === 0) {
				// 	codeDiscount = '05';
				// }
				cabeceraDocumento[0].total_descuentos = `${codeDiscount}!${totalAmount}`;
				// descuentos de anticipos  MtoOperGravadas
				// Sumatoria (detalles) menos descuentos globales (anticipo): 200 - 100
				// ->setMtoIGV(18)
			}
			taxesJson.cabeceraDocumento = cabeceraDocumento;
			let cont = 0;
			let freeIgvAmount = 0;
			const newDetails = dataSale.details.map((item) => {
				let amount = item.subtotalWithoutTax;
				cont += 1;
				let value = '!';
				amount = amount ? amount.toFixed(2) : '0.00';
				const newUnitPrice = item.unitPrice.toFixed(5);
				if (item.discount) {
					let newDiscount = item.unitPrice * item.quantity;
					const discountPercentage = item.discountPercentage / 100;
					newDiscount *= discountPercentage;
					value = `${discountPercentage.toFixed(2)}!${newDiscount.toFixed(2)}`;
				}
				let codeTaxes;
				let codeIgvAfect = '20';
				if (item.codeTaxes === '02' && !item.flagFree) {
					codeTaxes = '20';
				} else if (item.codeTaxes === '03' && !item.flagFree) {
					codeTaxes = '30';
					codeIgvAfect = '30';
				} else {
					codeTaxes = item.codeTaxes && item.flagFree ? '02' : '01';
				}
				const newItem = {
					unidad_de_medida_por_item: 'NIU',
					cantidad_de_unidades_por_item: item.formatNumbers.quantity,
					descripcion_detallada_del_servicio_prestado: `${item.product.name} - ${
						item.product.description
					}`.substr(0, 250),
					valor_unitario_por_item: newUnitPrice,
					precio_de_venta_unitario_por_item_y_codigo: `${item.formatNumbers.price}!${codeTaxes}`,
					afectacion_al_IGV_por_item: `0.00!0.00!${codeIgvAfect}!1000!IGV!VAT`,
					sistema_de_ISC_por_item: '!!!!!',
					afectacion_al_ICBPER_por_item: '!!!!!',
					valor_de_venta_por_item: amount,
					numero_de_orden_del_item: `${cont}`,
					codigo_del_producto: `${item.product.code}|${item.product.codeProductCubso || ''}`,
					valor_referencial_unitario_por_item_en_operaciones_no_onerosas_y_codigo: `${
						item.formatNumbers.freeAmount
					}!${codeTaxes}`,
					descuentos_por_item: value,
				};
				const taxAmountNumber = item.taxAmount || 0;
				const taxNumber = item.tax || 0;
				if ((taxAmountNumber > 0 && taxNumber > 0) || item.flagFree) {
					const { taxAmount, tax, freeAmount } = item.formatNumbers;
					let typeAffectationIgv = '10';
					if (item.codeTaxes === '02' && item.flagFree) {
						typeAffectationIgv = '21';
					} else if (item.flagFree) {
						typeAffectationIgv = '11';
					}
					const typeTaxes = item.flagFree ? '9996' : '1000';
					if (typeAffectationIgv === '11' || typeAffectationIgv === '21') {
						freeIgvAmount += Number(taxAmount); // Suma Igv de productos gratis
						newItem.valor_unitario_por_item = '0.00';
					}
					// Referencia del valor de documentos producto gratuito.
					const taxValid = tax / 100;
					const freeBase = Number(freeAmount) / (1 + taxValid);
					newItem.afectacion_al_IGV_por_item = `${taxAmount}!${tax}!${typeAffectationIgv}!${typeTaxes}!IGV!VAT`;
					newItem.valor_referencial_unitario_por_item_en_operaciones_no_onerosas_y_codigo = `${freeBase.toFixed(5)}!${codeTaxes}`;
				}
				if (item.taxes) {
					const detailIcbper = item.taxes.find(i => i.taxSchemeName === 'ICBPER');
					if (detailIcbper && confTaxesIcbper) {
						newItem.afectacion_al_ICBPER_por_item = `${detailIcbper.amount.toFixed(2)}!${taxFactAmount.toFixed(2)}!10!1000!ICBPER!OTH`;
					}
				}
				return newItem;
			});
			if (freeIgvAmount && freeIgvAmount > 0) {
				let { free } = dataSale.taxesAmount;
				free = free ? Number(free) - freeIgvAmount : 0;
				cabeceraDocumento[0].sumatoria_IGV_GRATUITA = `${freeIgvAmount.toFixed(5)}!${freeIgvAmount.toFixed(5)}!9996!GRA!FRE`;
				cabeceraDocumento[0].total_valor_de_venta_operaciones_gratuitas = `1004!${free.toFixed(2)}`;
			}
			taxesJson.itemsDocumento = newDetails;

			return { taxesJson };
		} catch (error) {
			console.log('errorerrorerrorerror', error);
			return { error };
		}
	}

	static sendBillingProcess(payload, sqsFlow, type, sqsId) {
		if (!sqsFlow) {
			return this.connectToTaxesBiller(payload, false, type);
		}
		return sqs(payload, type, sqsId, process.env.SQS_FACT_URL);
	}

	static async facturacion(dataSale, companyId, type) {
		const { taxesJson, error: errorVenta } = await this.structureSale(dataSale, companyId, type);
		if (!taxesJson && errorVenta) {
			return Sales.updateStatusTax(dataSale.id, companyId, {
				status: StatusTax.error,
				messageError: 'Observación en venta, contactar con el área de Soporte',
			});
		}
		const timeId = new Date().getTime();
		const id = `${dataSale.id}-${dataSale.serie}-${dataSale.number}-${companyId}-${type}-${timeId}`;
		return Sales.updateStatusTax(dataSale.id, companyId, {
			status: StatusTax.inProcess,
			messageError: 'Documento en proceso de envío',
		})
			.then(() => {
				const payload = {
					idSale: dataSale.id,
					idCompany: companyId,
					data: taxesJson,
					authorization: dataSale.authorization,
				};
				return TemplateSales.sendBillingProcess(payload, true, type, id);
			})
			.catch(error => Promise.reject(error));
	}

	static async facturacionByCron(dataSale, companyId, type) {
		const { eligibleToSend, errorService } = await this.verifyDocumentInTaxesBiller(
			dataSale.id,
			companyId,
		);
		if (errorService) {
			// TODO Implement service error manage.
			console.log('ERROR_VERIFYING_DOCUMENT', dataSale.id);
			return {};
		}
		if (!eligibleToSend) {
			return this.updateStatusSales(
				dataSale.id,
				companyId,
				StatusTax.validated,
				'Documento enviado a la SUNAT',
				undefined,
				true,
			)
				.then(console.log)
				.catch(console.log);
		}
		const { taxesJson } = await this.structureSale(dataSale, companyId, type);
		const payload = {
			idSale: dataSale.id,
			idCompany: companyId,
			data: taxesJson,
			authorization: dataSale.authorization,
		};
		return Sales.updateCronCounter(dataSale.id, companyId)
			.then(() => TemplateSales.sendBillingProcess(payload, false, sqsTypes.sunat))
			.then(response => response);
	}

	static connectToTaxesBiller(payload, sqsFlow, type) {
		return simpleAxios
			.post(`${process.env.FAC_SUNAT_URL}/process-json`, payload.data)
			.then((response) => {
				if (response.data.success === 0) {
					console.log('FACTURACION-ELECTRONICA ERROR', payload.idSale, response.data);
					const sunatError = {
						...response.data,
						message: response.data.msgError,
						statusCode: 200,
					};
					return this.handleProcessingError(sunatError, sqsFlow, payload, type);
				}
				console.log('FACTURACION-ELECTRONICA OK', payload.idSale, response.data);
				return this.handleMessageProcessed(sqsFlow, payload, type);
			})
			.catch((error) => {
				if (error.response.status === 400) {
					const sunatError = {
						...error.response.data,
						message: error.response.data.msgError,
						statusCode: 400,
					};
					return this.handleProcessingError(sunatError, sqsFlow, payload, type);
				}
				return Promise.reject(error.response.data.msgError);
			});
	}

	static handleProcessingError(sunatError, sqsFlow, payload, type) {
		if (!sqsFlow) {
			return this.processingTaxesError(sunatError, payload, type);
		}
		return Promise.reject(sunatError.message);
	}

	static processingTaxesError(err, payload, type) {
		if (type === sqsTypes.sunat) {
			console.log('DOCUMENTO_NO_VALIDADO', `DOC_NO_VALIDATED_${payload.idSale}`, err);
			if (['RC', 'RA'].indexOf(payload.typeDocumentCode) > -1) {
				const typeSummary =
					payload.typeDocumentCode === 'RC'
						? TypeSummary.ballotSunat
						: TypeSummary.unsubscribeSunat;
				return this.updateStatusSummary(payload.idSale, payload.idCompany, {
					status: StatusTax.error,
					messageError: err.message,
					typeSummary,
					authorization: payload.authorization,
					flagCancelDocuments: payload.flagCancelDocuments,
				})
					.then(console.log)
					.catch(console.log);
			}
			const { statusTax, message } = this.handleStatusTaxError(err.message);
			return this.updateStatusSales(payload.idSale, payload.idCompany, statusTax, message)
				.then(console.log)
				.catch(console.log);
		} else if (type === sqsTypes.signature) {
			console.log('DOCUMENTO_NO_FIRMADO', `DOC_NO_SIGNATURE_${payload.idSale}`, err);
			return this.updateStatusSales(
				payload.idSale,
				payload.idCompany,
				StatusTax.signatureError,
				err.message,
			)
				.then(console.log)
				.catch(console.log);
		}
		return Promise.reject(err);
	}

	static handleMessageProcessed(sqsFlow, payload, type) {
		if (!sqsFlow) {
			return this.processingTaxesSuccess(payload, type);
		}
		return Promise.resolve();
	}

	static processingTaxesSuccess(payload, type) {
		if (type === sqsTypes.sunat) {
			console.log('DOCUMENTO_VALIDADO', `DOC_VALID_${payload.idSale}`);
			if (['RC', 'RA'].indexOf(payload.typeDocumentCode) > -1) {
				const typeSummary =
					payload.typeDocumentCode === 'RC'
						? TypeSummary.ballotSunat
						: TypeSummary.unsubscribeSunat;
				return this.updateStatusSummary(payload.idSale, payload.idCompany, {
					status: StatusTax.validated,
					messageError: 'Documento enviado a la SUNAT',
					typeSummary,
					authorization: payload.authorization,
					authorizationDate: helper.localDate(new Date(), 'YYYY-MM-DD'),
				})
					.then(console.log)
					.catch(console.log);
			}
			return this.updateStatusSales(
				payload.idSale,
				payload.idCompany,
				StatusTax.validated,
				'Documento enviado a la SUNAT',
				helper.localDate(new Date(), 'YYYY-MM-DD'),
			)
				.then(console.log)
				.catch(console.log);
		} else if (type === sqsTypes.signature) {
			console.log('DOCUMENTO_FIRMADO', `DOC_SIGNATURE_${payload.idSale}`);
			return this.updateStatusSales(
				payload.idSale,
				payload.idCompany,
				StatusTax.signature,
				'Documento firmado',
			)
				.then(console.log)
				.catch(console.log);
		}
		return Promise.resolve();
	}

	static updateStatusSummary(
		idSummary,
		idCompany,
		{
			status, messageError, typeSummary, authorization = null, authorizationDate = null,
		},
	) {
		return DocumentsSummaries.updateStatusTax(
			idSummary,
			idCompany,
			status,
			messageError,
			typeSummary,
			authorization,
			authorizationDate,
		);
	}

	static updateStatusSales(
		idSale,
		idCompany,
		status,
		messageError,
		authorizationDate = null,
		cronCounter,
	) {
		return Sales.updateStatusTax(idSale, idCompany, {
			status,
			messageError,
			authorizationDate,
			cronCounter,
		});
	}

	static verifyDocumentInTaxesBiller(saleId, companyId) {
		return simpleAxios
			.get(`${process.env.FAC_SUNAT_URL}/cdr-status/${saleId}/${companyId}`)
			.then(response => ({
				eligibleToSend: !(
					response.success === 1 &&
					response.data &&
					response.data.status === true &&
					response.data.message &&
					response.data.message.status
				),
			}))
			.catch((error) => {
				console.log('ERROR_VERIFICACION', `ERROR_VERIFY_${saleId}`, error);
				return { errorService: true };
			});
	}

	static handleStatusTaxError(code) {
		if (code === 'DOCUMENT_ALREADY_SENT') {
			return { statusTax: StatusTax.validated, message: 'El documento ya está en la SUNAT' };
		} else if (code === 'ERROR_FROM_SUNAT') {
			return { statusTax: StatusTax.errorFromTaxesBiller, message: 'Error interno de la SUNAT' };
		}
		return { statusTax: StatusTax.error, message: code };
	}
}

module.exports = TemplateSales;
