'use strict';

const objection = require('objection');
const Knex = require('knex');
const knexConfig = require('./../../knexfile');

let knex = null;

function initConnection() {
	knex = Knex(knexConfig);
	objection.Model.knex(knex);
}

function closeConnection(next, close = true) {
	if (close) {
		knex.destroy();
	}
	next();
}

const methods = {
	initConnection,
	closeConnection,
};

module.exports = methods;
