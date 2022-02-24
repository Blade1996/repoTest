'use strict';

function report(titleReport, entityName, entityKey, info) {
	const objectInfo = info[0];
	const infoKeys = Object.keys(objectInfo);
	const fieldsObject = {};

	infoKeys.forEach((element) => {
		const elementValue = objectInfo[element];
		let typeName = typeof elementValue;
		if (typeName === 'number') {
			if (elementValue % 2 === 0) {
				typeName = 'int';
			}
			typeName = 'double';
		}
		fieldsObject[element] = typeName;
	});

	const dataRecords = {};
	info.forEach((item) => {
		const newItem = item;
		const keyName = newItem[entityKey];
		delete newItem[entityKey];
		dataRecords[keyName] = newItem;
	});

	const dataReport = [
		{
			title: titleReport,
			graph_type: 'graph1',
			data: {
				mapper: {
					entity_name: entityName,
					main: entityKey,
					fields: fieldsObject,
				},

				data: dataRecords,
			},
		},
	];

	return dataReport;
}

module.exports = { report };
