'use strict'

exports.up = function(knex, Promise) {
    return knex.schema.createTable('product',(table)=>{ 
        table.increments().primary();
        table.string('name').nullable();
        table.string('description').nullable();
        table.int('quantity');
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('product');
};