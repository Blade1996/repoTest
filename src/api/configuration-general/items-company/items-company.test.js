'use strict';

const test = require('tape');
const helper = require('./../../../shared/helperTest');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('GET /items-company get all items', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /items-company should return status 200';

	assert.equal(actual, expected, message);
	const actual2 = response.result.length;
	const expected2 = 3;
	const message2 = 'GET /items-company should return 4 record';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /items-company get all items', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/items-company?latitude=1,43543&longitude=3,454534',
	};

	const response = await server.inject(route);

	assert.plan(2);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /items-company should return status 200';

	assert.equal(actual, expected, message);

	const actual2 = response.result.length;
	const expected2 = 3;
	const message2 = 'GET /items-company should return 4 record';

	assert.equal(actual2, expected2, message2);

	assert.end();
});

test('GET /items-company/6 get one item', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/items-company/6',
	};

	const response = await server.inject(route);
	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'GET /items-company should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('GET /items-company/1 does not get any item', async (assert) => {
	const route = {
		method: 'GET',
		credentials: helper.fakeCredentials(),
		url: '/items-company/1',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'GET /items-company should return status 400';

	assert.equal(actual, expected, message);
	assert.end();
});

test('/POST /items-company create a new item', async (assert) => {
	const route = {
		method: 'POST',
		credentials: helper.fakeCredentials(),
		payload: {
			name: 'mouse',
			code: 'mouse_code',
			dataState: {},
			salSaleColumns: {},
			urlImage: 'img.png',
			urlIcon: 'img.png',
		},
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 201;
	const message = 'POST /items-company should return status 201';

	assert.equal(actual, expected, message);
	assert.end();
});

test('/POST /items-company does not create a item without name', async (assert) => {
	const route = {
		method: 'POST',
		credentials: helper.fakeCredentials(),
		payload: {
			dataState: {},
			salSaleColumns: {},
		},
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = '/POST /items-company should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('/POST /items-company does not create a item without dataState', async (assert) => {
	const route = {
		method: 'POST',
		credentials: helper.fakeCredentials(),
		payload: {
			name: 'keyboard',
			salSaleColumns: {},
		},
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = '/POST /items-company should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('/POST /items-company does not create a item without name and dataState', async (assert) => {
	const route = {
		method: 'POST',
		credentials: helper.fakeCredentials(),
		payload: {
			salSaleColumns: {},
		},
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = '/POST /items-company should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('/POST /items-company does not create a item with type', async (assert) => {
	const route = {
		method: 'POST',
		credentials: helper.fakeCredentials(),
		payload: {
			name: 'mouse',
			code: 'mouse_code',
			dataState: {},
			salSaleColumns: {},
			urlImage: 'img.png',
			urlIcon: 'img.png',
			type: 1,
		},
		url: '/items-company',
	};

	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = '/POST /items-company should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/7 should update a item', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/7',
		payload: {
			name: 'keyboard',
			dataState: {},
			salSaleColumns: {},
			urlImage: 'img.png',
			urlIcon: 'img.png',
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'PATCH /items-company/7 should return status 200';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/8 does not update a item without name', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/8',
		payload: {
			dataState: {},
			salSaleColumns: {},
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'PATCH /items-company/8 should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/8 does not update a item without dataState', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/8',
		payload: {
			name: 'keyboard',
			salSaleColumns: {},
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'PATCH /items-company/8 should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/8 does not update a item without name and dataState', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/8',
		payload: {
			salSaleColumns: {},
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'PATCH /items-company/8 should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/8 does not update a item with type', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/8',
		payload: {
			name: 'keyboard',
			dataState: {},
			salSaleColumns: {},
			urlImage: 'img.png',
			urlIcon: 'img.png',
			type: 1,
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'PATCH /items-company/8 should return status 400';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/4 does not update a item because tpye is 1', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/4',
		payload: {
			name: 'keyboard',
			dataState: {},
			salSaleColumns: {},
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.result;
	const expected = 0;
	const message = 'PATCH /items-company/4 should return 0';

	assert.equal(actual, expected, message);

	assert.end();
});

test('PATCH /items-company/9 does not update a item because it does not belong to the company', async (assert) => {
	const route = {
		method: 'PATCH',
		credentials: helper.fakeCredentials(),
		url: '/items-company/9',
		payload: {
			name: 'keyboard',
			dataState: {},
			salSaleColumns: {},
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.result;
	const expected = 0;
	const message = 'PATCH /items-company/9 should return 0';

	assert.equal(actual, expected, message);

	assert.end();
});

test('DELETE /items-company/7 should delete a item', async (assert) => {
	const route = {
		method: 'DELETE',
		credentials: helper.fakeCredentials(),
		url: '/items-company/7',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'DELETE /items-company/7 should return status 200';

	assert.equal(actual, expected, message);

	assert.end();
});

test('DELETE /items-company/4 should not delete a item', async (assert) => {
	const route = {
		method: 'DELETE',
		credentials: helper.fakeCredentials(),
		url: '/items-company/4',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.result;
	const expected = 0;
	const message = 'DELETE /items-company/4 should return result 0';

	assert.equal(actual, expected, message);

	assert.end();
});

test('DELETE /items-company/5 should not delete a item', async (assert) => {
	const route = {
		method: 'DELETE',
		credentials: helper.fakeCredentials(),
		url: '/items-company/5',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.result;
	const expected = 0;
	const message = 'DELETE /items-company/5 should return result 0';

	assert.equal(actual, expected, message);

	assert.end();
});

test('DELETE /items-company/9 should not delete a item', async (assert) => {
	const route = {
		method: 'DELETE',
		credentials: helper.fakeCredentials(),
		url: '/items-company/9',
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 400;
	const message = 'DELETE /items-company/9 should return statusCode 400';

	assert.equal(actual, expected, message);

	assert.end();
});
