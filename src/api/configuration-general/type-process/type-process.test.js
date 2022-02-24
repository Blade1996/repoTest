'use strict';

const test = require('tape');
const helper = require('../../../shared/helperTest');

let server = null;
helper.mockServer().then((serverResponse) => {
	server = serverResponse;
});

test('POST /type-process/migration config migration process 1', async (assert) => {
	const route = {
		method: 'POST',
		url: '/type-process/migration',
		payload: {
			data: {},
			typeOperation: 1,
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'POST /type-process/migration 1 should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('POST /type-process/migration config migration process 2', async (assert) => {
	const route = {
		method: 'POST',
		url: '/type-process/migration',
		payload: {
			data: {
				settings: {
					272: {
						id: 272,
						name: 'DTOTEC',
						oldId: 663,
						status: 1,
						employeeId: 1867,
						scriptEjecute: 'com_subsidiaries',
						ejecuteNextScript: 'war_warehouses',
						bdNextScript: 2,
					},
				},
				id: 1,
				bdNextScript: 1,
				ejecuteNextScript: 'pur_suppliers',
				scriptEjecute: 'com_customers',
				status: 0,
				companyId: 272,
			},
			typeOperation: 2,
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'POST /type-process/migration 2 should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});

test('POST /type-process/migration config migration process 3', async (assert) => {
	const route = {
		method: 'POST',
		url: '/type-process/migration',
		payload: {
			data: {
				settings: {
					272: {
						id: 272,
						name: 'DTOTEC',
						oldId: 663,
						status: 1,
						employeeId: 1867,
						scriptEjecute: 'com_subsidiaries',
						ejecuteNextScript: 'war_warehouses',
						bdNextScript: 2,
					},
				},
				id: 1,
				status: 1,
				companyId: 272,
			},
			typeOperation: 2,
		},
	};
	const response = await server.inject(route);

	assert.plan(1);

	const actual = response.statusCode;
	const expected = 200;
	const message = 'POST /type-process/migration 3 should return status 200';

	assert.equal(actual, expected, message);
	assert.end();
});
