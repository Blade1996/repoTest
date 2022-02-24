SET @compId = 159;
SET @subId = 202;
SET @empId = 637;
SET @termId = 592;
SET @commId = 274;
SET @warId = 1722;

DELETE FROM com_gateway_transactions
WHERE com_gateway_transactions.company_id = @compId
 AND com_gateway_transactions.commerce_id != @commId;

DELETE FROM sal_orders_details
WHERE sal_orders_details.company_id = @compId;

DELETE FROM sal_orders
WHERE sal_orders.company_id = @compId
 AND sal_orders.commerce_id != @commId
 AND sal_orders.employee_id != @empId
 AND sal_orders.terminal_id != @termId
 AND sal_orders.subsidiary_id != @subId;

DELETE FROM com_withholding_tax_detail
WHERE com_withholding_tax_detail.company_id = @compId;

DELETE FROM com_withholding_tax
WHERE com_withholding_tax.company_id = @compId;

DELETE FROM sal_series
WHERE sal_series.company_id = @compId 
 AND sal_series.com_subsidiaries_id != @subId;

DELETE FROM com_devices
WHERE com_devices.company_id = @compId
 AND com_devices.subsidiary_id != @subId
 AND com_devices.warehouse_id != @warId
 AND com_devices.terminal_id != @termId;

DELETE FROM com_commerce_information
WHERE com_commerce_information.company_id = @compId
 AND com_commerce_information.com_commerce_id != @commId;

DELETE FROM com_way_payment_commerce
WHERE com_way_payment_commerce.company_id = @compId
 AND com_way_payment_commerce.commerce_id != @commId;

DELETE FROM com_ecommerce_company
WHERE com_ecommerce_company.company_id = @compId
 AND com_ecommerce_company.id != @commId
 AND com_ecommerce_company.subsidiary_id != @subId
 AND com_ecommerce_company.employee_id != @empId;

DELETE FROM com_terminal_users
WHERE com_terminal_users.company_id = @compId
 AND com_terminal_users.terminal_id != @termId
 AND com_terminal_users.user_id != @empId;

DELETE FROM com_employee
WHERE com_employee.company_id = @compId
 AND com_employee.id != @empId
 AND com_employee.war_warehouses_id != @warId
 AND com_employee.com_subsidiaries_id != @subId;

DELETE FROM sal_terminals
WHERE sal_terminals.company_id = @compId
 AND sal_terminals.com_subsidiaries_id != @subId
 AND sal_terminals.war_warehouses_id != @warId;

DELETE FROM com_subsidiaries
WHERE com_subsidiaries.company_id = @compId
 AND com_subsidiaries.id != @subId;