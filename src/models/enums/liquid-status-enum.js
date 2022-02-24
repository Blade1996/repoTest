'use strict';

const liquidStatus = {
	NO_LIQUID: {
		id: 1,
		colorCode: 'red accent-4',
		colorApp: '#E7281F',
		name: 'No Liquidado',
	},
	IN_PROCESS: {
		id: 2,
		colorCode: 'yellow accent-4',
		colorApp: '#FFF333',
		name: 'En Proceso',
	},
	LIQUIDATED: {
		id: 3,
		colorCode: 'green accent-4',
		colorApp: '#29DA18',
		name: 'Liquidado',
	},
};

module.exports = liquidStatus;
