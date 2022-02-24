'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');
const Terminal = require('../../../models/Terminal');
const { connected } = require('../../../models/enums/state-conexion-devices-enums');
const { available } = require('../../../models/enums/session-status-terminal-enum');

async function handler(request) {
	try {
		const { cms_companies_id: companyId, employee } = request.auth.credentials;
		const data = await Device.editDisconnectByUser(request.params.userCode, companyId);
		const deviceTerminal = await Device.getByTerminal(companyId, {
			terminalId: employee.salTerminalsId,
			stateConexion: connected,
		});
		if (deviceTerminal && deviceTerminal.length === 0) {
			await Terminal.edit(employee.salTerminalsId, { sessionStatusId: available }, companyId);
		}
		return data;
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
