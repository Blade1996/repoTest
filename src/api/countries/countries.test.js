'use strict';

const test = require('tape');
const helper = require('./../../shared/helperTest');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('GET /countries get all countries', async (assert) => {
	const route = {
		method: 'GET',
		url: '/countries',
	};
	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /countries should return status 200';

	assert.equals(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 3;
	const message2 = 'GET /countries should return 2 records';

	assert.equals(actual2, expected2, message2);

	assert.end();
});

test('GET /countries/1 get details from one country', async (assert) => {
	const route = {
		method: 'GET',
		url: '/countries/1',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /countries/1 should return country with id 1';

	assert.equal(actual, expected, message);

	assert.end();
});
