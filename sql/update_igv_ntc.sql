update sal_sale_documents_detail set sale_price = price, subtotal_without_tax = unit_price*quantity
WHERE `subtotal_without_tax` = '0' AND `sale_price` = '0' AND `created_at` >= '2019-02-12 00:00:00' AND `deleted_at` IS NULL AND `price` != '0' AND `tax_amount` != '0';

update sal_sale_documents_detail set sale_price = price, unit_price = price/1.18, tax = 18, 
tax_amount = ((price/1.18)*0.18)*quantity, subtotal_without_tax = (price/1.18)*quantity
where tax = 0 and tax_amount = 0 and deleted_at is null and sal_sale_documents_id in (85897, 85894, 85492, 85359);
