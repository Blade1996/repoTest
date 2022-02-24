'use strict';

const parser = require('fast-xml-parser');
// const he = require('he');

function fastXmlParser(xmlData) {
	const options = {
		attributeNamePrefix: '@_',
		attrNodeName: 'attr',
		textNodeName: '#text',
		ignoreAttributes: true,
		ignoreNameSpace: false,
		allowBooleanAttributes: false,
		parseNodeValue: true,
		parseAttributeValue: false,
		trimValues: true,
		cdataTagName: '__cdata',
		cdataPositionChar: '\\c',
		localeRange: '',
		parseTrueNumberOnly: false,
		arrayMode: false,
		// attrValueProcessor: (val, attrName) => he.decode(val, { isAttributeValue: true }),
		// tagValueProcessor: (val, tagName) => he.decode(val),
		stopNodes: ['parse-me-as-string'],
	};

	if (parser.validate(xmlData) === true) {
		return parser.parse(xmlData, options);
	}

	const tObj = parser.getTraversalObj(xmlData, options);
	return parser.convertToJson(tObj, options);
}

function structureDocument(data) {
	const typeDocument = {
		factura: 1,
		comprobanteRetencion: 7,
		notaCredito: 4,
	};
	let details;
	let typeDocumentCode;
	let taxes;
	let additionalInformation = {};
	let infoDocument = {};
	let amount = 0;
	let currency;
	let description = '';
	const document = Object.keys(data);
	if (data[document[0]].infoTributaria.codDoc === typeDocument.factura) {
		typeDocumentCode = 'FAC';
		currency = data[document[0]].infoFactura.moneda === 'DOLAR' ? 'USD' : 'PEN';
		amount = data[document[0]].infoFactura.importeTotal;
		infoDocument = data[document[0]].infoFactura;
		details = !Array.isArray(data[document[0]].detalles.detalle)
			? [data[document[0]].detalles.detalle]
			: data[document[0]].detalles.detalle;
	} else if (data[document[0]].infoTributaria.codDoc === typeDocument.comprobanteRetencion) {
		typeDocumentCode = 'CRT';
		infoDocument = data[document[0]].infoCompRetencion;
		taxes = !Array.isArray(data[document[0]].impuestos.impuesto)
			? [data[document[0]].impuestos.impuesto]
			: data[document[0]].impuestos.impuesto;
	} else if (data[document[0]].infoTributaria.codDoc === typeDocument.notaCredito) {
		typeDocumentCode = 'NTC';
		infoDocument = data[document[0]].infoNotaCredito;
		details = !Array.isArray(data[document[0]].detalles.detalle)
			? [data[document[0]].detalles.detalle]
			: data[document[0]].detalles.detalle;
	}
	additionalInformation = data[document[0]].infoTributaria;
	additionalInformation.infoDocument = infoDocument;
	description = null;
	const documentInfo = {
		amount,
		currency,
		description,
		typeDocumentCode,
		details,
		taxes,
		infoDocument,
		additionalInformation,
	};
	return documentInfo;
}

function newNumberEcu(number) {
	let newN = number;
	if (newN.length < 9) {
		while (newN.length < 9) {
			newN = `0${newN}`;
		}
	}
	return newN;
}

function generatePasswordEcu({
	dateDocument,
	typeDocumentCode,
	ruc,
	typeEnvironment,
	serie,
	documentNumber,
	codeNumber = '00000001',
	typeEmission,
}) {
	let code2 = '';
	let pivote = 2;
	let totalQuantity = 0;
	let temporal = 0;
	const code = `${dateDocument}${typeDocumentCode}${ruc}${typeEnvironment}${serie}${documentNumber}${codeNumber}${typeEmission}`;

	code2 = code
		.split('')
		.reverse()
		.join('');

	for (let i = 1; i <= code2.length; i += 1) {
		temporal = code2.slice(i - 1, i) * pivote;
		pivote = pivote === 7 ? 2 : pivote + 1;
		totalQuantity += temporal;
	}
	totalQuantity = 11 - (totalQuantity % 11);
	let checkDigit = '';
	if (totalQuantity === 11) {
		checkDigit = '0';
	} else if (totalQuantity === 10) {
		checkDigit = '1';
	} else {
		checkDigit = totalQuantity;
	}
	return `${code}${checkDigit}`;
}

function validDocumentAnnex(item) {
	const linebuffer = item.toString().split('\t');
	if (
		linebuffer &&
		linebuffer.length > 8 &&
		linebuffer[9] &&
		linebuffer[9].length > 36 &&
		linebuffer[8].length > 12
	) {
		const taxesJson = {
			voucher: linebuffer[0],
			typeEmission: linebuffer[6],
			additionalFields: {
				emissionDate: linebuffer[4],
				authorizationDate: linebuffer[5],
				serie: linebuffer[1],
				secretCode: linebuffer[9],
			},
			id: `${linebuffer[0].substring(0, 5)}${linebuffer[1].replace(/-/gi, '')}`,
			secret: linebuffer[8],
			taxInfo: {
				name: linebuffer[3],
				ruc: linebuffer[2],
				idRuc: linebuffer[7],
			},
		};
		return taxesJson;
	}
	return null;
}

const methods = {
	newNumberEcu,
	fastXmlParser,
	structureDocument,
	validDocumentAnnex,
	generatePasswordEcu,
};

module.exports = methods;
