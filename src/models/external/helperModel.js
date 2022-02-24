'use strict';

const { localDate } = require('../helper');

function getWhereInString(ids = []) {
	return ids.reduce((a, e, i) => {
		let aux = a;
		if (i === 0) {
			aux = `(${e}`;
			if (ids.length - 1 === 0) {
				aux = `${aux})`;
			}
		} else if (i === ids.length - 1) {
			aux = `${a})`;
		} else {
			aux = `${a}, ${e}`;
		}
		return aux;
	}, '');
}

function getWhereAndWhere(details = []) {
	return details.reduce((a, e, i) => {
		let aux = a;
		if (i === 0) {
			aux = `((wp.product_id = ${e.warProductsId} and wp.warehouse_id = ${e.warWarehousesId ||
				null} and wp.brand_id = ${e.brandId})`;
			if (details.length - 1 === 0) {
				aux = `${aux})`;
			}
		} else if (i === details.length - 1) {
			aux = `${a})`;
		} else {
			aux = `${a} or (wp.product_id = ${
				e.warProductsId
			} and wp.warehouse_id = ${e.warWarehousesId || null} and wp.brand_id = ${e.brandId})`;
		}
		return aux;
	}, '');
}

function withoutCamelCase(word) {
	let splitWord = word.split('');
	splitWord = splitWord.map((i) => {
		const newLyrics = i === i.toUpperCase() ? `_${i.toLowerCase()}` : i;
		return newLyrics;
	});
	return splitWord.join('');
}

function withCamelCase(word) {
	let splitWord = word.split('');
	let nextLyrics;
	splitWord = splitWord.map((i, idx) => {
		let newLyrics = i;
		if (i === '_') {
			nextLyrics = idx + 1;
			newLyrics = '';
		} else if (nextLyrics === idx) {
			newLyrics = i.toUpperCase();
			nextLyrics = undefined;
		}
		return newLyrics;
	});
	return splitWord.join('');
}

function getColumnsSet(data, alias) {
	const columns = Object.keys(data);
	return columns.reduce((a, e, i) => {
		const newA =
			columns.length === i + 1
				? a.concat(`${alias}.${withoutCamelCase(e)} = ?`)
				: a.concat(`${alias}.${withoutCamelCase(e)} = ?, `);
		return newA;
	}, '');
}

function getColumns(data = {}, values = false) {
	const columns = Object.keys(data);
	return columns.reduce((a, e, i) => {
		let newA;
		if (!values) {
			newA =
				columns.length === i + 1
					? a.concat(`${withoutCamelCase(e)}`)
					: a.concat(`${withoutCamelCase(e)}, `);
		} else {
			newA = columns.length === i + 1 ? a.concat('?') : a.concat('?, ');
		}
		return newA;
	}, '');
}

function formatColumns(data = {}) {
	const newData = { ...data };
	const columns = Object.keys(data);
	columns.forEach((e) => {
		const newKey = withCamelCase(e);
		newData[newKey] = newData[e];
		if (e !== newKey) {
			delete newData[e];
		}
	});
	return newData;
}

function nullableValues(values = []) {
	const newValues = values.map((i) => {
		let newI = i === undefined ? null : i;
		newI = typeof i === 'object' ? JSON.stringify(i) : newI;
		if (typeof newI === 'string' && newI.indexOf('.000Z') > 0) {
			newI = localDate(JSON.parse(newI), undefined, 'Africa/Dakar');
		}
		return newI;
	});
	return newValues;
}

function getQueryInsert(bdName, tableName, registers = []) {
	const queryString = `insert into ${bdName}.${tableName} (${getColumns(registers[0])}) values `;
	const values = getColumns(registers[0], true);
	return registers.reduce(
		(a, e, i) => {
			const { queryString: auxA, queryValues: auxQueryValues } = a;
			const newA =
				registers.length === i + 1 ? auxA.concat(`(${values})`) : auxA.concat(`(${values}), `);
			const newQueryValues = auxQueryValues.concat(Object.values(e));
			return { queryString: newA, queryValues: newQueryValues };
		},
		{ queryString, queryValues: [] },
	);
}

module.exports = {
	getWhereInString,
	getWhereAndWhere,
	withoutCamelCase,
	getColumnsSet,
	getColumns,
	getQueryInsert,
	withCamelCase,
	formatColumns,
	nullableValues,
};
