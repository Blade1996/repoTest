'use strict';

const helper = require('./../src/shared/helperMigration');

exports.up = function(knex, Promise) {
	return knex.schema.createTableIfNotExists('com_country', (table) => {
		table.increments().primary();
		table.string('name');
		table.string('country_code', 15);
		table.string('tax_name', 15);
		table.string('url_image');
		table.integer('tax_size');
		helper.defaultColumns(table, false);
	})  
};

exports.down = function(knex, Promise) {
  	return knex.schema.dropTable('com_country');
};
