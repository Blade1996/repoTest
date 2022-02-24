
INSERT INTO `ms_catalog_sunat` (`code`, `description`, `value`, `catalog`, `type_catalog`, `additional_information`, `number`, `type`, `country_id`) VALUES
('TABLA16',	'CODIGOS DE IMPUESTOS - VENTA',	'TABLA 16',	'TABLA 16',	NULL,	NULL,	NULL,	NULL,	1),
('TABLA17',	'TARIFA DEL IVA',	'TABLA 17',	'TABLA 17',	162,	NULL,	NULL,	NULL,	1);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('01',	'IGV IMPUESTO GENERAL A LAS VENTAS',	'01',	1,	NULL,	NULL,	NULL,	NULL,	NULL,	6),
('04',	'EXPORTACIÓN',	'04',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	6),
('05',	'GRATUITO',	'05',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	6),
('02',	'EXONERADO',	'02',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	6),
('03',	'INAFECTO',	'03',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	6);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('01',	'IGV IMPUESTO GENERAL A LAS VENTAS',	'01',	1,	NULL,	18,	NULL,	NULL,	NULL,	7),
('04',	'EXPORTACIÓN',	'04',	NULL,	NULL,	0,	NULL,	NULL,	NULL,	7),
('05',	'GRATUITO',	'05',	NULL,	NULL,	0,	NULL,	NULL,	NULL,	7),
('02',	'EXONERADO',	'02',	NULL,	NULL,	0,	NULL,	NULL,	NULL,	7),
('03',	'INAFECTO',	'03',	NULL,	NULL,	0,	NULL,	NULL,	NULL,	7);

INSERT INTO `ms_catalog_sunat` (`code`, `description`, `value`, `catalog`, `type_catalog`, `additional_information`, `number`, `type`, `country_id`) VALUES
('_3GO0ZS6RV',	'Tipo de Identificación',	'REOC',	'TABLA3.1',	2,	NULL,	1,	'N',	2),
('TABLA3.2',	'Tipos de códigos que identifican diferentes tipos de retenciones',	'REOC',	'TABLA3.2 _3GO0ZS6RZ',	2,	NULL,	3,	'C',	2),
('_3GO0ZS6S0',	'Porcentaje de Retención de IVA',	'IVA',	'TABLA6',	2,	NULL,	1,	'N',	2),
('_3GO0ZS6S1',	'Resumen de Ventas y Otras Operaciones del periodo que declara',	'REOC',	'TABLA3.V',	2,	NULL,	3,	'C',	2),
('_3GO0ZS6S4',	'Resumen de Ventas y Otras Operaciones del periodo que declara',	'REOC',	'TABLA3.C',	2,	NULL,	4,	'C',	2),
('_3GO0ZS6US',	'Resumen de Ventas (Sin IVA) y Otras Operaciones del Periodo que declara',	'REOC',	'F104V_SI',	2,	NULL,	5,	'C',	2),
('_3GO0ZS6UT',	'Resumen de Ventas (Con IVA) y Otras Operaciones del Periodo que declara',	'REOC',	'F104V_CI',	2,	NULL,	6,	'C',	2),
('_3GO0ZS6UU',	'Resumen de Compras (Sin IVA) y otras operaciones del periodo que declara',	'REOC',	'F104C_SI',	2,	NULL,	7,	'C',	2),
('_3GO0ZS6UV',	'Resumen de Compras (Con IVA) y otras operaciones del periodo que declara',	'REOC',	'F104C_CI',	2,	NULL,	8,	'C',	2),
('TABLA16',	'CODIGOS DE IMPUESTOS - VENTA',	'TABLA 16',	'TABLA 16',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA17',	'TARIFA DEL IVA',	'TABLA 17',	'TABLA 17',	147,	NULL,	NULL,	NULL,	2),
('TABLA19',	'CODIGOS DE IMPUESTOS - COMPRA',	'TABLA 19',	'TABLA 19',	NULL,	NULL,	NULL,	NULL,	2),
('TABLA20',	'RETENCIÓN DEL IVA',	'TABLA 20',	'TABLA 20',	149,	NULL,	NULL,	NULL,	2),
('TABLA20.1',	'RETENCIÓN DE ISD',	'TABLA 20.1',	'TABLA 20.1',	149,	NULL,	NULL,	NULL,	2),
('TABLA18',	'TARIFA DEL ICE',	'TABLA 18',	'TABLA 18',	147,	NULL,	NULL,	NULL,	2);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('1',	'R.U.C',	'_3GO0ZS6RW',	NULL,	NULL,	0.00,	1,	'',	'',	8),
('2',	'Cédula',	'_3GO0ZS6RX',	NULL,	NULL,	0.00,	1,	'',	'',	8),
('3',	'Pasaporte',	'_3GO0ZS6RY',	NULL,	NULL,	0.00,	1,	'',	'',	8);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('303',	'Honorarios, comisiones y dietas a personas naturales',	'_3GO0ZS6S6',	NULL,	NULL,	10.00,	1,	'1.1.2.5.03',	'2.1.2.1.12',	9),
('304',	'Servicios /  Predomina el intelecto',	'_3GO0ZS6S7',	NULL,	NULL,	8.00,	1,	'1.1.2.5.01',	'2.1.2.1.23',	9),
('305',	'Honorarios a extranjeros por servicios ocasionales',	'_3GO0ZS6S8',	NULL,	NULL,	25.00,	0,	'',	'2.1.2.1.12',	9),
('306',	'Por compras locales de materia prima',	'_3GO0ZS6S9',	NULL,	NULL,	1.00,	0,	'',	'2.1.2.1.01',	9),
('307',	'Servicios / Predomian mano de obra',	'_3GO0ZS6SA',	NULL,	NULL,	2.00,	1,	'1.1.2.5.01',	'2.1.2.1.09',	9),
('308',	'Servicios / Entre sociedades',	'_3GO0ZS6SB',	NULL,	NULL,	2.00,	0,	'',	'2.1.2.1.09',	9),
('309',	'Servicios / Publicidad y comunicación',	'_3GO0ZS6SC',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.07',	9),
('310',	'Servicios / Transporte privado de pasajeros o servicio público',	'_3GO0ZS6SD',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.06',	9),
('311',	'Por pagos a través de liquidacion de compra',	'_3GO0ZS6SE',	NULL,	NULL,	2.00,	1,	'1.1.2.5.01',	'2.1.2.1.22',	9),
('312',	'Transferencia de bienes muebles de naturaleza corporal',	'_3GO0ZS6SF',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.01',	9),
('313',	'Por concepto de servicio de transporte privado de pasajeros o servicio publico o privado de carga',	'_3GO0ZS6SG',	NULL,	NULL,	1.00,	0,	'1.1.2.5.01',	'2.1.2.1.06',	9),
('314',	'Por regalias, derechos de autor, marcas, patentes y similares',	'_3GO0ZS6SH',	NULL,	NULL,	8.00,	0,	'',	'',	9),
('315',	'Por remuneraciones a deportistas, entrenadores, cuerpo tecnico, arbitros y artistas residentes',	'_3GO0ZS6SI',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('316',	'Por pagos realizados a notarios y registradores de la propiedad o mercantiles',	'_3GO0ZS6SJ',	NULL,	NULL,	8.00,	1,	'1.1.2.5.03',	'2.1.2.1.12',	9),
('317',	'Por comisiones pagadas a sociedades',	'_3GO0ZS6SK',	NULL,	NULL,	1.00,	0,	'',	'2.1.2.1.01',	9),
('318',	'Por promocion y publicidad',	'_3GO0ZS6SL',	NULL,	NULL,	1.00,	0,	'1.1.2.5.01',	'2.1.2.1.07',	9),
('319',	'Por arrendamiento mercantil local',	'_3GO0ZS6SM',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.01',	9),
('320',	'Por arrendamiento de bienes inmuebles de propiedad de personas naturales',	'_3GO0ZS6SN',	NULL,	NULL,	8.00,	1,	'1.1.2.5.03',	'2.1.2.1.11',	9),
('321',	'Por arrendamiento de bienes inmuebles a sociedades',	'_3GO0ZS6SO',	NULL,	NULL,	5.00,	0,	'1.1.2.5.02',	'2.1.2.1.11',	9),
('322',	'Por seguros y reaseguros (primas y cesiones)',	'_3GO0ZS6SP',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.08',	9),
('323a',	'Rendimientos Financieros',	'_3GO0ZS6SQ',	NULL,	NULL,	2.00,	0,	'',	'2.1.2.1.13',	9),
('323b',	'Por rendimientos financieros: depósitos en cuentas corrientes',	'_3GO0ZS6SR',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323c',	'Por rendimientos financieros:  depósitos en cuentas de ahorros',	'_3GO0ZS6SS',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323d',	'Por rendimientos financieros:  depósitos en cuentas corrientes exentas',	'_3GO0ZS6ST',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323e',	'Por rendimientos financieros: compra, cancelaci¢n o redenci¢n de mini bemïs y bemïs',	'_3GO0ZS6SU',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323f',	'Por rendimientos financieros: depósitos a plazo',	'_3GO0ZS6SV',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323g',	'Por rendimientos financieros: operaciones de reporto - repos',	'_3GO0ZS6SW',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323h',	'Por rendimientos financieros: inversiones (captaciones)',	'_3GO0ZS6SX',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323i',	'Por rendimientos financieros: obligaciones',	'_3GO0ZS6SY',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323j',	'Por rendimientos financieros: bonos convertibles en acciones',	'_3GO0ZS6SZ',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('323k',	'Por rendimientos financieros: bonos de organismos y gobiernos extranjeros',	'_3GO0ZS6T0',	NULL,	NULL,	5.00,	0,	'',	'',	9),
('324',	'Por pagos o creditos en cuenta realizados por empresas emisoras de tarjetas de credito',	'_3GO0ZS6T1',	NULL,	NULL,	1.00,	0,	'',	'',	9),
('325',	'Por loterias, rifas, apuestas y similares',	'_3GO0ZS6T2',	NULL,	NULL,	15.00,	0,	'',	'',	9),
('326',	'Por intereses y comisiones en operaciones de credito entre las inst. Del sistema financiero',	'_3GO0ZS6T3',	NULL,	NULL,	1.00,	0,	'',	'',	9),
('327',	'Por venta de combustibles a comercializadoras',	'_3GO0ZS6T4',	NULL,	NULL,	0.20,	0,	'',	'',	9),
('328',	'Por venta de combustibles a distribuidores',	'_3GO0ZS6T5',	NULL,	NULL,	0.30,	0,	'',	'',	9),
('329',	'Por otros servicios',	'_3GO0ZS6T6',	NULL,	NULL,	2.00,	0,	'1.1.2.5.01',	'2.1.2.1.09',	9),
('330',	'Por pagos de dividendos anticipados',	'_3GO0ZS6T7',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('331',	'Por agua, energ¡a, luz y telecomunicaciones',	'_3GO0ZS6T8',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.10',	9),
('332',	'Otras compras de bienes y servicios no sujetas a retenci¢n',	'_3GO0ZS6T9',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('401',	'Con convenio de doble tributacion',	'_3GO0ZS6TA',	NULL,	NULL,	0.00,	0,	'',	'',	9),
('403',	'Sin convenio de doble tributación intereses y costos financideros por financiamiento de proveedores',	'_3GO0ZS6TB',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('405',	'Sin convenio de doble tributación intereses de créditos externos registrados en el bce (en la cuanti',	'_3GO0ZS6TC',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('407',	'Sin convenio de doble tributación intereses de créditos externos no registrados en el bce',	'_3GO0ZS6TD',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('409',	'Sin convenio de doble tributación comisiones por exportaciones',	'_3GO0ZS6TE',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('411',	'Sin convenio de doble tributación comisiones pagadas para la promocion del turismo receptivo',	'_3GO0ZS6TF',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('413',	'Sin convenio de doble tributación el 4% de las primas de cesi¢n o reaseguros contratados con empresa',	'_3GO0ZS6TG',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('415',	'Sin convenio de doble tributación el 10% de los pagos efectuados por las agencias internacionales de',	'_3GO0ZS6TH',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('417',	'Sin convenio de doble tributación el 10% del valor de los contratos de fletamento de naves para empr',	'_3GO0ZS6TI',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('419',	'Sin convenio de doble tributación el 15% de los pagos efectuados por productoras y distribuidoras de',	'_3GO0ZS6TJ',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('421',	'Sin convenio de doble tributación por otros conceptos',	'_3GO0ZS6TK',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('423',	'Arrendamiento mercantil internacional por pago de intereses (cuando supera la tasa autorizada por el',	'_3GO0ZS6TL',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('425',	'Arrendamiento mercantil internacional cuando no se ejerce la opcion de compra (sobre la depreciaci¢n',	'_3GO0ZS6TM',	NULL,	NULL,	25.00,	0,	'',	'',	9),
('323',	'Por rendimientos financieros',	'_3GO0ZS6UW',	NULL,	NULL,	2.00,	1,	'',	'2.1.2.1.13',	9),
('333',	'Convenio de debito o recaudacion (cnta crr o ahorros)',	'_3GO0ZS6UX',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('334',	'Por Compra con Tarjetas de Credito',	'_3GO0ZS6UY',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('340',	'Otras Retenciones / Aplicables el 1%',	'_3GO0ZS6UZ',	NULL,	NULL,	1.00,	1,	'1.1.2.5.01',	'2.1.2.1.02',	9),
('341',	'Otras Retenciones / Aplicables el 2%',	'_3GO0ZS6V0',	NULL,	NULL,	2.00,	0,	'1.1.2.5.01',	'2.1.2.1.22',	9),
('342',	'Otras Retenciones / Aplicables el 8%',	'_3GO0ZS6V1',	NULL,	NULL,	8.00,	1,	'1.1.2.5.01',	'2.1.2.1.23',	9),
('343',	'Otras Retenciones / Aplicables el 25%',	'_3GO0ZS6V2',	NULL,	NULL,	25.00,	1,	'',	'2.1.2.1.24',	9),
('303A',	'utilizacion aprovechamiento de imagen',	'_48C0I1QQD',	NULL,	NULL,	10.00,	1,	'',	'2.1.2.1.12',	9),
('304A',	'Comision y demas pagos por serv. que pred. intelecto no rel. titulo prof.',	'_48C0I4PUP',	NULL,	NULL,	8.00,	1,	'',	'2.1.2.1.23',	9),
('304B',	'Pagos a notarios y reg. de la propiedad y mercantil',	'_48C0I5PY6',	NULL,	NULL,	8.00,	1,	'',	'2.1.2.1.23',	9),
('304D',	'Pagos a artistas por sus actividades',	'_48C0I6AY9',	NULL,	NULL,	8.00,	1,	'',	'2.1.2.1.23',	9),
('304E',	'Honorarios y demas pagos por Serv. Docencia',	'_48C0I6UYB',	NULL,	NULL,	8.00,	1,	'',	'2.1.2.1.23',	9),
('312A',	'compra de bienes agricola, avicola, pecuario, apicola, cunicula, bioacuatico y forestal',	'_48C0I9S4R',	NULL,	NULL,	1.00,	1,	'',	'2.1.2.1.02',	9),
('323',	'Por rendimientos financieros a P. naturales',	'_48C0IDKK8',	NULL,	NULL,	2.00,	1,	'',	'2.1.2.1.13',	9),
('332A',	'Por enajenacion ocacional de acciones',	'_48C0IGHN7',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('332B',	'Comrpa de Bienes Inmuebles',	'_48C0IGZ4Z',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('334',	'Pago con Tarjeras de Crédito',	'_48C0IN2TO',	NULL,	NULL,	0.00,	1,	'',	'',	9),
('340A',	'Por energía eléctrica',	'_48C0IO6IX',	NULL,	NULL,	1.00,	1,	'',	'2.1.2.1.02',	9),
('340B',	'Activuidades de construccion obra material inmueble',	'_48C0IPNSH',	NULL,	NULL,	1.00,	1,	'',	'2.1.2.1.02',	9),
('344',	'Otras retenciones aplicables 2 por ciento',	'_4FD0I0180',	NULL,	NULL,	2.00,	1,	'1.1.2.5.01',	'2.1.2.1.22',	9);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('3-801',	'801 - 100% IVA POR LA PRESTACION DE SERVICIOS DE PROFESIONALES',	'_3GO0ZS6TN',	NULL,	NULL,	100.00,	0,	'1.1.2.3.03',	'2.1.2.1.16',	10),
('3-803',	'803- 100% IVA POR EL ARRENDAMIENTO DE INMUEBLES A PERSONAS NATURALES',	'_3GO0ZS6TO',	NULL,	NULL,	100.00,	0,	'1.1.2.3.03',	'2.1.2.1.16',	10),
('3-805',	'805 - 100% IVA EN OTRAS COMPRAS DE BIENES Y SERVICIOS CON EMISION DE LIQUIDACION DE COMPRAS Y PRESTA',	'_3GO0ZS6TP',	NULL,	NULL,	100.00,	0,	'1.1.2.3.03',	'2.1.2.1.16',	10),
('3-807',	'807 - 100% IVA EN LA DEPRECIACION DE ACTIVOS EN INTERNACION TEMPORAL',	'_3GO0ZS6TQ',	NULL,	NULL,	100.00,	0,	'1.1.2.3.03',	'2.1.2.1.16',	10),
('3-809',	'809 - 100% IVA EN LA DISTRIBUCION DE COMBUSTIBLES',	'_3GO0ZS6TR',	NULL,	NULL,	100.00,	0,	'',	'',	10),
('3-811',	'811 - 100% IVA EN LEASING INTERNACIONAL',	'_3GO0ZS6TS',	NULL,	NULL,	100.00,	0,	'1.1.2.3.03',	'2.1.2.1.16',	10),
('2-813',	'813 - Iiva por prestacion otros servicios',	'_3GO0ZS6TT',	NULL,	NULL,	70.00,	0,	'1.1.2.3.02',	'2.1.2.1.15',	10),
('2-815',	'815 - 70% IVA RETENIDO POR EMISORAS DE TARJETAS DE CRÉDITO SERVICIOS',	'_3GO0ZS6TU',	NULL,	NULL,	70.00,	0,	'',	'',	10),
('1-817',	'817 - 30% IVA RETENIDO POR EMISORAS DE TARJETAS DE CRÉDITO BIENES',	'_3GO0ZS6TV',	NULL,	NULL,	30.00,	0,	'',	'',	10),
('1-819',	'819 - 30% IVA POR LA COMPRA DE BIENES',	'_3GO0ZS6TW',	NULL,	NULL,	30.00,	0,	'1.1.2.3.01',	'2.1.2.1.14',	10),
('1-821',	'821 - 30% IVA EN CONTRATOS DE CONSTRUCCIÓN',	'_3GO0ZS6TX',	NULL,	NULL,	30.00,	0,	'1.1.2.3.01',	'2.1.2.1.14',	10),
('9',	'721    10 por ciento Retención',	'_3GO0ZS6V3',	NULL,	NULL,	10.00,	1,	'1.1.2.3.01',	'2.1.2.1.27',	10),
('10',	'723    20 por ciento Retención',	'_3GO0ZS6V4',	NULL,	NULL,	20.00,	1,	'',	'2.1.2.1.28',	10),
('1',	'725    30 por ciento Retención',	'_3GO0ZS6V5',	NULL,	NULL,	30.00,	1,	'',	'2.1.2.1.14',	10),
('2',	'727    70 Por ciento Retencion IVA Contr. Especiales',	'_4D912ZWXG',	NULL,	NULL,	70.00,	1,	'',	'2.1.2.1.15',	10),
('3',	'729    100 Por Ciento Retencion IVA Contr, Especiales',	'_4D9132BPL',	NULL,	NULL,	100.00,	1,	'',	'2.1.2.1.16',	10);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('501',	'Ventas Locales Netas (ventas)',	'_3GO0ZS6S2',	NULL,	NULL,	0.00,	1,	'',	'',	11),
('503',	'Pendiente',	'_3GO0ZS6S3',	NULL,	NULL,	0.00,	1,	'',	'',	11);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('531',	'Compras Locales Netas (compras)',	'_3GO0ZS6S5',	NULL,	NULL,	0.00,	1,	'',	'',	12);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('501',	'VENTAS LOCALES NETAS (Excluye Activos Fijos y Otros) (Sin IVA)',	'_3GO0ZS6TY',	NULL,	NULL,	0,	1,	'',	'',	13),
('503',	'VENTAS DIRECTAS A EXPORTADORES (Sin IVA)',	'_3GO0ZS6TZ',	NULL,	NULL,	0.00,	1,	'',	'',	13),
('505',	'VENTAS DE ACTIVOS FIJOS (Sin IVA)',	'_3GO0ZS6U0',	NULL,	NULL,	0.00,	1,	'',	'',	13),
('507',	'OTROS (Donaciones, Promociones, Autoconsumo, etc) (Sin IVA)',	'_3GO0ZS6U1',	NULL,	NULL,	0.00,	1,	'',	'',	13),
('509',	'INGRESO POR CONCEPTO DE REEMBOLSO DE GASTOS (Sin IVA)',	'_3GO0ZS6U2',	NULL,	NULL,	0.00,	1,	'',	'',	13),
('511',	'EXPORTACION DE BIENES (Sin IVA)',	'_3GO0ZS6U3',	NULL,	NULL,	0.00,	1,	'',	'',	13),
('513',	'EXPORTACIONES DE SERVICIOS (Sin IVA)',	'_3GO0ZS6U4',	NULL,	NULL,	0.00,	1,	'',	'',	13);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('531',	'VENTAS LOCALES NETAS (Con IVA)',	'_3GO0ZS6U5',	NULL,	NULL,	0.00,	1,	'',	'',	14),
('533',	'VENTAS DIRECTAS A EXPORTADORES (Con IVA)',	'_3GO0ZS6U6',	NULL,	NULL,	0.00,	1,	'',	'',	14),
('535',	'VENTAS DE ACTIVOS FIJOS (Con IVA)',	'_3GO0ZS6U7',	NULL,	NULL,	0.00,	1,	'',	'',	14),
('537',	'OTROS (Donaciones, Promociones, Autoconsumo, etc) (Con IVA)',	'_3GO0ZS6U8',	NULL,	NULL,	0.00,	1,	'',	'',	14),
('539',	'INGRESO POR CONCEPTO DE REEMBOLSO DE GASTOS (Con IVA)',	'_3GO0ZS6U9',	NULL,	NULL,	0.00,	1,	'',	'',	14);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('601',	'COMPRAS LOCALES NETAS DE BIENES (Excluye Activos Fijos y Otros) (Sin IVA)',	'_3GO0ZS6UA',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('603',	'COMPRAS LOCALES DE SERVICIOS (Sin IVA)',	'_3GO0ZS6UB',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('605',	'COMPRAS LOCALES DE ACTIVOS FIJOS (Sin IVA)',	'_3GO0ZS6UC',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('607',	'PAGO POR CONCEPTO DE REEMBOLSO DE GASTOS (Sin IVA)',	'_3GO0ZS6UD',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('609',	'IMPORTACION DE BIENES (Exclu. Act. Fijos) (Sin IVA)',	'_3GO0ZS6UE',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('611',	'IMPORTACIONES DE SERVICIOS (Sin IVA)',	'_3GO0ZS6UF',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('613',	'IMPORTACIONES DE ACTIVOS FIJOS (Sin IVA)',	'_3GO0ZS6UG',	NULL,	NULL,	0.00,	1,	'',	'',	15),
('619',	'COMPRAS DE BIENES O SERVICIOS CON COMPROBANTES QUE NO SUSTENTAN CREDITO TRIBUTARIO (Sin IVA)',	'_3GO0ZS6UH',	NULL,	NULL,	0.00,	1,	'',	'',	15);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('631',	'COMPRAS LOCALES NETAS DE BIENES (Excluye Activos Fijos y Otros) (Con IVA)',	'_3GO0ZS6UI',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('633',	'COMPRAS LOCALES DE SERVICIOS (Con IVA)',	'_3GO0ZS6UJ',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('635',	'COMPRAS LOCALES DE ACTIVOS FIJOS (Con IVA)',	'_3GO0ZS6UK',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('637',	'PAGO POR CONCEPTO DE REEMBOLSO DE GASTOS (Con IVA)',	'_3GO0ZS6UL',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('639',	'IMPORTACION DE BIENES (Exclu. Act. Fijos) (Con IVA)',	'_3GO0ZS6UM',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('641',	'IMPORTACIONES DE SERVICIOS (Con IVA)',	'_3GO0ZS6UN',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('643',	'IMPORTACIONES DE ACTIVOS FIJOS (Con IVA)',	'_3GO0ZS6UO',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('645',	'IVA EN ARRIENDO MERCANTIL INSTITUCIONAL (Con IVA)',	'_3GO0ZS6UP',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('647',	'IVA EN ARRIENDO MERCANTIL INTERNACIONAL (Con IVA)',	'_3GO0ZS6UQ',	NULL,	NULL,	0.00,	1,	'',	'',	16),
('649',	'COMPRAS DE BIENES O SERVICIOS CON COMPROBANTES QUE NO SUSTENTAN CREDITO TRIBUTARIO (Con IVA)',	'_3GO0ZS6UR',	NULL,	NULL,	0.00,	1,	'',	'',	16);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('2',   'IVA',  '2',    1,  NULL,   NULL,   NULL,   NULL,   NULL,   17),
('3',   'ICE',  '3',    NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   17),
('5',   'IRBPNR',   '5',    NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   17);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('0',   'TARIFA IVA 0%',    '0',    NULL,   NULL,   0.00,   NULL,   NULL,   NULL,   18),
('2',   'TARIFA IVA 12%',   '2',    NULL,   NULL,   12.00,  NULL,   NULL,   NULL,   18),
('6',   'No Objeto de\r\nImpuesto', '6',    NULL,   NULL,   0.00,   NULL,   NULL,   NULL,   18),
('7',   'Exento de IVA',    '7',    NULL,   NULL,   0.00,   NULL,   NULL,   NULL,   18);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('2',   'IVA',  '2',    1,  NULL,   NULL,   NULL,   NULL,   NULL,   19),
('1',   'RENTA',    '1',    NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   19),
('6',   'ISD',  '6',    NULL,   NULL,   NULL,   NULL,   NULL,   NULL,   19);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('9',	'RETENCIÓN IVA 10%',	'9',	NULL,	NULL,	10.00,	NULL,	NULL,	NULL,	20),
('10',	'RETENCIÓN IVA 20%',	'10',	NULL,	NULL,	20.00,	NULL,	NULL,	NULL,	20),
('1',	'RETENCIÓN IVA 30%',	'1',	NULL,	NULL,	30.00,	NULL,	NULL,	NULL,	20),
('11',	'RETENCIÓN IVA 50%',	'11',	NULL,	NULL,	50.00,	NULL,	NULL,	NULL,	20),
('2',	'RETENCIÓN IVA 70%',	'2',	NULL,	NULL,	70.00,	NULL,	NULL,	NULL,	20),
('3',	'RETENCIÓN IVA 100%',	'3',	NULL,	NULL,	100.00,	NULL,	NULL,	NULL,	20),
('7',	'RETENCIÓN EN 0%',	'7',	NULL,	NULL,	0.00,	NULL,	NULL,	NULL,	20),
('8',	'NO PROCEDE RETENCIÓN',	'8',	NULL,	NULL,	0.00,	NULL,	NULL,	NULL,	20);

INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('4580',	'RETENCIÓN DE ISD 5%',	'4580',	NULL,	NULL,	5.00,	NULL,	NULL,	NULL,	21);


INSERT INTO `ms_catalog_sunat_details` (`code`, `description`, `value`, `flag_taxes`, `additional_information`, `percentage`, `activity`, `account_vta`, `account`, `catalog_sunat_id`) VALUES
('3023',	'Productos del tabaco y sucedáneos del tabaco (abarcan los\r\nproductos preparados totalmente o en parte utilizando como\r\nmateria prima hojas de tabaco y destinados a ser fumados,\r\nchupados, inhalados, mascados o utilizados como rapé). 150%',	'3023',	NULL,	NULL,	150.00,	NULL,	NULL,	NULL,	22),
('3610',	'Perfumes y aguas de tocador 20%',	'3610',	NULL,	NULL,	20.00,	NULL,	NULL,	NULL,	22),
('3620',	'Videojuegos 35%',	'3620',	NULL,	NULL,	35.00,	NULL,	NULL,	NULL,	22),
('3630',	'Armas de fuego, armas deportivas y municiones excepto\r\naquellas adquiridas por la fuerza pública',	'3630',	NULL,	NULL,	300.00,	NULL,	NULL,	NULL,	22);


INSERT INTO `com_ms_type_documents` (`com_country_id`, `name`, `flag_type`, `code`, `code_taxes`, `summary_code`, `description`, `qp_code`, `settings`, `include_in_list`) VALUES
(2,	'FACTURA',	1,	'FAC',	'01',	NULL,	'Descripción de Factura',	'F0',	'{\"create\": true, \"generateNtc\": true}',	NULL),
(2,	'FACTURA',	2,	'FAC',	'01',	NULL,	'Descripción de Factura',	'F0',	'{\"create\": true, \"generateNtc\": false}',	NULL),
(2,	'RECIBO DE CAJA',	NULL,	'RC',	NULL,	NULL,	'RECIBO DE CAJA',	NULL,	NULL,	NULL),
(2,	'COMPROBANTE DE RETENCION',	2,	'CRT',	'07',	NULL,	'Descripción de Comprobantes de Retencion',	'F0',	'{\"create\": true, \"generateNtc\": false}',	NULL);

INSERT INTO `com_ms_type_payments` (`country_id`, `name`, `description`, `code`, `code_taxes`, `flag_type`, `flag_form`, `type_transaction_bank_id`, `currency`, `flag_type_transaction`, `summary_code`, `type_payment_id`) VALUES
(2,	'EFECTIVO',	'Pago con dinero en efectivo',	'efectivo',	'01',	1,	1,	NULL,	NULL,	1,	'EFEV',	NULL),
(2,	'VISA',	'Pago con tarjeta de credito VISA',	'visa',	'01',	1,	2,	3,	NULL,	1,	'VISV',	NULL),
(2,	'Mastercard',	'Pago con tarjeta de credito MASTERCARD',	'mastercard',	'01',	1,	2,	3,	NULL,	1,	'MASV',	NULL),
(2,	'American Express',	'Pago con tarjeta de credito AMEX',	'amex',	'01',	1,	2,	3,	NULL,	1,	'AMEV',	NULL),
(2,	'Dinners',	'Pago con tarjeta de credito DINNERS',	'dinners',	'01',	1,	2,	3,	NULL,	1,	'DINV',	NULL),
(2,	'Depósito Bancario',	'Pago con depósito bancario',	'deposito-bancario',	'01',	1,	3,	1,	NULL,	2,	'DBAV',	NULL),
(2,	'Mastercard USD',	'Pago con Mastercard Dolares',	'mastercard-dollars',	'01',	1,	NULL,	NULL,	NULL,	NULL,	'MASU',	NULL),
(2,	'Visa USD',	'Pago con Visa Dolares',	'visa-dollars',	'01',	1,	NULL,	NULL,	NULL,	NULL,	'VISU',	NULL),
(2,	'American Express USD',	'Pago con tarjeta de credito AMEX Dolares',	'amex-dollars',	'01',	1,	NULL,	NULL,	NULL,	NULL,	'AMEU',	NULL),
(2,	'Dinners USD',	'Pago con tarjeta de credito DINNERS dolares',	'dinners-dollars',	'01',	1,	NULL,	NULL,	NULL,	NULL,	'DINU',	NULL),
(2,	'Efectivo USD',	'Pago con dinero en efectivo en dolares',	'cash-dollars',	'01',	1,	NULL,	NULL,	NULL,	NULL,	'EFEU',	NULL),
(2,	'Cheque',	'Cheque',	'cheque',	'01',	1,	4,	NULL,	NULL,	NULL,	'CHEV',	NULL),
(2,	'EFECTIVO',	'Pago con dinero en efectivo',	'efectivo',	'01',	2,	1,	NULL,	NULL,	1,	'EFEC',	NULL),
(2,	'VISA',	'Pago con tarjeta de credito VISA',	'visa',	'01',	2,	2,	3,	NULL,	2,	'VISC',	NULL),
(2,	'Depósito Bancario',	'Pago con depósito bancario',	'deposito-bancario',	'01',	2,	3,	NULL,	NULL,	1,	'DBAC',	NULL),
(2,	'Cheque',	'Cheque',	'cheque',	'01',	2,	4,	2,	NULL,	2,	'CHEC',	NULL),
(2,	'Tarjeta de Crédito',	'Tarjeta de Crédito',	'tc',	'01',	NULL,	NULL,	NULL,	NULL,	NULL,	'TC',	NULL);

INSERT INTO `ms_entity_states` (`name`, `code`, `description`) VALUES
('Contabilizado',	'CTB',	'Contabilizado'),
('Sin Contabilizar',	'SCB',	'Sin Contabilizar');

INSERT INTO `ms_type_person` (`name`, `code_taxes`, `country_id`, `configuration`) VALUES
('DNI',	'1',	1,	'{\"validations\": {\"maxLength\": 8, \"minLength\": 8}}'),
('RUC',	'6',	1,	'{\"validations\": {\"maxLength\": 11, \"minLength\": 11}}'),
('Carnet de Extranjeria',	'4',	1,	'{\"validations\": {\"maxLength\": 12, \"minLength\": 0}}'),
('Pasaporte',	'7',	1,	'{\"validations\": {\"maxLength\": 15, \"minLength\": 0}}'),
('Cedula de identidad	',	'B',	1,	NULL),
('Otros tipos de documento	',	'0',	1,	NULL),
('RUC',	'04',	2,	'{\"validations\": {\"maxLength\": 13, \"minLength\": 13}}'),
('Cedula de Identidad',	'05',	2,	'{\"validations\": {\"maxLength\": 10, \"minLength\": 10}}'),
('Pasaporte',	'06',	2,	'{\"validations\": {\"maxLength\": 100, \"minLength\": 12}}'),
('Venta a consumidor final',	'07',	2,	NULL),
('Identificación del exterior',	'08',	2,	NULL),
('Placa',	'09',	2,	NULL);
