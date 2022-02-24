insert into war_warehouses_products (warehouse_id, product_id, stock, location, quantity, min_stock, price_list, brand_id, price_cost, price_sale, observation, updated_at, created_at) 
select new_warehouse_id, product_id, 0, location, 0, min_stock, price_list, brand_id, price_cost, price_sale, observation, now(), now()
from war_warehouses_products where warehouse_id = origin_warehouse_id;

update pur_ms_states set code = 'ING' where id = 1;
update pur_ms_states set code = 'NIN' where id = 2;
update pur_ms_states set code = 'ANU' where id = 3;