
insert into com_general (name, code, type_general_id, company_id) select 'Local', 'LOC', 5, id from com_companies where id not in (364, 365, 366, 367)

/*CREAR COMPANY DE QUIPU 360 EN MOTOR CONTABLE*/

INSERT INTO `com_customers` (`name`, `lastname`, `person_id`, `external_id`, `address`, `rz_social`, `ruc`, `dni`, `email`, `flag_type_person`, `phone`, `url_image`, `additional_information`, `acl_id`, `acl_code`, `regime_id`, `city_id`, `sector_id`, `emails`, `start_date_functions`, `contact`, `legal_representative`, `country_id`, `company_id`, `flag_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
('QTC PRUEBA',	NULL,	NULL,	COMPANY_JAPI,	'Calle Independencia 120, Miraflores - Lima',	NULL,	'20515298127',	NULL,	'xavier@mail.com',	NULL,	'777888999',	NULL,	NULL,	NULL,	'QQTT',	9,	27,	2,	'[\"TTTY@TT.COM\"]',	'2018-08-03 00:00:00',	'TTTYY',	'EEEWW',	1,	97,	1,	NULL,	'2018-08-03 15:33:24',	'2018-08-03 15:33:24');

INSERT INTO `com_auxiliary_customers` (`status`, `customer_id`, `auxiliary_id`, `company_id`, `flag_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1,	NEW_ID_CUSTOMER_JAPI,	AUXILIARY_QUIPU,	97,	1,	NULL,	'2018-08-02 16:21:51',	'2018-08-02 16:21:51');

INSERT INTO `com_accounting_accounts` (`name`, `account`, `code`, `level`, `status`, `description`, `type`, `element`, `father_account`, `reflex_account`, `customer_id`, `company_id`) 
SELECT `name`, `account`, `code`, `level`, `status`, `description`, `type`, `element`, `father_account`, `reflex_account`, NEW_ID_CUSTOMER_JAPI , `company_id` WHERE `customer_id` = 104;

