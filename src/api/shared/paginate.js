'use strict';

function success(data, query) {
	let result = data;
	let lastPage = 0;
	let totalRecords = 0;
	if (query.page) {
		totalRecords = data.total;
		result = data.results;
		lastPage = Math.ceil(data.total / (query.limit || process.env.OFFSET_DEFAULT));
	}
	return this.response(result)
		.header('x-quantity', totalRecords)
		.header('x-last-page', lastPage);
}

function register(server) {
	server.decorate('toolkit', 'paginate', success);
}

const plugin = {
	name: 'paginate',
	register,
	version: '1.0.0',
};

module.exports = plugin;
