insert into ms_catalog_sunat (code, description, value, catalog, number, type, country_id, type_catalog) 
select unico, des_sri, desti_sri, tabla_sri, cod_lon, cod_tip, 2, 2 from sritabla where cod_lon != 0

insert into ms_catalog_sunat (code, description, value, catalog, number, type, country_id, type_catalog) 
select unico, des_sri, desti_sri, tabla_sri, cod_lon, cod_tip, 2, 2 from sritabla where cod_lon = 0