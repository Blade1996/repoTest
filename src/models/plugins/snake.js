'use strict';

const camelCase = require('lodash/camelCase');
const mapKeys = require('lodash/mapKeys');
const snakeCase = require('lodash/snakeCase');

function snakePlugin(Model) {
	const snakeClass = class extends Model {
		$formatDatabaseJson(json) {
			let newJson = json;
			newJson = super.$formatDatabaseJson(newJson);
			return mapKeys(newJson, (value, key) => snakeCase(key));
		}

		$parseDatabaseJson(json) {
			let newJson = json;
			newJson = mapKeys(newJson, (value, key) => camelCase(key));
			return super.$parseDatabaseJson(newJson);
		}
	};

	return snakeClass;
}

module.exports = snakePlugin;
