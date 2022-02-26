'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('to_do', (table) => {
		table.increments().primary();
		table.string('activity').nullable();
		table.boolean('done').defaultTo(false);
	})
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable('to_do');
};
