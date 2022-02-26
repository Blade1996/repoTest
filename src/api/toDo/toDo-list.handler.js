'use strict';

const Boom = require('boom');
const ToDo = require('../../models/ToDo');

async function handler() {
	try {
		const toDoList = await ToDo.getAll();
		return toDoList;
	} catch (error) {
		return Boom.badRequest(error, error);
	}
}

module.exports = handler;
