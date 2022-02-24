'use strict';

const orderDeliveryStates = {
	notAssigned: 'NOT_ASSIGNED',
	accepted: 'ACCEPTED',
	inPlaceOrigin: 'IN_PLACE_ORIGIN',
	inRoadDelivery: 'IN_ROAD_DELIVERY',
	inPlaceDestiny: 'IN_PLACE_DESTINY',
	backToOrigin: 'BACK_TO_ORIGIN',
	givenDelivery: 'GIVEN_DELIVERY',
};

module.exports = orderDeliveryStates;
