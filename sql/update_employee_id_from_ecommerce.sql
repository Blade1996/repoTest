
CREATE TEMPORARY TABLE temp_employee_commmerce
SELECT id, config_filters -> "$.commerces.commerces.values[0]" AS commerceId
FROM com_employee
WHERE company_id = 101
HAVING commerceId IS NOT NULL;

UPDATE com_ecommerce_company AS come
SET employee_id = (SELECT id FROM temp_employee_commmerce AS temp WHERE come.id = temp.commerceId)
WHERE company_id = 101 AND employee_id IS NULL;

DROP TABLE temp_employee_commmerce;