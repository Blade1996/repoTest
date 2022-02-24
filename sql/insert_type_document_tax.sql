INSERT INTO com_ms_type_documents (com_country_id, name, flag_type, code, code_taxes, summary_code, qp_code, description, include_in_list) VALUES
(2,	'COMPROBANTE DE RETENCION',	2,	'CRT',	'07',	NULL,	'F0',	'Descripción de Comprobantes de Retencion',	NULL);

INSERT INTO sal_type_documents (com_type_document_id, com_company_id) SELECT new_id_type_document, id FROM com_companies;