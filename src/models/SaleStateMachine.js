'use strict';

const StateMachine = require('javascript-state-machine');
const SalesStates = require('./SalesStates');

const stateCodes = {
	canceled: 'ANU',
	finished: 'FIN',
	init: 'INI',
	pending: 'PXEN',
	anuSunat: 'ANUSUNAT',
};

const stateIds = {
	canceled: 3,
	finished: 4,
	init: 1,
	pending: 2,
	anuSunat: 5,
};

async function onCreateEvent() {
	const statusData = await SalesStates.query()
		.select('id', 'code')
		.where('code', stateCodes.finished)
		.first();
	this.stateId = statusData.id;
}

async function onCancelEvent() {
	const statusData = await SalesStates.query()
		.select('id', 'code')
		.where('code', stateCodes.canceled)
		.first();
	this.stateId = statusData.id;
}

function createStateMachine(state, saleData, initialState) {
	const newState = Object.assign({}, state);
	newState.init = initialState;
	newState.methods = {
		onCreate: onCreateEvent,
		onCancel: onCancelEvent,
	};
	newState.data = {
		saleData,
		stateId: null,
	};
	const sm = new StateMachine(newState);
	return sm;
}

function createSale(data, item, typeDocumentCode, initialState = 'pending') {
	const sm = createStateMachine(item.dataState[typeDocumentCode], data, initialState);
	return sm;
}

const methods = {
	createSale,
	stateCodes,
	stateIds,
};

module.exports = methods;
