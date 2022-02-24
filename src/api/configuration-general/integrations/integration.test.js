'use strict';

const test = require('tape');
const helper = require('../../../shared/helperTest');
const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIN',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('PATCH /integrations/TIN update one integrations', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			integrationCategory: [
				{
					code: 'MAIL',
					name: 'Correo',
					integrations: [
						{
							id: 4,
							code: 'push',
							name: 'Push',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 5,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
						},
						{
							id: 6,
							code: 'gmail',
							name: 'Gmail',
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 7,
							code: 'gmail',
							name: 'Gmail',
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
							},
						},
					],
				},
			],
		},
		url: '/integrations/TIN?subsidiaryId=1',
	};

	const mock = new MockAdapter(axios);
	mock.onPatch(`${process.env.ACL_URL}/company/serviceaccount`).reply(200, {
		data: {
			message: 'MAÑANA FIFA OH SI',
		},
	});

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /integrations/1 should return integrations with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIN',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('PATCH /integrations/TID update one integrations', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			integrationCategory: [
				{
					code: 'MAIL',
					name: 'Correo',
					integrations: [
						{
							id: 9,
							code: 'push',
							name: 'Push',
							flagCustomizer: true,
						},
						{
							id: 10,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: false,
							config: {
								ipServer: '34.343.33.43:3306',
								server: '0.454.2.3',
								port: 3306,
								typeConnection: 'DP31',
								mail: 'soporte1@gmail.com',
								accessKey: '12345645',
								accessUser: 'sadasddasdasd',
							},
						},
						{
							id: 11,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: false,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 12,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
							},
						},
					],
				},
			],
		},
		url: '/integrations/TID?subsidiaryId=1',
	};

	const mock = new MockAdapter(axios);
	mock.onPatch(`${process.env.ACL_URL}/company/serviceaccount`).reply(200, {
		data: {
			message: 'MAÑANA FIFA OH SI',
		},
	});

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /integrations/2 should return integrations with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIP',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIN',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('PATCH /integrations/TIN update one sin subsidiary integrations', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			integrationCategory: [
				{
					code: 'MAIL',
					name: 'Correo',
					integrations: [
						{
							id: 4,
							code: 'push',
							name: 'Push',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 5,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43:3306',
								server: '0.454.2.3',
								port: 3306,
								typeConnection: 'DP31',
								mail: 'soporte1@gmail.com',
								accessKey: '12345645',
								accessUser: 'sadasddasdasd',
							},
						},
						{
							id: 6,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 7,
							code: 'gmail',
							name: 'Gmail',
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
							},
						},
					],
				},
			],
		},
		url: '/integrations/TIN',
	};

	const mock = new MockAdapter(axios);
	mock.onPatch(`${process.env.ACL_URL}/company/serviceaccount`).reply(200, {
		data: {
			message: 'MAÑANA FIFA OH SI',
		},
	});

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /integrations/TIN should return integrations with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /integrations/TIN update one integrations', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			integrationCategory: [
				{
					code: 'MAIL',
					name: 'Correo',
					integrations: [
						{
							id: 4,
							code: 'push',
							name: 'Push',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 5,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43:3306',
								server: '0.454.2.3',
								port: 3306,
								typeConnection: 'DP31',
								mail: 'soporte1@gmail.com',
								accessKey: '12345645',
								accessUser: 'sadasddasdasd',
							},
						},
						{
							id: 6,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 7,
							code: 'gmail',
							name: 'Gmail',
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
							},
						},
					],
				},
			],
		},
		url: '/integrations/TIN?subsidiaryId=1',
	};

	const mock = new MockAdapter(axios);
	mock.onPatch(`${process.env.ACL_URL}/company/serviceaccount`).reply(200, {
		data: {
			message: 'MAÑANA FIFA OH SI',
		},
	});

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /integrations/1 should return integrations with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIN',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIP',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('GET /integrations/{codeType} get all integrations', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations/TIN',
	};
	const response = await server.inject(route);

	assert.plan(1);
	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations/{codeType} should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('PATCH /integrations/TIN update one integrations', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		payload: {
			integrationCategory: [
				{
					code: 'MAIL',
					name: 'Correo',
					integrations: [
						{
							id: 4,
							code: 'push',
							name: 'Push',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 5,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43:3306',
								server: '0.454.2.3',
								port: 3306,
								typeConnection: 'DP31',
								mail: 'soporte1@gmail.com',
								accessKey: '12345645',
								accessUser: 'sadasddasdasd',
							},
							configAdditional: {
								confPay: '34.343.33.43:3306',
								newDate: 'asdasdasd',
								newAdditional: 'sadasddasdasd',
							},
						},
						{
							id: 6,
							code: 'gmail',
							name: 'Gmail',
							flagCustomizer: true,
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
								accessKey: '1235',
								accessUser: 'sadasd',
							},
						},
						{
							id: 7,
							code: 'gmail',
							name: 'Gmail',
							config: {
								ipServer: '34.343.33.43',
								server: '0.454.2.3',
								port: 4555,
								typeConnection: 'DP3',
								mail: 'soporte@gmail.com',
							},
						},
					],
				},
			],
		},
		url: '/integrations/TIN?subsidiaryId=1',
	};

	const mock = new MockAdapter(axios);
	mock.onPatch(`${process.env.ACL_URL}/company/serviceaccount`).reply(200, {
		data: {
			message: 'MAÑANA FIFA OH SI',
		},
	});

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /integrations/1 should return integrations with id 1';
	assert.equal(actual, expected, message);

	assert.end();
});

test('GET /integrations get all integrations filtered by subsidiary', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/integrations?subsidiaryId=1',
	};
	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /integrations should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});
