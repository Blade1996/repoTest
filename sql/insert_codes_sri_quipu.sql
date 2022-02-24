insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 5 from sritabla where cod_lon = 0 and `tabla_sri` = 'TABLA3.1';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 6 from sritabla where cod_lon = 0 and `tabla_sri` = 'TABLA3.2';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 7 from sritabla where cod_lon = 0 and `tabla_sri` = 'TABLA6';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 8 from sritabla where cod_lon = 0 and `tabla_sri` = 'TABLA3.V';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 9 from sritabla where cod_lon = 0 and `tabla_sri` = 'TABLA3.C';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 10 from sritabla where cod_lon = 0 and `tabla_sri` = 'F104V_SI';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 11 from sritabla where cod_lon = 0 and `tabla_sri` = 'F104V_CI';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 12 from sritabla where cod_lon = 0 and `tabla_sri` = 'F104C_SI';

insert into ms_catalog_sunat_details (code, description, value, percentage, activity, account, account_vta, catalog_sunat_id) 
select cod_sri, des_sri, unico, por_sri, act_sri, codcta, codcta_vta, 13 from sritabla where cod_lon = 0 and `tabla_sri` = 'F104C_CI';

INSERT INTO `ms_catalog_sunat` (`code`, `description`, `value`, `catalog`, `type_catalog`, `additional_information`, `number`, `type`, `country_id`) VALUES
('TABLA 16',	'CODIGOS DE IMPUESTOS - VENTA',	'TABLA 16',	'TABLA 16',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA 17',	'TARIFA DEL IVA',	'TABLA 17',	'TABLA 17',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA 19',	'CODIGOS DE IMPUESTOS - COMPRA',	'TABLA 19',	'TABLA 19',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA 20',	'RETENCIÓN DEL IVA',	'TABLA 20',	'TABLA 20',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA 20.1',	'RETENCIÓN DE ISD',	'TABLA 20.1',	'TABLA 20.1',	NULL,	NULL,	NULL,	NULL,	2);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('2',	'IVA',	'2',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_16),
('3',	'ICE',	'3',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_16),
('5',	'IRBPNR',	'5',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_16),
('0',	'TARIFA IVA 0%',	'0',	NULL,	0.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_17),
('2',	'TARIFA IVA 12%',	'2',	NULL,	12.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_17),
('3',	'TARIFA IVA 14%',	'3',	NULL,	14.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_17),
('6',	'No Objeto de\r\nImpuesto',	'6',	NULL,	0.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_17),
('7',	'Exento de IVA',	'7',	NULL,	0.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_17),
('2',	'IVA',	'2',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_19),
('1',	'RENTA',	'1',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_19),
('6',	'ISD',	'6',	NULL,	NULL,	NULL,	NULL,	NULL,	NEW_ID_TABLA_19),
('9',	'RETENCIÓN IVA 10%',	'9',	NULL,	10.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('10',	'RETENCIÓN IVA 20%',	'10',	NULL,	20.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('1',	'RETENCIÓN IVA 30%',	'1',	NULL,	30.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('11',	'RETENCIÓN IVA 50%',	'11',	NULL,	50.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('2',	'RETENCIÓN IVA 70%',	'2',	NULL,	70.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('3',	'RETENCIÓN IVA 100%',	'3',	NULL,	100.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('7',	'RETENCIÓN EN 0%',	'7',	NULL,	0.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('8',	'NO PROCEDE RETENCIÓN',	'8',	NULL,	0.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20),
('4580',	'RETENCIÓN DE ISD 5%',	'4580',	NULL,	5.00,	NULL,	NULL,	NULL,	NEW_ID_TABLA_20.1);