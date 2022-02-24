/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

'use strict';

const axios = require('axios');
const https = require('https');
const { isNullOrUndefined } = require('util');
const { store } = require('./../../models/PickUp');
const SalOrders = require('./../../models/SalOrders');
const { isDevOrProd } = require('./../../shared/helper');
const CatalogSunat = require('./../../models/CatalogSunat');
const PaymentGatewayContract = require('../PaymentGatewayContract');
const GatewayTransaction = require('../../models/GatewayTransaction');
const RedisCredential = require('../../process-integration/redis-credential');
const IntegrationSubsidiary = require('./../../models/IntegrationSubsidiary');
const { buildAndGenerateTransactionHash } = require('./../../shared/generate-token');
const { datafast } = require('./../payment-strategies/payment-strategies-codes');
const { paymentButton } = require('../type-payment-gateway-enums');
const { payOut, pending } = require('../../models/PaymentState');
const { validated } = require('../../models/StatusOrders');
const ModuleCode = require('../../models/ModuleCode');

const {
	subsidiaryTaxesSettingsError,
	datafastGatewayIncorrectlyConfigured,
	datafastValidationResponseNotProvided,
} = require('./../error-codes/payment-error-codes');

class DataFast extends PaymentGatewayContract {
	constructor(order, categoryCode = paymentButton) {
		super();
		this.iva = 12;
		this.order = order;
		this.environment = 'dev';
		this.categoryCode = categoryCode;
	}

	getUrlApi() {
		const url = {
			dev: 'https://test.oppwa.com',
			prod: 'https://oppwa.com',
		};
		return url[this.environment];
	}

	getPaymentLink() {
		// TODO implement payment link generator method
		return 'link_pago';
	}

	async saveTransaction(params) {
		const gatewayInfo = this.getPaymentGatewayInformation();
		this.hash = await buildAndGenerateTransactionHash(
			this.order.id,
			this.order.companyId,
			gatewayInfo.code,
		);
		const data = {
			code: this.hash,
			codeGateway: gatewayInfo.code,
			codeApp: this.order.codeApp,
			dateTransaction: new Date(),
			codeCategory: this.categoryCode,
			...params,
			commerceId: this.order.commerce.id,
			moduleId: ModuleCode.ecommerce,
			orderId: this.order.id,
			amount: this.getTotalPayment(),
			currency: this.getCurrency(),
			companyId: this.order.companyId,
		};
		return GatewayTransaction.create(data);
	}

	async _updateTransaction(gatewayTransactionId, succeed, gatewayResponse) {
		const { transaction } = gatewayResponse;
		const data = {
			status: 2,
			paymentStates: succeed ? 2 : 3,
			...gatewayResponse,
		};
		if (transaction && transaction.id && transaction.authorization_code) {
			data.referenceId = transaction.id || null;
			data.tokenGateway = transaction.authorization_code || null;
		}
		return GatewayTransaction.edit(gatewayTransactionId, data);
	}

	async getCheckoutInformation({ h }) {
		const gateway = await this._getCredentials();
		if (gateway) {
			const dataQuery = await this._getPayboxBase();
			let query = `entityId=${gateway.entityId}&amount=${this.getTotalPayment().toFixed(2)}&currency=${this.getCurrency()}&paymentType=DB`;
			query += `${dataQuery}&customParameters%5BSHOPPER_MID%5D=${gateway.mid}`;
			query += `&customParameters%5BSHOPPER_TID%5D=${gateway.tip}`;
			query += `&risk.parameters%5BUSER_DATA2%5D=${gateway.userData2}`;
			query += '&customParameters%5BSHOPPER_ECI%5D=0103910';
			query +=
				'&customParameters%5BSHOPPER_PSERV%5D=17913101&customParameters%5BSHOPPER_VERSIONDF%5D=2';
			if (this.environment === 'dev') {
				query += '&testMode=EXTERNAL';
			}
			const { data: gatewayResponse, status } = await axios({
				url: `${this.getUrlApi()}/v1/checkouts?${query}`,
				method: 'POST',
				headers: {
					authorization: `Bearer ${gateway.authorization}`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: this.environment === 'prod',
				}),
				data: {},
				validateStatus: () => true,
			});
			const editOrder = {
				sessionGateway: gatewayResponse || { reponse: 'Not Response', result: {} },
				dateExpiration: null,
				status: status === 400 ? 2 : 1,
				paymentStates: status === 400 ? 3 : 1,
				gatewayResponse,
				gateway,
			};
			const response = await this.registerOrderGateway(editOrder);
			response.payboxProduction = this.environment === 'prod';
			const dataAdittionals = await this._getDataAdittionals();
			response.additionalInformation = dataAdittionals;
			if (status === 400) {
				return h.response(response).code(status);
			}
			return h.response(response).code(201);
		}
		throw new Error(datafastGatewayIncorrectlyConfigured);
	}

	async _getDataAdittionals() {
		const { commerce, companyId } = this.order;
		const { subsidiary } = commerce;
		const gatewayInfo = this.getPaymentGatewayInformation();
		const dataSubsidiary = await IntegrationSubsidiary.findByIntegrationId(
			subsidiary.id,
			companyId,
			this.categoryCode,
			gatewayInfo.code,
			true,
		);
		if (dataSubsidiary) {
			return dataSubsidiary.additionalInformation || {};
		}
		return {};
	}

	async _getPayboxBase() {
		const {
			auth,
			details,
			flagBill,
			dataBill,
			customer,
			ipAddress,
			flagPickUp,
			deliveryAddress,
			warehouseAddress,
			responsiblePickUp,
		} = this.order;
		const { employee } = auth;
		const { comCountryId, country } = employee.company;
		let names;
		let middleName;
		let surname;
		let identificationDocId;
		let phoneCustomer;
		if (responsiblePickUp && responsiblePickUp.name && responsiblePickUp.lastname) {
			const [name, middle] = responsiblePickUp.name.split(' ');
			names = name;
			middleName = middle;
			surname = responsiblePickUp.lastname;
			identificationDocId = responsiblePickUp.dni;
			phoneCustomer = responsiblePickUp.phone;
		} else {
			const [name, middle] = customer.name.split(' ');
			names = name;
			middleName = middle;
			surname = customer.lastname;
			identificationDocId = customer.dni;
			phoneCustomer = customer.phone || responsiblePickUp.phone;
		}
		let dataQuery = `&customer.givenName=${names}`;
		dataQuery += `&customer.middleName=${middleName || ''}`;
		dataQuery += `&customer.surname=${surname}`;
		dataQuery += `&customer.ip=${ipAddress}`;
		dataQuery += `&customer.merchantCustomerId=${customer.id}`;
		dataQuery += `&merchantTransactionId=${this.order.id}`;
		dataQuery += `&customer.email=${customer.email}`;
		dataQuery += '&customer.identificationDocType=IDCARD';
		dataQuery += `&customer.identificationDocId=${identificationDocId}`;
		dataQuery += `&customer.phone=${phoneCustomer}`;
		const { configTaxes } = country;

		const shippingStreet = flagPickUp === store ? warehouseAddress : deliveryAddress.addressLine1;
		dataQuery += `&shipping.street1=${shippingStreet.slice(0, 100)}`;
		dataQuery += `&shipping.country=${configTaxes.countryCodeISO3166 || 'EC'}`;

		const billingStreet = flagBill && dataBill.address ? dataBill.address : shippingStreet;
		dataQuery += `&billing.street1=${billingStreet.slice(0, 100)}`;
		dataQuery += `&billing.country=${configTaxes.countryCodeISO3166 || 'EC'}`;

		const catalogSunatCode = 'TABLA17';
		const catalogSunatData = await CatalogSunat.getDetailsByCode(catalogSunatCode, comCountryId);
		if (isNullOrUndefined(catalogSunatData)) {
			throw new Error(subsidiaryTaxesSettingsError);
		}
		const ivaData = catalogSunatData.sunatDetails.find(i => i.code === '2');
		if (isNullOrUndefined(ivaData)) {
			throw new Error(subsidiaryTaxesSettingsError);
		}

		let payboxBase0 = 0;
		let payboxBase12 = 0;
		let taxIva = 0;
		let percentageIva =
			ivaData.percentage && ivaData.percentage > 0 ? ivaData.percentage : this.iva;
		percentageIva /= 100;
		percentageIva += 1;
		details.forEach((item, index) => {
			dataQuery += `&cart.items%5B${index}%5D.name=${item.productName}`;
			const descriptionProduct = item.description ? item.description.slice(0, 255) : '';
			dataQuery += `&cart.items%5B${index}%5D.description=${descriptionProduct}`;
			dataQuery += `&cart.items%5B${index}%5D.price=${item.salePrice.toFixed(2)}`;
			dataQuery += `&cart.items%5B${index}%5D.quantity=${item.quantity}`;
			if (item.taxes && item.taxes.length > 0) {
				const taxes = item.taxes.find(i => i.code === '2' && i.codePercentage === '2');
				if (taxes) {
					const tax = item.total / percentageIva;
					taxIva += item.total - tax;
					payboxBase12 += tax;
				} else {
					payboxBase0 += item.total;
				}
			}
		});
		if (this.order.costShippingTax) {
			payboxBase12 += this.order.costShipping - this.order.costShippingTaxAmount;
			taxIva += this.order.costShippingTaxAmount || 0;
		} else {
			payboxBase0 += this.order.costShipping;
		}

		taxIva = taxIva.toFixed(2);
		let payboxBaseImp = payboxBase12;
		payboxBase12 = payboxBase12.toFixed(2);
		payboxBase0 = payboxBase0.toFixed(2);
		payboxBaseImp = payboxBaseImp.toFixed(2);

		dataQuery += `&customParameters%5BSHOPPER_VAL_BASE0%5D=${payboxBase0}`;
		dataQuery += `&customParameters%5BSHOPPER_VAL_BASEIMP%5D=${payboxBaseImp}`;
		dataQuery += `&customParameters%5BSHOPPER_VAL_IVA%5D=${taxIva}`;
		return dataQuery;
	}

	async _getCredentials() {
		const { wayPaymentCommerce, auth, commerce } = this.order;
		if (isDevOrProd() && auth) {
			const { subsidiary } = commerce;
			const params = {
				subsidiaryCode: subsidiary.subsidiaryAclCode,
				categoryCode: this.categoryCode,
				integrationCode: datafast,
			};
			const dataGateWay = await RedisCredential.getCredentials(auth, params);
			if (dataGateWay && dataGateWay.credentials_key) {
				this.environment =
					dataGateWay.credentials_key.payboxProduction === 'production' ? 'prod' : 'dev';
				return dataGateWay.credentials_key;
			}
		} else if (
			wayPaymentCommerce &&
			wayPaymentCommerce.gatewayConfiguration &&
			wayPaymentCommerce.gatewayConfiguration.length > 0
		) {
			const { gatewayConfiguration } = wayPaymentCommerce;
			return gatewayConfiguration.find(item => item.code === datafast);
		}
		return undefined;
	}

	async validateTransaction(h, query) {
		const { gatewayTransactionId, companyId } = this.order;
		const { resourcePath } = query;
		if (!resourcePath) {
			throw new Error(datafastValidationResponseNotProvided);
		}

		const gatewayTransaction = await GatewayTransaction.getById(gatewayTransactionId, {
			companyId,
		});

		if (gatewayTransaction && gatewayTransaction.additionalInformation) {
			const { payboxProduction, token, user } = gatewayTransaction.additionalInformation;
			this.environment = payboxProduction ? 'prod' : 'dev';
			const gatewayResponse = await this.validationTokenDateResource({
				resourcePath,
				token,
				user,
			});
			const { result } = gatewayResponse;
			const codeErrorData = result.code || '';
			const [code] = codeErrorData.split('.');
			const succeed = code === '000';
			const gatewayErrorCode = succeed ? this.errorCodesPaymentTransaction(codeErrorData) : '';
			const additionalInformation = await this.registerOrderGateway({
				gatewayAuthorizationResponse: gatewayResponse,
				paymentStateId: succeed ? payOut : pending,
				flagStatusOrder: validated,
				flagApproval: succeed,
				gatewayErrorCode,
				gatewayResponse,
			});
			if (succeed && isDevOrProd()) {
				await SalOrders.handleNotification({
					order: this.order,
					wayPayment: this.order.wayPayment,
					paymentGateway: additionalInformation.paymentGateway,
				});
			}
			if (query.uri) {
				return h.redirect(`${this.order.commerce.urlDomain}/${query.uri}/${this.order.id}`);
			}
			return gatewayResponse;
		}
		return false;
	}

	async validationTokenDateResource({ resourcePath, token, user }) {
		const url = `${this.getUrlApi()}${resourcePath}?entityId=${user}`;
		const { data } = await axios({
			url,
			method: 'GET',
			headers: {
				authorization: `Bearer ${token}`,
			},
			httpsAgent: new https.Agent({
				rejectUnauthorized: this.environment === 'prod',
			}),
			validateStatus: () => true,
		});
		return data;
	}

	async registerOrderGateway(params) {
		const { commerceId, commerce, wayPaymentCommerce } = this.order;
		const paramsNew = { ...params };
		if (params.sessionGateway) {
			const {
				sessionGateway: session, status, paymentStates, gateway,
			} = paramsNew;
			const referenceId = session.resultDetails ? session.resultDetails.ReferenceNo : null;
			const newGatewayTransaction = await this.saveTransaction({
				sessionGateway: session,
				status,
				paymentStates,
				referenceId,
				tokenGateway: params.sessionGateway.id,
				gatewayErrorCode: paramsNew.status === 2 ? session.result.code : null,
				additionalInformation: {
					payboxProduction: this.environment === 'prod' || false,
					user: gateway.entityId,
					token: gateway.authorization,
				},
			});
			if (paramsNew.status === 2) {
				return params.sessionGateway;
			}
			paramsNew.additionalInformation = { gatewayTransactionId: newGatewayTransaction.id };
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			paramsNew.additionalInformation = Object.assign(paramsNew.additionalInformation, {
				gatewayTransactionId: newGatewayTransaction.id,
			});
			paramsNew.wayPaymentId = wayPaymentCommerce ? wayPaymentCommerce.wayPaymentId : undefined;
		} else {
			paramsNew.additionalInformation = this._structureAdditionalInformation(paramsNew);
			const { gatewayTransactionId, paymentGateway } = paramsNew.additionalInformation;
			const gatewayTransaction = {
				gatewayAuthorizationResponse: params.gatewayResponse,
				tokenGateway: paymentGateway.authorizationCode,
				referenceId: paymentGateway.referenceId,
				gatewayErrorCode: !params.flagApproval ? paymentGateway.status : undefined,
			};
			delete paramsNew.additionalInformation.gatewayErrorCode;
			paramsNew.tokenGateway = paymentGateway.authorizationCode;
			paramsNew.referenceId = paymentGateway.referenceId;
			if (!params.flagApproval) {
				gatewayTransaction.gatewayErrorCode = `code: ${paymentGateway.status || null}`;
				paramsNew.gatewayErrorCode = `code: ${paymentGateway.status || null}`;
			}
			await this._updateTransaction(gatewayTransactionId, params.flagApproval, gatewayTransaction);
		}
		if (!commerceId) {
			paramsNew.commerceId = commerce.id;
		}
		delete paramsNew.gatewayResponse;
		delete paramsNew.dateExpiration;
		delete paramsNew.paymentStates;
		delete paramsNew.codeCategory;
		delete paramsNew.referenceId;
		delete paramsNew.gateway;
		delete paramsNew.status;
		await SalOrders.editSimple(
			this.order.id,
			{
				...paramsNew,
			},
			this.order.companyId,
		);
		return params.sessionGateway || paramsNew.additionalInformation;
	}

	_structureAdditionalInformation(data) {
		const { additionalInformation: additionalInformationNew, gatewayResponse } = data;

		let { additionalInformation } = this.order;
		additionalInformation = additionalInformation || {};
		let { paymentGateway } = additionalInformation;
		if (additionalInformationNew && additionalInformationNew.gatewayTransactionId) {
			additionalInformation.gatewayTransactionId = additionalInformationNew.gatewayTransactionId;
		}

		paymentGateway = paymentGateway || {};
		const { resultDetails, id, result } = gatewayResponse || {};
		paymentGateway.requestId =
			resultDetails && resultDetails.RequestId ? resultDetails.RequestId : paymentGateway.requestId;
		paymentGateway.referenceId =
			resultDetails && resultDetails.ReferenceNbr
				? resultDetails.ReferenceNbr
				: paymentGateway.referenceId;

		paymentGateway.status = id && result ? this._getStatusValid(result) : paymentGateway.status;
		paymentGateway.authorizationCode = id || paymentGateway.authorizationCode;
		additionalInformation.gatewayCode = datafast;
		additionalInformation = Object.assign(additionalInformation, {
			paymentGateway,
		});
		return additionalInformation;
	}

	_getStatusValid(result) {
		const [code] = result.code.split('.');
		let name;
		if (code === '000') {
			name = 'Aprobado';
		} else {
			name = 'Rechazado';
		}
		return name;
	}

	getPaymentGatewayInformation() {
		return {
			code: datafast,
			name: 'Datafast',
			description: 'Método de pago Datafast',
		};
	}

	errorCodesPaymentTransaction(codeError) {
		const codeDataFast = {
			'000.000.000': 'Approved Production',
			'000.100.112': 'Request successfully',
			'000.100.110': 'Approved Pruebas',
			'100.100.100': 'request contains no creditcard',
			'100.100.168': 'transaction declined (restricted card) Restricted Card',
			'100.100.303': 'Card Expired Card Expired',
			'100.100.402': 'cc/bank account holder not valid',
			'100.150.100': 'request contains no Account data, No checking account',
			'100.150.205': 'referenced registration does not contain an account',
			'100.380.306':
				'no authentication data provided in risk management transaction Num de autorización no existe',
			'100.400.147': 'Payment void and transaction denied by ReD Shield',
			'100.400.311': 'transaction declined (format error) Format Error',
			'100.550.310': 'amount exceeds limit for the registered account',
			'200.100.101': 'Tarjeta_No_valid_ cominucarse con proveedor',
			'200.100.103': 'contains structural errors',
			'200.300.404': 'No payment session found for the requested',
			'500.100.201': 'Channel/Merchant is disabled (no processing posible)',
			'600.200.100': 'invalid Payment Method',
			'600.200.201': 'Channel/Merchant not configured for this payment method Terminal inválido',
			'700.100.200': 'non matching reference amount',
			'700.300.700': 'reversal not possible anymore',
			'800.100.100': 'transaction declined for unknown reason',
			'800.100.151': 'transaction declined (invalid card) transaction declined (invalid card)',
			'800.100.155': 'transaction declined Insufficient Funds',
			'800.100.157': 'transaction declined (wrong expiry date)',
			'800.100.159': 'transaction declined (stolen card) Stolen Card',
			'800.100.165': 'transaction declined (card lost) Lost card',
			'800.100.170': 'transaction declined (transaction not permitted) Diferido NO permitido',
			'800.100.171': 'transaction declined (pick up card) Llame Comercio Autoriz',
			'800.100.174': 'transaction declined (invalid amount) Invalid Amount',
			'800.100.176': 'transaction declined (account temporarily not available.)',
			'800.100.179': 'transaction declined (Exceeds wdrl frecuency limit)',
			'800.100.190': 'transaction declined (invalid configuration data)',
			'800.100.197': 'transaction declined (registration cancelled externally)',
			'800.100.402': 'cc/bank account holder not valid No such issuer',
			'800.100.501': 'Card holder has advised his bank to stop Establecimiento cancelado.',
			'900.100.201':
				'error on the external gateway (bank) Entidad offline : Issuer or switch inoperative. Se ha perdido la conexión hacia el banco.',
			'900.100.300':
				'timeout, uncertain result Timeout:System Malfunction. Tiempo de espera superado',
		};
		const errorKeys = Object.keys(codeDataFast);
		const errorEureka = errorKeys.filter(item => item === `${codeError.code}`);
		return errorEureka.length > 0 ? codeDataFast[errorEureka[0]] : '';
	}

	getCurrency() {
		return this.order.currency;
	}

	getTotalPayment() {
		return this.order.total;
	}
}

module.exports = DataFast;
