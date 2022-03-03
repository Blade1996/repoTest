'use strict'

exports.up = function(knex, Promise) {
    return knex.schema.table('to_do', function(table){
		table.timestamp('deleted_at').nullable().after('done').defaultTo(null);
	})
};

exports.down = function(knex, Promise) {
    return knex.schema.table('to_do', function(table){
		table.dropColumn('deleted_at');
	})
};
