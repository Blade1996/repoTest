'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');
const Terminal = require('../../../models/Terminal');
const simpleAxios = require('../../shared/simple-axios');
const { connected } = require('../../../models/enums/state-conexion-devices-enums');
const { available } = require('../../../models/enums/session-status-terminal-enum');
const { deviceSessionLogout } = require('../../shared/error-codes');

async function handler(request) {
	try {
		const { cms_companies_id: companyId, employee, authorization } = request.auth.credentials;
		const { deviceSession } = request.pre;
		const { data: aclResponseLogout } = await simpleAxios({
			url: `${process.env.ACL_URL}/logout`,
			method: 'POST',
			headers: {
				authorization,
			},
			data: {
				codeUsers: [deviceSession.codeUser],
				codeDevice: deviceSession.codeDevice,
				typeLogout: deviceSessionLogout,
				typeConexion: deviceSession.typeConexion,
			},
			validateStatus: () => true,
		});
		await Device.editDisconnectByUser(deviceSession.codeUser, companyId, deviceSession.codeDevice);
		const deviceTerminal = await Device.getByTerminal(companyId, {
			terminalId: employee.salTerminalsId,
			stateConexion: connected,
		});
		if (deviceTerminal && deviceTerminal.length === 0) {
			await Terminal.edit(employee.salTerminalsId, { sessionStatusId: available }, companyId);
		}
		return { aclResponseLogout };
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
