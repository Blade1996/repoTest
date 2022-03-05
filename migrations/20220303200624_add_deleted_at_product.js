
exports.up = function(knex, Promise) {
    return knex.schema.table('product', function(table){
		table.timestamp('deleted_at').nullable().after('quantity').defaultTo(null);
	})
};

exports.down = function(knex, Promise) {
    return knex.schema.table('product', function(table){
		table.dropColumn('deleted_at');
	})
};
