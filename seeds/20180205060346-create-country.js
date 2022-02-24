'use strict';

exports.seed = function (knex, Promise) {
	return knex('com_country')
		.del()
		.then(() =>
			knex('com_country').insert([
				{ id: 1, name: 'Peru', currency: 'PEN', country_code: 'PER', tax_name: 'IGV', products_taxes: '{"default":{"codeTable":"TABLA17","name":"IGV","code":"01","codePercentage":"01"}}', config_taxes: '{"countryCodeISO3166": "PE", "FACT":{"RA":[{"code":"BOL","term":72,"format":"hours","flagInformed":false,"dateValid":{"informed":"authorizationDate","notInformed":"createAt"}},{"code":"FAC","term":72,"format":"hours","flagInformed":true,"dateValid":{"informed":"authorizationDate"}}]},"ICBPER":[{"year":"2019","amount":0.1,"default":false},{"year":"2020","amount":0.2,"default":false},{"year":"2021","amount":0.3,"default":false},{"year":"2022","amount":0.4,"default":false},{"year":"2023","amount":0.5,"default":true}],   "digitCorrelativeSale": 8}'},
				{ id: 2, name: 'Ecuador', currency: 'USD', country_code: 'ECU', tax_name: 'IVA', products_taxes: '{"default": {"code": "2", "name": "IVA", "codeTable": "TABLA17", "codePercentage": "2"}}', config_taxes: '{"countryCodeISO3166": "EC", "FACT":{"ANU":[{"code":"NTC","term":720,"format":"hours","dateValid":{"informed":"date_notification"},"flagInformed":true},{"code":"FAC","term":720,"format":"hours","dateValid":{"informed":"date_notification"},"flagInformed":true}]},"digitCorrelativeSale":9}'},
				{ id: 3, name: 'Colombia', currency: 'COP', country_code: 'COL', tax_name: 'IVA', products_taxes: '{"default": {"code": "2", "name": "IVA", "codeTable": "TABLA17", "codePercentage": "2"}}', config_taxes: '{"countryCodeISO3166": "EC", "digitCorrelativeSale": 9}'}
			]));
};