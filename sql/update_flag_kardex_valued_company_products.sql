insert into dp6_product_quipu_pro.com_companies (id, name, flag_kardex_valued)
select id, company_name, json_Extract(settings, '$.flagKardexValued') from dp6_quipu_prod.com_companies where com_country_id = 1;
