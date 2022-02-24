'use strict';

const Process = require('../models/Process');
const TypeNotification = require('../notifications/notification-strategies/type-notifications-enums');
const integrationTypeEntity = require('../models/enums/integration-type-entity-enum');
const { notifications: not } = require('./type-integrations-enum.js');
const ValidationNotification = require('../notifications/validation-type-notification.js');

async function runProcess({
	processCode,
	params,
	companyId,
	moduleId,
	onlyTypeNot,
	subsidiary,
	typeIntegrationCode = not,
	authorization,
}) {
	const responseStatus = { sendProcess: 0, process: {} };
	const comProcess = await Process.getByCode(
		{
			code: processCode,
			typeEntity: integrationTypeEntity.process,
			subsidiary,
			typeIntegrationCode,
		},
		companyId,
	);
	let auxProcess =
		comProcess && comProcess.processTypeIntegration ? comProcess.processTypeIntegration : {};
	let flagProcess = false;
	if (
		auxProcess &&
		auxProcess.configTypeIntegration &&
		auxProcess.configTypeIntegration.length > 0
	) {
		flagProcess = true;
	} else {
		flagProcess = true;
		auxProcess = {
			default: true,
			moduleId,
			configTypeIntegration: [
				{
					code: TypeNotification.email,
					flagActive: true,
				},
				{
					code: TypeNotification.wsap,
					flagActive: true,
				},
				{
					code: TypeNotification.push,
					flagActive: true,
				},
			],
		};
	}

	if (flagProcess) {
		return ValidationNotification({
			auxProcess,
			params,
			onlyTypeNot,
			subsidiary,
			authorization,
		});
	}
	return responseStatus;
}

module.exports = runProcess;
