UPDATE sal_documents
SET date_tax_send = null
WHERE CAST(date_tax_send AS CHAR(20)) = '0000-00-00 00:00:00'
LIMIT 1280;