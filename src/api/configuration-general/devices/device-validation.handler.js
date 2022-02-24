'use strict';

const Boom = require('boom');
const Device = require('../../../models/Device');
const simpleAxios = require('../../shared/simple-axios');
const stateConexion = require('../../../models/enums/state-conexion-devices-enums');
const typeDevice = require('../../../models/enums/TypeDevice');
const { isNullOrUndefined } = require('./../../../shared/helper');
const {
	terminalSessionExist,
	deviceSessionExist,
	typeDeviceTerminalInvalid,
} = require('../../shared/error-codes');

async function handler(request) {
	try {
		const { skipDeviceValidation } = request.pre;
		const {
			cms_companies_id: companyId,
			com_subsidiaries_id: subsidiaryId,
			war_warehouses_id: warehouseId,
			code_device: codeDevice,
			flag_movil: flagMovil,
			info_device: infoDevice,
			id: employeeId,
			sal_terminals_id: terminalId,
			authorization,
			employee,
		} = request.auth.credentials;
		const { terminal } = employee;
		const typeConexion = flagMovil ? typeDevice.movil : typeDevice.web;

		if (skipDeviceValidation) {
			// Registering device despite it skips validations
			const newSessionDevice = {
				companyId,
				subsidiaryId,
				warehouseId: !isNullOrUndefined(warehouseId) ? warehouseId : undefined,
				employeeId,
				codeDevice,
				brandName: infoDevice && infoDevice.brand ? infoDevice.brand : '',
				licence: '',
				additionalInformation: infoDevice || {},
				stateConexion: stateConexion.connected,
				warehouseName: (terminal && terminal.warWarehousesName) || '',
				terminalId,
				codeUser: employee.aclUserCode,
				userName: employee.name,
				typeConexion,
				inDate: new Date(),
			};

			const newDevice = await Device.create(newSessionDevice);
			return { newDevice };
		}

		const deviceTerminal = await Device.getByTerminal(companyId, {
			terminalId,
			stateConexion: stateConexion.connected,
		});
		const newSessionDevice = {
			companyId,
			subsidiaryId,
			warehouseId,
			employeeId,
			codeDevice,
			brandName: infoDevice && infoDevice.brand ? infoDevice.brand : '',
			licence: '',
			additionalInformation: infoDevice || {},
			stateConexion: stateConexion.connected,
			warehouseName: (terminal && terminal.warWarehousesName) || '',
			terminalId,
			codeUser: employee.aclUserCode,
			userName: employee.name,
			typeConexion,
			inDate: new Date(),
		};
		if (isNullOrUndefined(terminal.typeDevice) || terminal.typeDevice === typeConexion) {
			// si ya tiene sesiones activas el punto de venta
			if (deviceTerminal && deviceTerminal.length > 0) {
				if (deviceTerminal.find(i => i.typeConexion === typeDevice.movil)) {
					const { data: aclResponseLogout } = await simpleAxios({
						url: `${process.env.ACL_URL}/logout`,
						method: 'POST',
						headers: {
							authorization,
						},
						data: {
							typeLogout: terminalSessionExist,
						},
						validateStatus: () => true,
					});
					return { codeMessage: terminalSessionExist, aclResponseLogout, deviceTerminal };
					// si las sessiones existentes son de web y la nueva de movil, boto a las de web
				} else if (codeDevice) {
					await simpleAxios({
						url: `${process.env.ACL_URL}/logout`,
						method: 'POST',
						headers: {
							authorization,
						},
						data: {
							codeUsers: deviceTerminal.map(i => i.codeUser),
							typeLogout: terminalSessionExist,
						},
						validateStatus: () => true,
					});
					// y actualizo el estado y user en el dispositivo (si no existe lo creo)
					// si ese dispositivo ya estaba online boto al user y guardo al nuevo
					const deviceExist = await Device.getByCodeDevice(companyId, codeDevice);
					if (deviceExist) {
						if (deviceExist.stateConexion === stateConexion.connected) {
							await simpleAxios({
								url: `${process.env.ACL_URL}/logout`,
								method: 'POST',
								headers: {
									authorization,
								},
								data: {
									codeUsers: [deviceExist.codeUser],
									typeLogout: deviceSessionExist,
								},
								validateStatus: () => true,
							});
						}
						await Device.edit({ id: deviceExist.id, data: newSessionDevice }, companyId);
					}
				}
			}
			const newDevice = await Device.create(newSessionDevice);
			return { newDevice };
		}
		const { data: aclResponseLogout } = await simpleAxios({
			url: `${process.env.ACL_URL}/logout`,
			method: 'POST',
			headers: {
				authorization,
			},
			data: {
				typeLogout: typeDeviceTerminalInvalid,
			},
			validateStatus: () => true,
		});
		return { codeMessage: typeDeviceTerminalInvalid, aclResponseLogout };
	} catch (error) {
		return Boom.badImplementation(error, error);
	}
}

module.exports = handler;
