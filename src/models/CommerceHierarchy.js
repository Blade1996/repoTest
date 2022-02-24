'use strict';

const baseModel = require('./base');
const helper = require('./helper');

class CommerceHierarchy extends baseModel {
	static get tableName() {
		return 'ms_commerces_hierarchy';
	}

	static get jsonSchema() {
		const defaultProperties = helper.defaultFields();
		const schema = {
			type: 'object',
			required: ['commerceFatherId', 'commerceChildId'],
			properties: {
				commerceFatherId: {
					type: 'integer',
				},
				commerceChildId: {
					type: 'integer',
				},
				additionalInformation: {
					type: ['object', 'null'],
				},
				...defaultProperties,
			},
		};
		return schema;
	}

	static get namedFilters() {
		return {
			selectColumns: builder => builder.select(this.defaultColumns()),
		};
	}

	static defaultColumns() {
		return ['commerce_father_id', 'commerce_child_id', 'additional_information'];
	}

	static getAll() {
		return this.query().select(this.defaultColumns());
	}

	static createMultiple(data) {
		return this.query().insertGraph(data);
	}
}

module.exports = CommerceHierarchy;
