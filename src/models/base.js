'use strict';

const objection = require('objection');
const snakePlugin = require('./plugins/snake');
const softDeletePlugin = require('./plugins/softDelete');
const autoDatePlugin = require('./plugins/autoDate');
const aclFilter = require('./plugins/aclFilter');

const { Model, compose } = objection;
const mixins = compose(
	aclFilter,
	autoDatePlugin,
	snakePlugin,
	softDeletePlugin,
);

class BaseModel extends mixins(Model) {
	static includePaginationAndSort(query, filter) {
		let newQuery = query;
		if (filter.page) {
			newQuery = query.page(filter.page - 1, filter.limit || process.env.OFFSET_DEFAULT);
		}
		if (filter.sortField) {
			newQuery = query.orderBy(filter.sortField, filter.sortDirection || 'desc');
		}
		return newQuery;
	}

	static includeFilterEager(query, eagers = [], columns = 'selectColumns') {
		let newQuery = query;
		if (eagers && eagers.length > 0) {
			eagers.forEach((eager) => {
				newQuery = query.eager(`${eager}(${columns})`);
			});
		}
		return newQuery;
	}
}

module.exports = BaseModel;
