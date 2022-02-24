UPDATE `sal_documents` SET `created_at` =  '2019-05-05 15:56:54' WHERE `com_subsidiary_id` = '290' AND `com_company_id` = '348' AND `created_at` <= '2019-05-05 01:56:54';

select id, subtotal, taxes, amount, created_at, com_company_id 
from sal_documents 
where subtotal < taxes and deleted_at is null and year(created_at) = 2019
order by created_at desc 
limit 100;

select count(id) as sales, com_company_id 
from sal_documents 
where subtotal < taxes and deleted_at is null and year(created_at) = 2019
group by com_company_id;

update sal_documents set subtotal = taxes, taxes = round(amount-(amount/1.18), 2)
where subtotal < taxes and deleted_at is null and year(created_at) = 2019;
