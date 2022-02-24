insert into sal_type_documents (com_type_document_id, com_company_id) 
select /*newTypeDocumentId*/, id from com_companies;

INSERT INTO `sal_type_documents` (`com_type_document_id`, `com_company_id`)
SELECT 20, id from com_companies WHERE `id` in (320, 327, 330, 331, 334, 345, 346, 348, 350, 355, 359, 370, 372, 373, 374, 375, 376, 378);