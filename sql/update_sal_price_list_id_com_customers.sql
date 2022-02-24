UPDATE com_customers
INNER JOIN sal_price_lists ON com_customers.id = sal_price_lists.com_customers_id
SET com_customers.sal_price_list_id = sal_price_lists.id;