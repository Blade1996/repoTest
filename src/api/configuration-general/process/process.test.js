'use strict';

const test = require('tape');
const helper = require('../../../shared/helperTest');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('GET /process get all process', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/process',
	};
	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /process should return status 200';

	assert.equal(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 5;
	const message2 = 'GET /process should return 2 record';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /process get all process with pagination', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/process?page=1',
	};
	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.headers['x-quantity'];
	const expected = 5;
	const message = 'GET /process should return the header x-quantity with value 1';

	assert.equal(actual, expected, message);

	const actual2 = response.headers['x-last-page'];
	const expected2 = 1;
	const message2 = 'GET /process should return the header x-last-page with value 1';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /process/1 get details from one process', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/process/1?subsidiaryId=1',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /process/1 should return process with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /process/3 update one process', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			name: 'Crear venta',
			moduleId: 1,
			ambit: 'SALES',
			typeNot: [
				{
					name: 'Correo',
					code: 'EMAIL',
					flagActive: true,
					urlImage: 'yaqueiroterminaresto.jpg',
					templates: [
						{
							code: 'template1',
							name: 'Template 1',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: true,
						},
						{
							code: 'template1',
							name: 'Template 2',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: false,
						},
					],
					actions: {},
					templateStructure: {},
				},
				{
					name: 'WhatsApp',
					code: 'WSAP',
					flagActive: true,
					urlImage: 'eytu_situ_manco.jpg',
					templates: [
						{
							code: 'template1',
							name: 'Template 1',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: true,
						},
						{
							code: 'template1',
							name: 'Template 2',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: true,
						},
					],
				},
				{
					name: 'Push Notification',
					code: 'PUSH',
					urlImage: 'eytu_situ_manco.jpg',
					flagActive: true,
					templates: [
						{
							code: 'template1',
							name: 'Template 1',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: true,
						},
						{
							code: 'template1',
							name: 'Template 2',
							urlImage: 'eytu_situ_manco.jpg',
							flagActive: true,
						},
					],
				},
			],
		},
		url: '/process/3?subsidiaryId=1&integrationTypeCode=TID',
	};
	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /process/3 should return process with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /process/3/active update one process status flagActive', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			flagActive: true,
		},
		url: '/process/3/active',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /process/3/active should return process with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /process/3 update one process by Id', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			name: 'Crear venta test',
			ambit: 'VENTAS',
			typeNot: [
				{
					name: 'Correo test',
					code: 'EMAIL',
					flagActive: true,
				},
				{
					name: 'WhatsApp test',
					code: 'WSAP',
					flagActive: true,
				},
				{
					name: 'Push Notification test',
					code: 'PUSH',
					flagActive: true,
				},
			],
			moduleId: 1,
		},
		url: '/process/3?subsidiaryId=1&integrationTypeCode=TIE',
	};
	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /process/2 should return 200 statusCode';
	assert.equal(actual, expected, message);

	assert.end();
});
