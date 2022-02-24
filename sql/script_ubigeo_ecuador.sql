INSERT INTO `ms_type_general` (`id`, `name`, `country_id`, `flag_company`) VALUES
(6,	'PROVINCIAS ECUADOR',	2,	0),
(7,	'CIUDADES ECUADOR',	2,	0),
(8,	'PARROQUIAS ECUADOR',	2,	0);

insert into com_general (code, name, type_general_id) select DISTINCT codProvincia, Provincia, 6 from datosEcuador;

insert into com_general (code, name, type_general_id, number) 
select DISTINCT codCiudad, Ciudad, 7, (select id from com_general where code = codProvincia) from datosEcuador;

insert into com_general (code, name, type_general_id, number) 
select DISTINCT codParroquia, Parroquia, 8, (select id from com_general where code = codCiudad) from datosEcuador;