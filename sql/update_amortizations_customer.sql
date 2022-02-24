UPDATE ca_amortizations 
INNER JOIN ca_amortizations_details
ON ca_amortizations.id = ca_amortizations_details.amortization_id 
INNER JOIN sal_documents 
ON sal_documents.id = ca_amortizations_details.sal_document_id
SET ca_amortizations.customer_id = sal_documents.customer_id 
WHERE ca_amortizations.customer_id IS NULL


// Actualizar correlativo 

UPDATE `sal_documents`, (SELECT @row := 1623) r 
SET number = @row := @row + 1
WHERE `com_company_id` = '545' AND `sal_type_document_id` = '1' AND `terminal_id` = '5485' AND `status_tax` != '3' AND `id` > '1512472'
