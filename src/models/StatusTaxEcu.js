'use strict';

const status = {
	unSent: 1,
	signature: 2,
	signatureError: 3,
	sent: 4,
	errorSent: 5,
	inProcessAuthorize: 6,
	authorize: 7,
	errorAuthorize: 8,
	inProcess: 9,
	validationError: 10,
};

module.exports = status;
