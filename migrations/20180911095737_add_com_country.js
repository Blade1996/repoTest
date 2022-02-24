'use strict';

exports.up = function(knex) {
  return knex.schema.table('com_country', (table) => {
      table.text('config_supplier').nullable().after('tax_size');
  })
  .raw('ALTER TABLE com_country MODIFY COLUMN config_supplier JSON');
};

exports.down = function(knex) {
  return knex.schema.table('com_country', (table) => {
      table.dropColumn('config_supplier');
  });
};
