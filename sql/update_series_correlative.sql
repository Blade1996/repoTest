select sal_type_document_id, count(id), serie, serie_id from sal_documents
WHERE `com_company_id` = '348' AND `created_at` >= '2018-10-01 16:51:22' AND `com_subsidiary_id` = '238' 
group by sal_type_document_id;
SET @numero=0;
update sal_documents set number = @numero:=@numero+1, document_number = concat("02-",@numero)
WHERE `com_company_id` = '348' AND `created_at` >= '2018-10-01 16:51:22' AND `com_subsidiary_id` = '238' AND `sal_type_document_id` = '1'
order by created_at asc;
SET @numero=0;
update sal_documents set number = @numero:=@numero+1, document_number = concat("01-",@numero)
WHERE `com_company_id` = '348' AND `created_at` >= '2018-10-01 16:51:22' AND `com_subsidiary_id` = '238' AND `sal_type_document_id` = '2'
order by created_at asc;

select concat(serie,"old"), concat(serie, "old-", number) from sal_documents
WHERE `com_company_id` = '348' AND `created_at` < '2018-10-01 16:51:22' AND `com_subsidiary_id` = '238';

update sal_documents set serie = concat(serie,"old"), document_number = concat(serie, "old-", number)
WHERE `com_company_id` = '348' AND `created_at` < '2018-10-01 16:51:22' AND `com_subsidiary_id` = '238';