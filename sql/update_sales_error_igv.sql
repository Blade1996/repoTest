UPDATE sal_documents set taxes = round(amount-(amount/1.18), 2), subtotal = round(amount/1.18, 2) WHERE `com_company_id` = '348' AND `created_at` >= '2019-01-30 14:22:33' AND `created_at` <= '2019-02-01 02:34:19';

 select count(id), com_company_id from sal_documents where (taxes != round(amount-(amount/1.18), 2) or subtotal != round(amount/1.18, 2)) AND `created_at` >= '2019-01-30 14:22:33' AND `created_at` <= '2019-02-01 02:34:19' and com_company_id in (327, 373, 370, 350, 354, 359) and status_tax = 3 group by com_company_id;

select count(id) from sal_documents where (taxes != round(amount-(amount/1.18), 2) or subtotal != round(amount/1.18, 2)) AND `created_at` >= '2019-01-30 14:22:33' AND `created_at` <= '2019-02-01 02:34:19' and com_company_id in (327, 373, 370, 350, 354, 359);

update sal_documents set taxes = round(amount-(amount/1.18), 2), subtotal = round(amount/1.18, 2) where (taxes != round(amount-(amount/1.18), 2) or subtotal != round(amount/1.18, 2)) AND `created_at` >= '2019-01-30 14:22:33' AND `created_at` <= '2019-02-01 02:34:19' and com_company_id in (327, 373, 370, 350, 354, 359);