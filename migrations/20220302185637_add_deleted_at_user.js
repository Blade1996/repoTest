'use strict'

exports.up = function(knex, Promise) {
    return knex.schema.table('user', function(table){
		table.timestamp('deleted_at').nullable().after('status').defaultTo(null);
	})
};

exports.down = function(knex, Promise) {
    return knex.schema.table('user', function(table){
		table.dropColumn('deleted_at');
	})
};
