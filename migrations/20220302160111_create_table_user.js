'use strict';
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user', (table) => {
		table.increments().primary();
		table.string('name').nullable();
        table.string('email').unique().nullable();
        table.string('password').nullable();
		table.boolean('done').defaultTo(true);
        
	})
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user');
};
