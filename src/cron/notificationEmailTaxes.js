'use strict';

require('dotenv').config();
const objection = require('../config/objection');
const Sales = require('../models/Sales');
const StatusTax = require('../models/StatusTax');
const { credentials } = require('../api/authenticate-token');
const simpleAxios = require('../api/shared/simple-axios');

objection.initConnection();

async function notificationMail() {
	const data = await Sales.getAllByStatusTax(StatusTax.error);
	const { settings } = credentials.employee.company;
	const newData = data.reduce((acum, item) => {
		const subsidiaryIndex = acum.findIndex(i => i.id === item.comSubsidiaryId);
		if (item.subsidiary.email) {
			if (subsidiaryIndex === -1 && item.subsidiary.email) {
				return acum.concat({
					id: item.comSubsidiaryId,
					companyId: item.comCompanyId,
					companyName: item.company.companyName,
					name: item.subsidiary.sucursalName,
					email: item.subsidiary.email,
					documents: [`${item.typeDocument.code}${item.documentNumber}`],
				});
			}
			const newAcum = acum;
			const { documents } = acum[subsidiaryIndex];
			documents.push(`${item.typeDocument.code}${item.documentNumber}`);
			newAcum[subsidiaryIndex].documents = documents;
			return newAcum;
		}
		return acum;
	}, []);

	newData.forEach((element) => {
		const notification = {
			companyId: process.env.MAKI_COMPANY_ID,
			data: {
				from: settings.mailSender ? settings.mailSender : process.env.MAKI_ADMIN_FROM,
				to: element.email,
				message: `Mensaje de ${element.name}`,
				content: element,
			},
			templateCode: process.env.MAKI_EMAIL_TEMPLATE_CODE,
		};
		simpleAxios
			.post(`${process.env.NOTIFICATIONS_MAKI_URL}/notifications/EMAIL/public`, notification)
			.catch((error) => {
				Promise.reject(error);
			});
	});
	return newData;
}

module.exports = notificationMail;
