/* EN QUIPU*/

INSERT INTO `com_ms_type_documents` (`id`, `com_country_id`, `name`, `flag_type`, `code`, `code_taxes`, `summary_code`, `qp_code`, `description`, `settings`, `include_in_list`) VALUES
(19,	2,	'BOLETA',	2,	'BOL',	'03',	NULL,	'B0',	'Descripción de Boleta',	'{\"create\": true, \"generateNtc\": false}',	NULL),
(20,	2,	'FACTURA',	2,	'FAC',	'01',	NULL,	'F0',	'Descripción de Factura',	'{\"create\": true, \"generateNtc\": false}',	NULL),
(21,	2,	'RECIBO DE CAJA',	NULL,	'RC',	NULL,	NULL,	NULL,	'RECIBO DE CAJA',	NULL,	NULL);

INSERT INTO `sal_type_documents` (`com_type_document_id`, `com_company_id`) VALUES
(19,	489),
(20,	489);

/*EN MOTOR CONTABLE*/

INSERT INTO `com_customers` (`id`, `name`, `lastname`, `person_id`, `external_id`, `address`, `rz_social`, `ruc`, `dni`, `email`, `flag_type_person`, `phone`, `url_image`, `additional_information`, `acl_id`, `acl_code`, `regime_id`, `city_id`, `sector_id`, `emails`, `start_date_functions`, `contact`, `legal_representative`, `country_id`, `company_id`) VALUES
(106,	'QUIPUTEST',	NULL,	NULL,	489,	NULL,	NULL,	'24252625242',	NULL,	'delta@quipu.com',	NULL,	'425454',	NULL,	NULL,	NULL,	'QUIPUTEST',	5,	46,	2,	'[\"correo@quipu.com\"]',	'2018-06-12 00:00:00',	'contacto1',	'representante1',	2,	97);

INSERT INTO `com_auxiliary` (`id`, `user_name`, `person_id`, `user_code`, `user_id`, `status`, `flag_accountant`, `email`, `company_id`, `phone`, `number_document`) VALUES
(134,	'DELTA',	298,	'deltaquipu',	NULL,	'1',	NULL,	'delta@quipu.com',	97,	NULL,	NULL),
(135,	'TANGO',	298,	'TNG777',	NULL,	'1',	NULL,	'tango@quipu.com',	97,	NULL,	'00022255'),
(136,	'ALPHA',	298,	'ALPHA777',	NULL,	'1',	NULL,	'alpha@quipu.com',	97,	NULL,	'00003333'),
(137,	'TANIA',	298,	'TAN777',	NULL,	'1',	NULL,	'tania@quipu.com',	97,	NULL,	'00005588'),
(138,	'JDV',	298,	'JDVUSER',	NULL,	'1',	NULL,	'jdv@quipu.com',	97,	NULL,	'000000444'),
(139,	'CIADE',	298,	'CIADEUSER',	NULL,	'1',	NULL,	'ciade@quipu.com',	97,	NULL,	'00114477'),
(140,	'CATA',	298,	'CATAUSER',	NULL,	'1',	NULL,	'cata@quipu.com',	97,	NULL,	'22223333'),
(141,	'KASCLA',	298,	'KASCLAUSER',	NULL,	'1',	NULL,	'kascla@quipu.com',	97,	NULL,	'44445555'),
(142,	'CARLOS',	298,	'CARLOSUSER',	NULL,	'1',	NULL,	'carlos@quipu.com',	97,	NULL,	'00007777'),
(143,	'DANNY',	298,	'DANNYUSER',	NULL,	'1',	NULL,	'danny@quipu.com',	97,	NULL,	'00005555'),
(144,	'DAVID',	298,	'DAVIDUSER',	NULL,	'1',	NULL,	'david@quipu.com',	97,	NULL,	'00009999'),
(145,	'HUGO',	298,	'HUGOUSER',	NULL,	'1',	NULL,	'hugo@quipu.com',	97,	NULL,	'00001111');

INSERT INTO `com_auxiliary_customers` (`id`, `status`, `customer_id`, `auxiliary_id`, `company_id`) VALUES
(57,	1,	106,	134,	97,
(58,	1,	106,	135,	97),
(59,	1,	106,	136,	97),
(60,	1,	106,	137,	97),
(61,	1,	106,	138,	97),
(62,	1,	106,	139,	97),
(63,	1,	106,	140,	97),
(64,	1,	106,	141,	97),
(65,	1,	106,	142,	97),
(66,	1,	106,	143,	97),
(67,	1,	106,	144,	97),
(68,	1,	106,	145,	97);

INSERT INTO `com_accounting_accounts` (`name`, `account`, `code`, `level`, `status`, `description`, `type`, `element`, `father_account`, `reflex_account`, `customer_id`, `company_id`) 
SELECT `name`, `account`, `code`, `level`, `status`, `description`, `type`, `element`, `father_account`, `reflex_account`, 106 , `company_id` WHERE `customer_id` = 105;