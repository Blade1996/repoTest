update dp6_japi_dev.sal_sale_documents_detail
inner join dp6_tumipos.war_products
on dp6_japi_dev.sal_sale_documents_detail.war_products_id = dp6_tumipos.war_products.id
inner join dp6_tumipos.war_ms_categories
on dp6_tumipos.war_ms_categories.id = dp6_tumipos.war_products.category_id
set dp6_japi_dev.sal_sale_documents_detail.product_code = dp6_tumipos.war_products.code,
dp6_japi_dev.sal_sale_documents_detail.category_name = dp6_tumipos.war_ms_categories.name
where dp6_japi_dev.sal_sale_documents_detail.deleted_at is null;

update dp6_japi_dev.sal_sale_documents_detail 
inner join dp6_tumipos.war_brands
on dp6_japi_dev.sal_sale_documents_detail.brand_id = dp6_tumipos.war_brands.id
set dp6_japi_dev.sal_sale_documents_detail.brand_name = dp6_tumipos.war_brands.name
where dp6_japi_dev.sal_sale_documents_detail.deleted_at is null;

update dp6_japi_dev.sal_sale_documents_detail 
inner join dp6_tumipos.war_ms_units
on dp6_japi_dev.sal_sale_documents_detail.unit_id = dp6_tumipos.war_ms_units.id
set dp6_japi_dev.sal_sale_documents_detail.unit_code = dp6_tumipos.war_ms_units.code,
dp6_japi_dev.sal_sale_documents_detail.unit_name = dp6_tumipos.war_ms_units.name
where dp6_japi_dev.sal_sale_documents_detail.deleted_at is null;