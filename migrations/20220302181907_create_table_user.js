'use strict'

exports.up = function(knex, Promise) {
    return knex.schema.createTable('user',(table)=>{ 
        table.increments().primary();
        table.string('name');
        table.string('email');
        table.string('password');
        table.boolean('status').defaultTo(true);
      })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user');
};
