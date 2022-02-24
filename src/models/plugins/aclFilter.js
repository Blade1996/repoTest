'use strict';

function aclFilter(Model) {
	class AclFilterQueryBuilder extends Model.QueryBuilder {
		aclFilter(fields, tableName) {
			if (fields) {
				const keys = Object.keys(fields);
				keys.forEach((item) => {
					const { values, fieldName, tableName: tableNameItem } = fields[item];
					if (values) {
						if (values.length > 0) {
							const tableNameAux = tableNameItem || tableName;
							const fieldNameAux = tableNameAux ? `${tableNameAux}.${fieldName}` : fieldName;
							this.whereIn(fieldNameAux, values);
						}
					}
				});
			}
			return this;
		}
	}

	const aclFilterClass = class extends Model {
		static get QueryBuilder() {
			return AclFilterQueryBuilder;
		}
	};

	return aclFilterClass;
}

module.exports = aclFilter;
