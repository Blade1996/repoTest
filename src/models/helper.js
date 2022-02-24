'use strict';

const momentTz = require('moment-timezone');
const moment = require('moment');
const handlebars = require('handlebars');

const checkingAccountStatus = {
	PENDING: 1,
	PAID_OUT: 2,
};

const defaultCurrency = {
	PEN: 'PEN',
};

function renderHtml(templateHtml, data) {
	const template = handlebars.compile(templateHtml);
	return template(data);
}

function defaultFields() {
	const defaultProperties = {
		createdAt: {
			type: 'date',
		},
		deletedAt: {
			type: 'date',
			default: null,
		},
		flagActive: {
			type: 'boolean',
			default: true,
		},
		updatedAt: {
			type: 'date',
		},
	};
	return defaultProperties;
}

function localDate(date, format = 'YYYY-MM-DD HH:mm:ss', tz = 'America/Lima') {
	return momentTz(date)
		.tz(tz)
		.format(format);
}

function localDateSimple(date, format = 'YYYY-MM-DD HH:mm:ss') {
	return momentTz(date).format(format);
}

function localDateToWords(date) {
	const month = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre',
	];
	return `${moment(date).date()}, ${month[moment(date).month()]} del ${moment(date).year()}`;
}

function localDateAddDays(number, format = 'YYYY-MM-DD HH:mm:ss', tz = 'America/Lima') {
	return momentTz()
		.add(number, 'days')
		.tz(tz)
		.format(format);
}

function validFilterMaxDays(
	{ startDate, endDate, number = 30 },
	format = 'YYYY-MM-DD HH:mm:ss',
	tz = 'America/Lima',
) {
	if (startDate && endDate) {
		const newEndDate = momentTz(startDate)
			.add(number, 'days')
			.tz(tz)
			.format(format);
		return endDate > newEndDate;
	}
	return false;
}

const methods = {
	checkingAccountStatus,
	defaultCurrency,
	defaultFields,
	localDateAddDays,
	localDateToWords,
	localDateSimple,
	renderHtml,
	localDate,
	validFilterMaxDays,
};

module.exports = methods;
