/*Script inicial*/
UPDATE sal_documents set balance = amount;

/*Script de ejemplo de validacion */
select sum(b.amount) from sal_documents as b where b.com_company_id = 101 and b.sal_documents_id = 2 and b.sal_type_document_id = 5 group by b.sal_documents_id;

/*Script donde se resta el valor total de notas de credito al campo balance de sal_documents*/
UPDATE sal_documents a join (select sum(b.amount) as sumSale, sal_documents_id
from sal_documents b
where b.sal_type_document_id = 5 group by b.sal_documents_id ) sale_sum
on sale_sum.sal_documents_id = a.id
set a.balance = a.balance - sale_sum.sumSale
where com_company_id = 101 and (sal_type_document_id = 1 or sal_type_document_id = 2);