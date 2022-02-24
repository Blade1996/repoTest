update sal_sale_documents_detail set sale_price = price, unit_price = price/1.18, tax = 18, tax_amount = ((price/1.18)*0.18)*quantity, subtotal_without_tax = (price/1.18)*quantity
where tax = 0 and tax_amount = 0 and created_at >= '2019-01-01 00:00:00';

update sal_sale_documents_detail set sale_price = price, unit_price = price/1.18, tax = 18, 
tax_amount = ((price/1.18)*0.18)*quantity, subtotal_without_tax = (price/1.18)*quantity
where tax = 0 and tax_amount = 0 and deleted_at is null 
and sal_sale_documents_id in (85897, 85894, 85492, 85345, 85733, 84831, 84747, 84744, 84085, 83978, 83424, 83361, 83183, 83186, 83116, 83182, 82387);