'use strict';

const status = {
	unSent: 1,
	inProcess: 2,
	validated: 3,
	error: 4,
	signature: 5,
	signatureError: 6,
	errorFromTaxesBiller: 7,
};

module.exports = status;
