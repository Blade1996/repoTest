SET @comp = 101;
SET @domain = 'https://casamarket.la/c';

UPDATE com_ecommerce_company
SET url_domain = CONCAT(@domain,'/', com_ecommerce_company.slug)
WHERE company_id = @comp AND slug IS NOT NULL;