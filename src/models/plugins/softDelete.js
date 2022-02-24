'use strict';

function softDelete(Model) {
	class SessionQueryBuilder extends Model.QueryBuilder {
		constructor(modelClass) {
			super(modelClass);
			this.onBuild((builder) => {
				if (!builder.context().withArchived) {
					builder.whereNull(`${modelClass.tableName}.deleted_at`);
				}
			});
		}

		withArchived(withArchived) {
			this.context().withArchived = withArchived;
			return this;
		}

		softDelete() {
			return this.patch({ updatedAt: new Date(), deletedAt: new Date() });
		}
	}

	const softDeleteClass = class extends Model {
		static get QueryBuilder() {
			return SessionQueryBuilder;
		}
	};

	return softDeleteClass;
}

module.exports = softDelete;
