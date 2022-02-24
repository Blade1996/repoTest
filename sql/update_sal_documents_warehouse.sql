UPDATE sal_documents 
INNER JOIN sal_terminals
ON sal_documents.terminal_id = sal_terminals.id 
SET sal_documents.warehouse_id = sal_terminals.war_warehouses_id 
WHERE sal_documents.com_company_id = 327 and sal_documents.warehouse_id is null;