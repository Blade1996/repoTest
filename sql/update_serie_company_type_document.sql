SELECT `id`, `document_number` FROM `sal_documents` WHERE `com_company_id` = '346' AND `com_subsidiary_id` = '244' AND `serie_id` = '326';

update sal_documents set deleted_at = now() WHERE `com_company_id` = '346' AND `com_subsidiary_id` = '244' AND `serie_id` = '326';

SELECT * FROM `sal_transactions` WHERE `sal_sale_documents_id` IN (85059,85124,85127,85283,86412,86867,86869,87863,87864,88302,88319,88673,89793,89797,90285,90582,90806,91480,91517,91528,92066);

update sal_transactions set deleted_at = now() WHERE `sal_sale_documents_id` IN (85059,85124,85127,85283,86412,86867,86869,87863,87864,88302,88319,88673,89793,89797,90285,90582,90806,91480,91517,91528,92066);

SELECT * FROM `sal_series` WHERE `id` = '326';

update sal_series set number = 0 WHERE `id` = '326';
