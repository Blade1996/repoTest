'use strict';

const sqs = require('./sqs');
const format = require('date-fns/format');
const simpleAxios = require('./../api/shared/simple-axios');
const { isNullOrUndefined, removeDuplicates } = require('../shared/helper');
const helper = require('./helper');
const Sales = require('./Sales');
const WithholdingTax = require('./WithholdingTax');
const StatusTaxEcu = require('./StatusTaxEcu');
const RemissionGuide = require('./RemissionGuide');
const helperEcu = require('./../shared/helperParserXml');
const TypeDocumentTax = require('./enums/type-document-taxes-code-enum');
const TypeDocument = require('./enums/code-ms-type-document');

class TemplateEcu {
	static structureSale(dataSale) {
		let typeDocumentCode;
		if (dataSale.typeDocument) {
			if (dataSale.typeDocument.code !== TypeDocument.purchaseSettlement && dataSale.supplierId) {
				typeDocumentCode = TypeDocumentTax.retentionReceipt;
			} else {
				typeDocumentCode = dataSale.typeDocument.codeTaxes;
			}
		} else {
			typeDocumentCode = TypeDocumentTax.referralGuide;
		}
		let serieNumber = '';
		if (dataSale.serie.length === 6) {
			serieNumber = dataSale.serie;
		} else {
			serieNumber = dataSale.warehouse.codeTaxes
				? `${dataSale.warehouse.codeTaxes}${dataSale.terminal.codeTaxes}`
				: `001${dataSale.terminal.codeTaxes}`;
		}
		const dataPasword = {
			dateDocument: helper.localDate(dataSale.createdAt, 'DDMMYYYY'),
			typeDocumentCode,
			ruc: dataSale.subsidiary.ruc,
			typeEnvironment: dataSale.subsidiary.typeAmbientTax || 1,
			serie: serieNumber,
			codeNumber: undefined,
			typeEmission: '1',
		};
		let withholdingTax = {};
		if (dataSale.supplierId && dataSale.typeDocument.code !== TypeDocument.purchaseSettlement) {
			if (dataSale.withholdingTax && dataSale.withholdingTax.length > 0) {
				[withholdingTax] = dataSale.withholdingTax;
			} else {
				withholdingTax = dataSale.withholdingTaxActive;
			}
			dataPasword.documentNumber = helperEcu.newNumberEcu(withholdingTax.number);
		} else {
			dataPasword.documentNumber = helperEcu.newNumberEcu(dataSale.number);
		}

		const fieldAdditional = [
			{
				nombre: 'Nombre',
				value: dataSale.subsidiary.rzSocial,
			},
		];

		let fieldsAdditional = [];

		if (
			dataSale.subsidiary.settings &&
			dataSale.subsidiary.settings !== null &&
			dataSale.subsidiary.settings.additionalInformation
		) {
			fieldsAdditional = dataSale.subsidiary.settings.additionalInformation
				.map(it => ({
					nombre: it.label,
					value: it.value,
				}))
				.concat(fieldAdditional);
		} else {
			fieldsAdditional = fieldsAdditional.concat(fieldAdditional);
		}

		const taxesJson = {
			campoAdicional: fieldsAdditional,
			id: 'comprobante',
			infoTributaria: {
				ambiente: dataSale.subsidiary.typeAmbientTax || '1',
				tipoEmision: '1',
				razonSocial: dataSale.subsidiary.rzSocial,
				nombreComercial: dataSale.subsidiary.sucursalName,
				ruc: dataSale.subsidiary.ruc,
				claveAcceso: helperEcu.generatePasswordEcu(dataPasword),
				codDoc: typeDocumentCode,
				estab: dataSale.serie.substring(0, 3) || '001',
				ptoEmi: dataSale.terminal.codeTaxes || dataSale.serie.substring(3, 6),
				secuencial: dataPasword.documentNumber,
				dirMatriz: dataSale.subsidiary.address,
			},
			version: process.env.NUMBER_VERSION_SRI,
		};

		if (dataSale.supplierId) {
			if (!dataSale.typeDocument.code !== TypeDocument.purchaseSettlement) {
				taxesJson.infoCompRetencion = {
					dirEstablecimiento: dataSale.supplier.address,
					fechaEmision: format(dataSale.dateDocument, 'DD/MM/YYYY'),
					tipoIdentificacionSujetoRetenido: dataSale.supplier.msTypePerson.codeTaxes,
					obligadoContabilidad: dataSale.supplier.flagAccounting === 2 ? 'SI' : 'NO',
					periodoFiscal: format(dataSale.dateDocument, 'MM/YYYY'),
					razonSocialSujetoRetenido: dataSale.supplier.name,
					identificacionSujetoRetenido: dataSale.supplier.documentNumber,
				};
				if (dataSale.subsidiary.specialContributor) {
					taxesJson.infoCompRetencion.contribuyenteEspecial =
						dataSale.subsidiary.specialContributor;
				}
				taxesJson.infoTributaria.estab = withholdingTax.serie.substring(0, 3) || '001';
				taxesJson.impuesto = withholdingTax.details.map((item) => {
					const data = {
						baseImponible:
							item.baseZero || item.baseRecorded || item.baseTax || item.baseExempt || item.baseIva,
						codDocSustento: dataSale.typeDocument.codeTaxes,
						codigo: item.codeTax,
						codigoPorcentaje: item.codePercentageTax,
						codigoRetencion: item.codePercentageTax,
						fechaEmisionDocSustento: format(dataSale.dateDocument, 'DD/MM/YYYY'),
						numDocSustento: `${dataSale.serie}${helperEcu.newNumberEcu(dataSale.number)}`,
						porcentajeRetener: item.percentageTax,
						valor:
							item.baseZero || item.baseRecorded || item.baseTax || item.baseExempt || item.baseIva,
						valorRetenido: Number(item.amountTax.toFixed(2)),
					};
					return data;
				});
			} else {
				const taxesTotal = [];
				let totalWithoutTaxes = 0;
				taxesJson.detalle = dataSale.details.map((item) => {
					let taxes = item.taxes || [];
					const subtotal = Number(item.price).toFixed(2);
					const newItem = {
						codigoPrincipal: item.product.code,
						descripcion: item.product.name,
						cantidad: item.quantity,
						precioUnitario: item.flagFree
							? Number(item.discount / item.quantity).toFixed(2)
							: item.price,
						descuento: Number(item.discountAmount).toFixed(2),
						precioTotalSinImpuesto: subtotal,
						impuesto: [],
					};
					taxes = removeDuplicates(taxes, 'taxSchemeName');
					newItem.impuesto = taxes.map((i) => {
						const newI = {
							codigo: i.code || '2',
							codigoPorcentaje: i.codePercentage || '0',
							tarifa: i.percentage || '0.00',
							baseImponible: Number(i.subtotal).toFixed(2) || '0.00',
							valor: Number(i.amount).toFixed(2),
						};
						taxesTotal.push(newI);
						return newI;
					});
					if (taxes.length === 0) {
						newItem.impuesto = [
							{
								codigo: '2',
								codigoPorcentaje: '0',
								tarifa: '0.00',
								baseImponible: Number(item.price).toFixed(2) || '0.00',
								valor: Number(item.price).toFixed(2),
							},
						];
					}
					if (newItem.impuesto.length > 0) {
						totalWithoutTaxes += Number(subtotal);
					}
					return newItem;
				});
				const newTaxesTotal = taxesTotal.reduce((acum, item) => {
					const newAcum = acum;
					const taxIndex = acum.findIndex(i => `${i.codigo}${i.codigoPorcentaje}` === `${item.codigo}${item.codigoPorcentaje}`);
					if (taxIndex === -1) {
						newAcum.push({
							codigo: item.codigo,
							codigoPorcentaje: item.codigoPorcentaje,
							baseImponible: item.baseImponible ? Number(item.baseImponible).toFixed(2) : '0.00',
							tarifa: item.tarifa ? item.tarifa : '0',
							valor: item.valor ? Number(item.valor).toFixed(2) : '0.00',
						});
					} else {
						newAcum[taxIndex].baseImponible =
							Number(acum[taxIndex].baseImponible) + Number(item.baseImponible);
						newAcum[taxIndex].valor = Number(acum[taxIndex].valor) + Number(item.valor);
						newAcum[taxIndex].baseImponible = Number(newAcum[taxIndex].baseImponible).toFixed(2);
						newAcum[taxIndex].tarifa = Number(newAcum[taxIndex].tarifa).toFixed(2);
						newAcum[taxIndex].valor = Number(newAcum[taxIndex].valor).toFixed(2);
					}
					return newAcum;
				}, []);
				taxesJson.infoLiquidacionCompra = {
					fechaEmision: helper.localDate(dataSale.createdAt, 'DD/MM/YYYY'),
					dirEstablecimiento: dataSale.supplier.address,
					obligadoContabilidad: dataSale.subsidiary.flagAccount === 2 ? 'SI' : 'NO',
					tipoIdentificacionProveedor: dataSale.supplier.msTypePerson.codeTaxes,
					identificacionProveedor: dataSale.supplier.documentNumber,
					moneda: dataSale.currency,
				};
				taxesJson.infoLiquidacionCompra.totalSinImpuestos = Number(dataSale.subTotal).toFixed(2);
				taxesJson.infoLiquidacionCompra.valorModificacion = Number(dataSale.amount).toFixed(2);
				taxesJson.infoLiquidacionCompra.moneda = 'DOLAR';
				taxesJson.infoLiquidacionCompra.motivo = dataSale.commentary;
				taxesJson.infoLiquidacionCompra.totalImpuesto = newTaxesTotal;
				taxesJson.infoLiquidacionCompra.totalSinImpuestos = Number(totalWithoutTaxes).toFixed(2);
			}
		} else if (typeDocumentCode === TypeDocumentTax.referralGuide) {
			const deliveryData = dataSale.courier || dataSale.delivery;
			const placa = deliveryData.vehicle ? deliveryData.vehicle.plate : dataSale.driverLicensePlate;
			taxesJson.infoGuiaRemision = {
				fechaEmision: helper.localDate(dataSale.createdAt, 'DD/MM/YYYY'),
				dirPartida: dataSale.originAddress,
				razonSocialTransportista: deliveryData.name,
				tipoIdentificacionTransportista: deliveryData.typePerson.codeTaxes,
				rucTransportista: deliveryData.documentNumber,
				obligadoContabilidad: dataSale.subsidiary.flagAccount === 2 ? 'SI' : 'NO',
				fechaIniTransporte: helper.localDate(dataSale.departureDate, 'DD/MM/YYYY'),
				fechaFinTransporte: helper.localDate(
					dataSale.arrivalDate || dataSale.departureDate,
					'DD/MM/YYYY',
				),
				placa,
			};

			if (dataSale.subsidiary.rise) {
				taxesJson.infoGuiaRemision.rise = dataSale.subsidiary.rise;
			}
			if (dataSale.subsidiary.address) {
				taxesJson.infoGuiaRemision.dirEstablecimiento = dataSale.subsidiary.address;
			}
			if (dataSale.subsidiary.specialContributor) {
				taxesJson.infoGuiaRemision.contribuyenteEspecial = dataSale.subsidiary.specialContributor;
			}

			taxesJson.destinatario = {
				dirDestinatario: dataSale.destination,
				motivoTraslado: dataSale.reason || 'translado de productos',
				razonSocialDestinatario: dataSale.rzSocialAddressee,
				identificacionDestinatario: dataSale.recipientDocument,
			};

			taxesJson.destinatario.detalle = dataSale.details.map((item) => {
				const newItem = {
					cantidad: item.quantity,
					codigoInterno: item.product.code,
					descripcion: item.product.name,
				};
				if (item.product.inlineAlternateCode) {
					newItem.codigoAdicional = item.product.inlineAlternateCode;
				}
				if (item.additionalInformation && item.additionalInformation.length > 0) {
					newItem.detAdicional = item.additionalInformation.map((i, x) => {
						const newI = {
							nombre: `dato${x + 1}`,
							valor: i,
						};
						return newI;
					});
				}
				return newItem;
			});
			if (dataSale.sales && dataSale.sales.authorizationNumber) {
				taxesJson.destinatario.numAutDocSustento = dataSale.sales.authorizationNumber;
			}
			if (dataSale.sales && dataSale.sales.customer.establishmentCode) {
				taxesJson.destinatario.codEstabDestino = dataSale.sales.customer.establishmentCode;
			}
			if (dataSale.sales && dataSale.sales.typeDocument.codeTaxes) {
				taxesJson.destinatario.codDocSustento = dataSale.sales.typeDocument.codeTaxes;
			}
			if (dataSale.route) {
				taxesJson.destinatario.ruta = dataSale.route;
			}
			if (dataSale.sales) {
				taxesJson.destinatario.numDocSustento = `${dataSale.sales.serie.substring(
					0,
					3,
				)}-${dataSale.sales.serie.substring(3, 6)}-${helperEcu.newNumberEcu(dataSale.sales.number)}`;
			}
			if (dataSale.sales) {
				taxesJson.destinatario.fechaEmisionDocSustento = helper.localDate(
					dataSale.createdAt,
					'DD/MM/YYYY',
				);
			}
			taxesJson.destinatario = [taxesJson.destinatario];
			if (dataSale.additionalInformation && dataSale.additionalInformation.length > 0) {
				taxesJson.campoAdicional = dataSale.additionalInformation.map((i, x) => {
					const newItem = {
						nombre: `dato${x + 1}`,
						valor: i,
					};
					return newItem;
				});
			}
		} else {
			const taxesTotal = [];
			let totalWithoutTaxes = 0;
			taxesJson.detalle = dataSale.details.map((item) => {
				let taxes = item.taxes || [];
				const subtotal = Number(item.subtotalWithoutTax).toFixed(2);
				const newItem = {
					codigoPrincipal: item.product.code,
					descripcion: item.product.name,
					cantidad: item.quantity,
					precioUnitario: item.flagFree
						? Number(item.discount / item.quantity).toFixed(2)
						: Number(item.unitPrice).toFixed(2),
					descuento: Number(item.discount).toFixed(2),
					precioTotalSinImpuesto: subtotal,
					impuesto: [],
				};
				if (!isNullOrUndefined(item.subsidyAmount) && item.subsidyAmount > 0) {
					const totalSubsidio = item.subsidyAmount / item.quantity;
					newItem.precioSinSubsidio = Number(item.unitPrice + totalSubsidio).toFixed(2);
				}
				taxes = removeDuplicates(taxes, 'taxSchemeName');
				newItem.impuesto = taxes.map((i) => {
					const newI = {
						codigo: i.code || '2',
						codigoPorcentaje: i.codePercentage || '0',
						tarifa: i.percentage || '0.00',
						baseImponible: Number(i.subtotal).toFixed(2) || '0.00',
						valor: Number(i.amount).toFixed(2),
					};
					taxesTotal.push(newI);
					return newI;
				});

				if (newItem.impuesto.length > 0) {
					totalWithoutTaxes += Number(subtotal);
				}
				return newItem;
			});
			const newTaxesTotal = taxesTotal.reduce((acum, item) => {
				const newAcum = acum;
				const taxIndex = acum.findIndex(i => `${i.codigo}${i.codigoPorcentaje}` === `${item.codigo}${item.codigoPorcentaje}`);
				if (taxIndex === -1) {
					newAcum.push({
						codigo: item.codigo,
						codigoPorcentaje: item.codigoPorcentaje,
						baseImponible: item.baseImponible ? Number(item.baseImponible).toFixed(2) : '0.00',
						tarifa: item.tarifa ? item.tarifa : '0',
						valor: item.valor ? Number(item.valor).toFixed(2) : '0.00',
					});
				} else {
					newAcum[taxIndex].baseImponible =
						Number(acum[taxIndex].baseImponible) + Number(item.baseImponible);
					newAcum[taxIndex].valor = Number(acum[taxIndex].valor) + Number(item.valor);
					newAcum[taxIndex].baseImponible = Number(newAcum[taxIndex].baseImponible).toFixed(2);
					newAcum[taxIndex].tarifa = Number(newAcum[taxIndex].tarifa).toFixed(2);
					newAcum[taxIndex].valor = Number(newAcum[taxIndex].valor).toFixed(2);
				}
				return newAcum;
			}, []);
			taxesJson.infoFactura = {
				fechaEmision: helper.localDate(dataSale.createdAt, 'DD/MM/YYYY'),
				dirEstablecimiento: dataSale.subsidiary.address,
				obligadoContabilidad: dataSale.subsidiary.flagAccount === 2 ? 'SI' : 'NO',
				tipoIdentificacionComprador: dataSale.customer.msTypePerson.codeTaxes,
				razonSocialComprador: dataSale.customer.typePerson.fullName,
				identificacionComprador: dataSale.customer.typePerson.documentNumber,
			};
			if (!isNullOrUndefined(dataSale.subsidyAmount) && dataSale.subsidyAmount > 0) {
				taxesJson.infoFactura.totalSubsidio = Number(dataSale.subsidyAmount).toFixed(2);
			}
			if (dataSale.typeDocument.code === 'NTC') {
				const {
					serie, typeDocument, number, subtotal,
				} = dataSale.documentRelated;
				taxesJson.infoFactura.contribuyenteEspecial = dataSale.subsidiary.specialContributor;
				taxesJson.infoFactura.obligadoContabilidad =
					dataSale.customer.flagAccounting === 2 ? 'SI' : 'NO';
				if (dataSale.subsidiary.rise) {
					taxesJson.infoFactura.rise = dataSale.subsidiary.rise;
				}
				taxesJson.infoFactura.codDocModificado = typeDocument.codeTaxes;
				taxesJson.infoFactura.numDocModificado = `${serie.substring(0, 3)}-${serie.substring(
					3,
					6,
				)}-${helperEcu.newNumberEcu(number)}`;
				taxesJson.infoFactura.fechaEmisionDocSustento = helper.localDate(
					dataSale.documentRelated.createdAt,
					'DD/MM/YYYY',
				);
				taxesJson.infoFactura.totalSinImpuestos = Number(subtotal).toFixed(2);
				taxesJson.infoFactura.valorModificacion = Number(dataSale.amount).toFixed(2);
				taxesJson.infoFactura.moneda = 'DOLAR';
				taxesJson.infoFactura.motivo = dataSale.commentary;
				taxesJson.infoNotaCredito = taxesJson.infoFactura;
				delete taxesJson.infoFactura;
				taxesJson.infoNotaCredito.totalImpuesto = newTaxesTotal;
				taxesJson.infoNotaCredito.totalSinImpuestos = Number(totalWithoutTaxes).toFixed(2);
			} else if (dataSale.typeDocument.code === 'NTD') {
				const { serie, typeDocument, number } = dataSale.documentRelated;
				// totalWithoutTaxes += dataSale.discount || 0;
				// taxesJson.infoFactura.totalSinImpuestos = Number(subtotal).toFixed(2);
				taxesJson.infoFactura.codDocModificado = typeDocument.codeTaxes;
				taxesJson.infoFactura.contribuyenteEspecial = dataSale.subsidiary.specialContributor;
				taxesJson.infoFactura.numDocModificado = `${serie.substring(0, 3)}-${serie.substring(
					3,
					6,
				)}-${helperEcu.newNumberEcu(number)}`;
				taxesJson.infoFactura.fechaEmisionDocSustento = helper.localDate(
					dataSale.documentRelated.createdAt,
					'DD/MM/YYYY',
				);
				if (dataSale.subsidiary.rise) {
					taxesJson.infoFactura.rise = dataSale.subsidiary.rise;
				}
				taxesJson.infoFactura.pago = [
					{
						formaPago: '01',
						total: Number(dataSale.amount).toFixed(2),
						plazo: '0.00',
						unidadTiempo: 'DIAS',
					},
				];
				if (dataSale.transactions && dataSale.transactions.length > 0) {
					taxesJson.infoFactura.pago = dataSale.transactions.map((item) => {
						const newItem = {
							formaPago: item.typePayment.codeTaxes,
							total: Number(item.amount).toFixed(2),
							plazo: '0.00',
							unidadTiempo: 'DIAS',
						};
						return newItem;
					});
				}
				taxesJson.infoFactura.impuesto = newTaxesTotal;
				taxesJson.infoFactura.totalSinImpuestos = Number(totalWithoutTaxes).toFixed(2);
				taxesJson.infoFactura.valorTotal = Number(dataSale.amount).toFixed(2);
				taxesJson.infoNotaDebito = taxesJson.infoFactura;
				delete taxesJson.infoFactura;
				delete taxesJson.detalle;
				const motivo = [
					{
						razon: dataSale.commentary,
						valor: 0,
					},
				];
				taxesJson.motivo = motivo;
			} else {
				// totalWithoutTaxes += dataSale.discount || 0;
				taxesJson.infoFactura.direccionComprador = dataSale.customer.address;
				// taxesJson.infoFactura.totalSinImpuestos = Number(subtotal).toFixed(2);
				taxesJson.infoFactura.totalDescuento = Number(dataSale.discount).toFixed(2);
				taxesJson.infoFactura.totalImpuesto = [];
				taxesJson.infoFactura.propina = '0.00';
				taxesJson.infoFactura.importeTotal = Number(dataSale.amount).toFixed(2);
				taxesJson.infoFactura.moneda = 'DOLAR';
				taxesJson.infoFactura.pago = [
					{
						formaPago: '01',
						total: Number(dataSale.amount).toFixed(2),
						plazo: '0.00',
						unidadTiempo: 'DIAS',
					},
				];
				if (dataSale.transactions && dataSale.transactions.length > 0) {
					taxesJson.infoFactura.pago = dataSale.transactions.map((item) => {
						const newItem = {
							formaPago: item.typePayment.codeTaxes,
							total: Number(item.amount).toFixed(2),
							plazo: '0.00',
							unidadTiempo: 'DIAS',
						};
						return newItem;
					});
				}
				taxesJson.infoFactura.totalImpuesto = newTaxesTotal;
				taxesJson.infoFactura.totalSinImpuestos = Number(totalWithoutTaxes).toFixed(2);
			}
		}
		return {
			withholdingTax,
			taxesJson,
			typeDocumentCode,
		};
	}

	static sendBillingProcess(payload, sqsFlow, type, sqsId) {
		if (!sqsFlow) {
			return this.connectToTaxesBiller(payload);
		}
		return sqs(payload, type, sqsId, process.env.SQS_FACT_URL);
	}

	static facturacion(dataSale, companyId, type) {
		const { withholdingTax, taxesJson, typeDocumentCode } = this.structureSale(dataSale);
		const timeId = new Date().getTime();
		const id = `${dataSale.id}-${dataSale.serie}-${dataSale.number}-${companyId}-${type}-${timeId}`;

		let statusTaxUpdatePromise;
		if (dataSale.supplierId) {
			statusTaxUpdatePromise = WithholdingTax.editStateTaxes(companyId, withholdingTax.id, {
				stateDocumentTax: StatusTaxEcu.inProcess,
				msgSri: 'Documento en proceso de envío',
			});
		} else if (typeDocumentCode === '06') {
			statusTaxUpdatePromise = RemissionGuide.edit(
				dataSale.id,
				{
					stateDocumentTax: StatusTaxEcu.inProcess,
					msgSri: 'Documento en proceso de envío',
				},
				companyId,
			);
		} else {
			statusTaxUpdatePromise = Sales.editStateTaxes(companyId, dataSale.id, {
				statusTaxSri: StatusTaxEcu.inProcess,
				sunatError: 'Documento en proceso de envío',
			});
		}
		statusTaxUpdatePromise.then(() => {
			TemplateEcu.sendBillingProcess(
				{
					idSale: dataSale.supplierId ? withholdingTax.id : dataSale.id,
					idCompany: companyId,
					data: taxesJson,
				},
				true,
				type,
				id,
			);
		});
	}

	static connectToTaxesBiller(data) {
		let url;
		if (data.data.infoCompRetencion) {
			url = 'comprobante-retencion';
		} else if (data.data.infoNotaCredito) {
			url = 'nota-credito';
		} else if (data.data.infoNotaDebito) {
			url = 'nota-debito';
		} else if (data.data.infoGuiaRemision) {
			url = 'guia-remision';
		} else {
			url = 'factura';
		}
		return simpleAxios
			.post(
				`${process.env.FAC_SRI_URL}/api/v1/register/${url}?saleDocumentId=${data.idSale}`,
				data.data,
			)
			.then((response) => {
				// eslint-disable-next-line no-console
				console.log(
					`COMPROBANTE ${url} SRI`,
					data.idSale,
					response.data,
					JSON.stringify(data.data),
				);
				return Promise.resolve();
			})
			.catch((error) => {
				// eslint-disable-next-line no-console
				console.log(`COMPROBANTE ${url} SRI ERROR`, error);
				return Promise.reject(error.response.data.msgError);
			});
	}
}

module.exports = TemplateEcu;
