CREATE DEFINER=`root`@`%` PROCEDURE `SP_INICIAR_DATA_BD_SALES`(
IN _company_name varchar(255),
    IN _flag_igv tinyint(1))
BEGIN
    DECLARE _company_id INT DEFAULT 0;
    insert into com_country (name, country_code, tax_name, url_image, tax_size)
    values('com_country_id', 'country_code', 'tax_name', 'com_country_id url_image', 0);

    insert into com_ms_type_documents (com_country_id, name, flag_type, code, description)
    values(1, 'com_ms_type_documents name', 1, 'code', 'com_ms_type_documents description');

    insert into sal_taxes (code, name, description, tax_percent)
    values('code', 'sal_taxes name', 'sal_taxes description', 0);

    insert into sal_type_terminals (name, description)
    values('sal_type_terminals name', 'sal_type_terminals description');

    insert into com_item (name, data_state, sal_sale_columns) values('item name', null, null);

	insert into  com_companies (com_item_id, code, credential, company_name, address, rz_social,
    quotation_report_code, sale_report_code, commerce_code, area_code, currency, email, language_id,
    language_json, logo, com_country_id, city_id, ruc, website, website_description, company_plan,
    phone, url_image, bank_account, weight, convert_weight_to, settings, flag_plan, flag_igv, flag_update_price,
    flag_barcode_reader)
    values(1, '1', 'company credential', _company_name, 'company address',
    'company rz_social', 'company quotation_report_code', 'company sale_report_code', 'company commerce_code',
    'company area_code', 'company currency', 'company email', 'company lenguaje_id', null, 'company logo',
    1, 1, 'company RUC', 'company web_site', 'comapany website_description', null, 'company phone', null,
    null, 'company weight', 'company convert_weight_to', null, 1, _flag_igv, 1, 1);

     select count(id) into _company_id from com_companies;

    insert into com_subsidiaries (sucursal_name, location, ubigeo, sucursal_code, phone, address, contact_name,
    contact_lastname, email, url_image, website_description, company_id)
    values('com_subsidiaries sucursal name', null, 'com_subsidiaries ubigeo',
    'com_subsidiaries sucursal code', 'com_subsidiaries phone', 'com_subsidiaries address',
    'com_subsidiaries constact_name', 'com_subsidiaries contact_lastname', 'com_subsidiaries email',
    'com_subsidiaries url_image', null, _company_id);

    insert into sal_price_lists (war_warehouses_id, com_employee_id, com_customers_id, name, description, company_id)
    values(1, null, null, 'sal_price_lists name', 'sal_price_lists description', _company_id);

    insert into sal_sales_states (name, descriptions)
    values('sal_sales_states name', 'sal_sales_states descriptions');

    insert into sal_terminals (com_subsidiaries_id, war_warehouses_id, sal_type_terminals_id, type_terminal,
    code, sunat_code, name, description, print_code)
    values(1, 1, 1, 1, 'sal_terminals code', 'sal_terminals sunat_code', 'sal_terminals name',
    'sal_terminals description', 'sal_terminals print_code');

    insert into sal_type_documents (com_type_document_id, com_company_id) values(1, _company_id);

    insert into sal_series (com_subsidiaries_id, sal_terminals_id, sal_type_documents_id, serie, number, company_id)
    values(1, 1, 1, 'sal_series serie', 'sal_series number', _company_id);

    insert into sal_tables (name, code, number, status, company_id)
    values('sal_tables name', 'sal_tables code', 'sal_tables number', 1, _company_id);

    insert into sal_type_payments (name, description, company_id)
    values('sal_type_payments name', 'sal_type_payments description', _company_id);
END