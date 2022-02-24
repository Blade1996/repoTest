'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');
const { deviceNotFound, deviceDisconnectInvalid } = require('../../shared/error-codes');
const { connected } = require('../../../models/enums/state-conexion-devices-enums');

async function getDevice(request) {
	try {
		const { cms_companies_id: companyId } = request.auth.credentials;
		const data = await Device.getById(request.params.id, companyId);
		return data || Boom.badRequest(deviceNotFound);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

async function validDisconnectDevice(request, h) {
	try {
		const { deviceSession } = request.pre;
		return deviceSession.stateConexion === connected
			? h.response()
			: Boom.badRequest(deviceDisconnectInvalid);
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}
const methods = {
	getDevice,
	validDisconnectDevice,
};

module.exports = methods;
