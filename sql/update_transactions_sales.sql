UPDATE sal_transactions 
INNER JOIN sal_documents
ON sal_documents.id = sal_transactions.sal_sale_documents_id
SET sal_transactions.entity_external_id = sal_documents.customer_id 
, sal_transactions.document_external_id = sal_documents.id
, sal_transactions.payment_method_id = sal_documents.payment_method_id
, sal_transactions.document_number = sal_documents.document_number
, sal_transactions.type_transaction = 1
, sal_transactions.module_origin_id = 1
, sal_transactions.type_entity_id = 2
, sal_transactions.concept = concat(concat(concat('Transaccion de venta', ' ', sal_documents.document_number), ' ', sal_documents.currency),' ',sal_documents.amount)
, sal_transactions.type_movement = 1
WHERE sal_transactions.cash_id IS NULL;

SELECT count(id) as num FROM `sal_transactions` WHERE `type_movement` = '2' AND `amount` > '0' and year(created_at) = 2019 and deleted_at is null;

UPDATE sal_transactions SET payment_amount = -payment_amount, amount = -amount WHERE `type_movement` = '2' AND `amount` > '0' and year(created_at) = 2019 and deleted_at is null;
