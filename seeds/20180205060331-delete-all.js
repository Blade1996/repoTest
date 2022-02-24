exports.seed = function (knex) {
	return knex('com_country').del()
};
