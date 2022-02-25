'use strict';

const messages = require('./error-messages');

function failAction(request, h, error) {
	const newError = error;
	newError.reformat();
	newError.output.payload.code = 'error_validation';
	return newError;
}

function getMessageError(code) {
	return (
		messages[code] ||
		`Error en los datos enviados. Verifique la información del código de error ${code} o comuníquese con soporte para su revisión.`
	);
}

const methods = {
	failAction,
	getMessageError,
};

module.exports = methods;
