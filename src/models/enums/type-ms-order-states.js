'use strict';

const orderStatesMethods = {
	requested: 'REQUESTED',
	confirmed: 'CONFIRMED',
	inRoad: 'IN_ROAD',
	readyToDeliver: 'READY_TO_DELIVER',
	given: 'GIVEN',
	canceled: 'CANCELED',
	assigned: 'ASSIGNED',
};

module.exports = orderStatesMethods;
