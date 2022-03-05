'use strict';

const helper = require('./../src/shared/helperMigration');

exports.up = function(knex, Promise) {
    return knex.schema.createTable('categories', (table) => {
		table.increments().primary();
		table.string('name').nullable();
		table.string('description').nullable();
		table.boolean('done').defaultTo(false);
			helper.defaultColumns(table, false);

	})
  
};

exports.down = function(knex, Promise) {
  
    return knex.schema.dropTable('categories');
};
