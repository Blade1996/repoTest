'use strict';

const test = require('tape');
const helper = require('../../../shared/helperTest');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('GET /devices get all devices', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/devices',
	};
	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /devices should return status 200';

	assert.equal(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 1;
	const message2 = 'GET /devices should return 2 record';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /devices get all devices with pagination', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/devices?page=1',
	};
	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.headers['x-quantity'];
	const expected = 1;
	const message = 'GET /devices should return the header x-quantity with value 1';

	assert.equal(actual, expected, message);

	const actual2 = response.headers['x-last-page'];
	const expected2 = 1;
	const message2 = 'GET /devices should return the header x-last-page with value 1';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /devices/1 get details from one devices', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/devices/1',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /devices/1 should return devices with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /disconnect-devices/{userCode}/user update state conecction one device', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/disconnect-devices/12345/user',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /disconnect-devices/{userCode}/user should return devices with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('GET /devices get all devices', async (assert) => {
	const url = '/devices?terminalId=1&warehouseId=1&stateConexion=2';
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url,
	};
	const response = await server.inject(route);
	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = `GET ${url} should return status ${expected}`;

	assert.equal(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 1;
	const message2 = `GET ${url} should return ${expected2} records`;

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /devices gell device filtered by search', async (assert) => {
	const url = '/devices?search=rndviu38';
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url,
	};
	const response = await server.inject(route);
	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = `GET ${url} should return status ${expected}`;

	assert.equal(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 1;
	const message2 = `GET ${url} should return ${expected2} records`;

	assert.equal(actual2, expected2, message2);

	assert.end();
});
