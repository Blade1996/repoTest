'use strict';

/* eslint-disable import/no-extraneous-dependencies */
const test = require('tape');
const db = require('./objection');

test('shutdown knex', (assert) => {
	db.closeConnection(() => {
		assert.end();
	});
});
