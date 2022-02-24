'use strict';

const moment = require('moment');
const { isNullOrUndefined, roundTo } = require('./../shared/helper');
const PaymentMethodCode = require('./PaymentMethodCode');
const { salePrice } = require('./enums/type-base-price');
const { web } = require('./enums/origin-platform-enum');
const { moved } = require('./KardexMoveStatus');
const CountryCode = require('./CountryCode');

class Mapping {
	static convertOrderToSale({
		order,
		terminalId,
		serieId,
		cashId,
		employeeId,
		flagDispatch,
		exchangeRate,
		warehouse,
		msTypePayment,
		countryCode = 'PER',
		paymentByNdc,
		flagUseValid = true,
		customerIdFix,
		typeDocumentCode,
	}) {
		try {
			// ordenar data desde la orden
			let flagFree = order.total === 0;
			const subtotalAndTaxes = this.getSubtotalAndTaxes(order.details, countryCode);
			const { discountItems, taxesFree, freeAmount } = subtotalAndTaxes;
			let { subtotal, taxes } = subtotalAndTaxes;
			let totalOrder = subtotal + taxes + (order.costShipping || 0);
			if (typeDocumentCode === 'FAC' && countryCode === CountryCode.peru) {
				totalOrder -= order.costShipping || 0;
			}
			let { discount } = order; // Si tiene descuento global
			if (taxesFree !== 0) {
				totalOrder -= discount || discountItems || 0;
			} else {
				discount -= freeAmount;
			}
			const subtotalWithoutTax = subtotal + discount;
			const subtotalTaxes = subtotal;
			const totalTaxesAmount = this.getTotalTaxesAmount(
				countryCode,
				totalOrder,
				subtotalWithoutTax - taxes,
			);
			if (
				flagFree ||
				(order.costShipping && order.costShipping !== 0 && order.costShipping === order.total)
			) {
				subtotal = 0;
				taxes = 0;
				discount = 0;
				flagFree = true;
			}
			const taxesAmount = this.getTaxesAmount(flagFree, subtotalTaxes, countryCode, freeAmount);
			const defaultPayment = this.getPaymentMethod(
				order,
				msTypePayment,
				totalOrder,
				paymentByNdc,
				flagUseValid,
			);
			if (defaultPayment && defaultPayment.statusError) {
				return defaultPayment;
			}
			const sale = {
				...defaultPayment,
				terminalId,
				serieId,
				cashId,
				flagDispatch: flagDispatch || order.flagKardex !== moved,
				employeeId,
				amount: totalOrder,
				change: 0,
				currency: order.currency,
				dateOnline: `${new Date().getTime()}`,
				discount,
				commentary: order.comments || '',
				exchangeRate,
				subtotal,
				taxes,
				orderId: order.id,
				customerId: customerIdFix || order.customerId,
				totalTaxesAmount,
				taxesAmount,
				warehouseName: order.warehouseName,
				amountCash: totalOrder,
				tip: order.costShipping || 0,
				externalData: {
					anotherCharge: order.costShipping || 0,
				},
				urlImages: [],
				flagAdvance: false,
				flagBasePrice: salePrice,
				considerations: [],
				workToDo: [],
				totalPoints: null,
				warehouseCodeTaxes: warehouse && warehouse.codeTaxes,
				subsidyAmount: 0,
				templateCode: 'pdf',
				flagTransfer: true,
				flagMobile: false,
				flagOffline: false,
				originPlatform: web,
				flagOldSale: 0,
			};
			let totalDiscountItems = 0;
			const details = order.details.map((d) => {
				let newFlagFree = flagFree;
				const {
					tax,
					flagFreeItem,
					unitPrice,
					taxAmount,
					detailTaxes,
					price,
					discountUnit,
					discount: discountItem,
					discountPercentage,
				} = this.getPricesAndTaxes(d, newFlagFree, countryCode);
				const discountValid = flagFreeItem ? discountUnit || 0 : discountItem || d.discount || 0;
				if (flagFreeItem) {
					newFlagFree = flagFreeItem;
				} else {
					totalDiscountItems += discountItem || d.discount;
				}
				const subtotalWithoutTaxNew = unitPrice * d.quantity;
				return {
					alternateCode: d.alternateCode,
					brandId: d.brandId,
					brandName: d.brandName,
					categoryId: d.categoryId,
					categoryName: d.categoryName,
					description: d.description || d.productName,
					discount: newFlagFree ? 0 : discountItem || d.discount,
					discountPercentage: discountPercentage || d.discountPercentage,
					flagControlSerie: 0,
					flagFree: newFlagFree,
					freeAmount: newFlagFree ? price || d.price || d.salePrice : 0,
					price: newFlagFree ? 0 : price || d.price || d.salePrice,
					priceCost: newFlagFree ? 0 : d.priceCost,
					productCode: d.productCode,
					productType: (d.product && d.product.type) || 1,
					productPoint: null,
					productCubsoCode: null,
					quantity: d.quantity,
					salePrice: price || d.salePrice,
					stockQuantity: d.stockQuantity || 0,
					subtotalWithoutTax: subtotalWithoutTaxNew - discountValid,
					tax,
					taxAmount,
					taxes: detailTaxes,
					unitPrice: newFlagFree ? 0 : unitPrice,
					unitCode: d.unitCode,
					unitConversion: d.unitConversion,
					unitId: d.unitId,
					unitName: d.unitName,
					unitQuantity: d.unitQuantity,
					warProductsId: d.productId,
					warWarehousesId: d.warehouseId,
					warehouseName: d.warehouseName,
					groupType: 3,
					codeTaxes: newFlagFree ? '05' : '01',
					subsidyAmount: 0,
				};
			});
			sale.details = details;
			if (totalDiscountItems && totalDiscountItems > 0) {
				sale.discount = totalDiscountItems;
			}
			return sale;
		} catch (error) {
			return {
				statusError: true,
				error: 'Error al estructurar data.',
			};
		}
	}

	static validPaymentByNdc(order, paymentByNdc) {
		if (
			order.additionalInfo &&
			order.additionalInfo.paymentMethodNdc &&
			order.additionalInfo.paymentMethodNdc.total > 0
		) {
			const { documents } = order.additionalInfo.paymentMethodNdc;
			return documents.reduce((acum, item) => {
				let newAcum = acum;
				const { serie, number } = item;
				const saleNdc = paymentByNdc.find(nc => `${nc.serie}` === `${serie}` && `${nc.number}` === `${number}`);
				if (saleNdc && (isNullOrUndefined(saleNdc.flagUse) || (saleNdc && saleNdc.flagUse === 0))) {
					newAcum += saleNdc.amount;
				}
				return newAcum;
			}, 0);
		}
		return 0;
	}

	static getPaymentMethod(
		order,
		msTypePayment,
		totalOrder,
		paymentByNdc = false,
		flagUseValid = true,
	) {
		let newTotalOrder = totalOrder;
		const payment = {
			amountCredit: 0,
			paymentMethodId: PaymentMethodCode.credit,
			detailsPayments: [
				{
					amount: newTotalOrder,
					expirationDate: moment()
						.add(1, 'month')
						.format('YYYY-MM-DD'),
				},
			],
			transactions: [],
			transactionId: [],
		};
		if ((!order.wayPayment || !order.commerce) && !paymentByNdc) {
			return payment;
		}
		let transactions = [];
		const defaultPayment = { ...payment };
		defaultPayment.paymentMethodId = PaymentMethodCode.cash;
		defaultPayment.detailsPayments = [];
		const typePayment = msTypePayment.find((i) => {
			const wayPaymCode = order.wayPaymentDetailCode && order.wayPaymentDetailCode.toUpperCase();
			if (wayPaymCode === 'DEPOSITO') {
				return i.code === 'deposito-bancario';
			}
			return i.code.toUpperCase() === wayPaymCode;
		});

		if (
			order.additionalInfo &&
			order.additionalInfo.paymentMethodNdc &&
			order.additionalInfo.paymentMethodNdc.total > 0
		) {
			let totalNdc = 0;
			const { documents, type } = order.additionalInfo.paymentMethodNdc;
			const typePaymentNdc = msTypePayment.find(i => i.code.toUpperCase() === type.toUpperCase());
			transactions = documents.reduce((acum, item) => {
				const acumNew = [...acum];
				const { serie, number, document } = item;
				const saleNdc = paymentByNdc.find(nc => `${nc.serie}` === `${serie}` && `${nc.number}` === `${number}`);
				if (
					saleNdc &&
					(isNullOrUndefined(saleNdc.flagUse) || (saleNdc.flagUse === 0 || !flagUseValid))
				) {
					acumNew.push({
						currency: saleNdc.currency,
						paymentDate: new Date(),
						amount: saleNdc.amount,
						paymentAmount: saleNdc.amount,
						typePaymentId: typePaymentNdc.id,
						bankAccountId: null,
						documentNumber: `${document}`,
						ntcDocumentId: saleNdc.id,
					});
					totalNdc += saleNdc.amount;
				}
				return acumNew;
			}, []);
			if (!typePaymentNdc || transactions.length !== documents.length) {
				// typePaymentNdc debe mandar error de no se puede generar el documento
				return {
					statusError: true,
					error: 'error por monto o no se consigue el documento',
				};
			}
			if (totalNdc > 0) {
				newTotalOrder -= totalNdc;
			}
		}

		if (!typePayment && !paymentByNdc) {
			return payment;
		}
		const transaction = {
			currency: order.currency,
			paymentDate: new Date(),
			amount: newTotalOrder,
			paymentAmount: newTotalOrder,
			typePaymentId: typePayment && typePayment.id,
			bankAccountId: null,
			documentNumber: '',
		};
		if (order.wayPaymentDetailCode === 'deposito' || order.wayPaymentDetailCode === 'yape') {
			const { bankAccountsRelated } = order.commerce;
			let bank = bankAccountsRelated.find(b => b.flagDefault === true);
			if (!bank) {
				[bank] = bankAccountsRelated;
			}
			if (!bank) {
				return payment;
			}
			transaction.additionalInformation = {
				dateReference: `${new Date().getTime()}`,
			};
			transaction.bankAccountId = bank.id;
			transaction.documentNumber = 'N/A';
			transaction.urlImage = '';
		}
		if (transaction.typePaymentId) {
			transactions.push(transaction);
		}
		defaultPayment.transactions = transactions;
		defaultPayment.transactionId = transactions.map((i, index) => index + 1);
		defaultPayment.amountCredit = totalOrder;
		return defaultPayment;
	}

	static getSubtotalAndTaxes(details, countryCode, flagFree = false) {
		if (countryCode === CountryCode.ecuador || flagFree) {
			// TODO implement ECU flow
			return {
				discountItems: 0,
				subtotal: 0,
				taxes: 0,
			};
		}
		const dataTotal = details.reduce(
			(acc, item) => {
				const subTotal = item.total - item.discount;
				if (subTotal === 0) {
					acc.flagFree = true;
					acc.freeAmount += item.discount;
				}
				const tax = roundTo(subTotal / 1.18);
				if (subTotal === 0) {
					acc.taxesFree += roundTo(subTotal - tax);
				} else {
					acc.taxes += roundTo(subTotal - tax);
				}
				acc.subtotal += tax;
				acc.discountItems += subTotal === 0 ? 0 : item.discount || 0;
				return acc;
			},
			{
				subtotal: 0,
				taxes: 0,
				taxesFree: 0,
				discountItems: 0,
				flagFree: false,
				freeAmount: 0,
			},
		);
		return dataTotal;
	}

	static getTotalTaxesAmount(countryCode, total, subtotalWithoutTax) {
		if (countryCode === CountryCode.ecuador) {
			// TODO implement ECU flow
			return {};
		}
		return {
			ice: 0,
			iva: 0,
			tip: 0,
			total,
			irbpnr: 0,
			discount: 0,
			subtotal: 0,
			subtotalIva: 0,
			subtotalExtIva: 0,
			subtotalNoObjIva: 0,
			subtotalWithoutTax,
		};
	}

	static getTaxesAmount(flagFree, subtotal, countryCode, taxesFree = 0) {
		if (countryCode === CountryCode.ecuador) {
			// TODO implement ECU flow
			return {};
		}
		let free = flagFree ? subtotal : 0;
		if (taxesFree > 0) {
			free = taxesFree;
		}
		return {
			isc: 0,
			recorded: flagFree ? 0 : subtotal,
			inactive: 0,
			exonerated: 0,
			free,
			export: 0,
			icbper: 0,
			otherConcepts: 0,
		};
	}

	static getPricesAndTaxes(detail, flagFree, countryCode) {
		if (countryCode === CountryCode.ecuador) {
			// TODO implement ECU flow
			return {
				tax: 0,
				unitPrice: 0,
				taxAmount: 0,
				detailTaxes: [],
			};
		}
		let flagFreeItem = flagFree;
		let discountUnit;
		let price = detail.price || detail.salePrice;
		let discount = detail.discount || 0;
		let discountPercentage = 0;
		if (price * detail.quantity === discount) {
			flagFreeItem = true;
			discount = 0;
			discountUnit = 0;
		}
		const unitPrice = roundTo(price / 1.18);
		if (discount > 0 && (!detail.discountPercentage || detail.discountPercentage === 0)) {
			({
				discountUnit, discountPercentage, price, discount,
			} = this.getPriceDetail(
				price,
				discount,
				unitPrice,
				detail.quantity,
			));
		}
		const sub = price / 1.18;
		let taxAmount = price - sub;
		taxAmount = Math.round(100 * taxAmount) / 100;
		const unitPriceSub = unitPrice * detail.quantity;
		const detailTaxes = [
			{
				// TODO
				code: '01',
				codePercentage: '01',
				percentage: 18,
				subtotal: roundTo(unitPriceSub - discount || 0),
				amount: taxAmount * detail.quantity || 1,
				taxSchemeName: 'IGV IMPUESTO GENERAL A LAS VENTAS',
			},
		];
		if (flagFreeItem) {
			detailTaxes.push({
				code: '05',
				codePercentage: '02',
				percentage: 0,
				subtotal: roundTo(price - discount || 0),
				amount: 0,
				taxSchemeName: 'GRATUITO',
			});
		}
		return {
			tax: 18,
			unitPrice,
			taxAmount: taxAmount * detail.quantity || 1,
			detailTaxes,
			price,
			discount,
			discountUnit,
			discountPercentage,
			flagFreeItem,
		};
	}

	static getPriceDetail(price, discount, unitPrice, quantity) {
		const discountUnit = discount / quantity;
		const discountPercentage = (discount * 100) / (price * quantity);
		const newDiscount = unitPrice * (discountPercentage / 100);
		const newPrice = price - discountUnit;
		return {
			discountUnit,
			price: newPrice,
			discount: newDiscount * quantity,
			discountPercentage,
		};
	}
}

module.exports = Mapping;
