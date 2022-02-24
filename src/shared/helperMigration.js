'use strict';

function defaultColumns(table, includeCompany = true) {
	if (includeCompany) {
		table.integer('company_id');
	}
	table
		.boolean('flag_active')
		.notNullable()
		.defaultTo(true);
	table
		.timestamp('deleted_at')
		.nullable()
		.defaultTo(null);
	table.timestamps(true, true);
}

const methods = {
	defaultColumns,
};

module.exports = methods;
