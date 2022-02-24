/*Consulta de registros a fixear (siempre que se haga un script de escritura SI o SI SE DEBE HACER!) */
SELECT d.id, d.amortization_id, d.created_At, d.sal_document_id
FROM `ca_amortizations_details` d
inner join ca_amortizations a on a.id = d.amortization_id and a.type_amortization = 2 and a.deleted_at is null
inner join com_document_account_status s on s.sale_document_id = d.sal_document_id and s.deleted_at is null
WHERE d.document_account_status_id IS NULL 
AND d.pur_document_id IS NULL 
AND d.sal_document_id IS NOT NULL 
and d.deleted_at is null
and d.created_At >= '2021-01-01';

/*Actualizando valor de campo document_account_status_id no seteado por bug */
update ca_amortizations_details d
inner join ca_amortizations a on a.id = d.amortization_id and a.type_amortization = 2 and a.deleted_at is null
inner join com_document_account_status s on s.sale_document_id = d.sal_document_id and s.deleted_at is null
set d.document_account_status_id = s.id, d.updated_at = now()
WHERE d.document_account_status_id IS NULL 
AND d.pur_document_id IS NULL 
AND d.sal_document_id IS NOT NULL 
and d.deleted_at is null
and d.created_At >= '2021-01-01';

/*Consulta ejecutada, 29 886 registros afectados*/
