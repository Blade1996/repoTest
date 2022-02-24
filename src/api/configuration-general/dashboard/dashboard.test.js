'use strict';

const test = require('tape');
const helper = require('../../../shared/helperTest');

let server = null;

helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('/GET obtain number of employees, subsidiaries, transactions and electronic documents.', async (assert) => {
	const route = {
		method: 'GET',
		url: '/dashboard?aclCode=123&startDate=2018-11-25&endDate=2018-12-23',
	};

	const { statusCode } = await server.inject(route);
	assert.plan(1);
	const actual = statusCode;
	const expected = 200;
	const message = 'GET /dashboard must return status 200';

	assert.equal(actual, expected, message);

	assert.end();
});

test('/GET not obtain number of employees, subsidiaries, transactions and electronic documents without aclCode.', async (assert) => {
	const route = {
		method: 'GET',
		url: '/dashboard?startDate=2018-11-25&endDate=2019-01-23',
	};

	const { statusCode } = await server.inject(route);
	assert.plan(1);
	const actual = statusCode;
	const expected = 400;
	const message = 'GET /dashboard must return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('/GET not obtain number of employees, subsidiaries, transactions and electronic documents without startDate and endDate.', async (assert) => {
	const route = {
		method: 'GET',
		url: '/dashboard?aclCode=123',
	};

	const { statusCode } = await server.inject(route);
	assert.plan(1);
	const actual = statusCode;
	const expected = 400;
	const message = 'GET /dashboard must return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});
