SELECT * FROM sal_sale_documents_detail
WHERE taxes -> '$[0].amount' > 0 AND taxes -> '$[0].percentage' > 0 AND 
taxes IS NOT NULL AND `war_products_id` = '1415644';

UPDATE sal_sale_documents_detail SET taxes = JSON_SET(taxes, '$[0].amount', 0, '$[0].percentage', 0), tax_amount = 0
WHERE taxes -> '$[0].amount' > 0 AND taxes -> '$[0].percentage' > 0 AND
 taxes IS NOT NULL AND `war_products_id` = '1415644';


 Solcionar detalles de documentos con error en calculo de impuestos.
 
update sal_sale_documents_detail set tax_amount = (price*quantity) - subtotal_without_tax,
taxes = JSON_SET(taxes, '$[0].amount', (price*quantity) - subtotal_without_tax, '$[1].amount', (price*quantity) - subtotal_without_tax)
where `tax_amount` != ((price * quantity) - subtotal_without_tax) and `created_at` <= '2021-11-05 15:21:17' AND `created_at` >= '2021-11-05 05:21:17';

UPDATE `com_employee` SET config_filters = 
JSON_SET(config_filters, '$.subsidiaries.cash', JSON_OBJECT('values', JSON_ARRAY(), 'fieldName', 'id'))
where company_id = 57

