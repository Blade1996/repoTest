'use strict';

const test = require('tape');
const db = require('./../config/objection');
const helperTest = require('./../shared/helperTest');

const glueCompose = helperTest.mockServer();

let server = {};
glueCompose.then((serverResponse) => {
	server = serverResponse;
});

test('clean database', (assert) => {
	db.closeConnection(() => {
		assert.end();
	}, false);
});

test('status code of root path /', async (assert) => {
	const options = {
		method: 'GET',
		url: '/',
	};
	const response = await server.inject(options);
	const actual = response.statusCode;
	const expected = 404;
	const message = 'root path / should return 404 status code';
	assert.equal(actual, expected, message);
	assert.end();
});
