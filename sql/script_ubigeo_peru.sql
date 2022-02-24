INSERT INTO `ms_type_general` (`id`, `name`, `country_id`, `flag_company`) VALUES
(10,	'DEPARTAMENTOS PERU',	1,	0),
(11,	'PROVINCIAS PERU',	1,	0),
(12,	'DISTRITOS PERU',	1,	0);

insert into com_general (code, name, type_general_id) select idDepa, departamento, 10 from ubdepartamento;
insert into com_general (code, name, number, type_general_id) select idProv, provincia, (select id from com_general where type_general_id = 10 and code = idDepa), 11 from ubprovincia;
insert into com_general (code, name, number, type_general_id) select idDist, distrito, (select id from com_general where type_general_id = 11 and code = idProv), 12 from ubdistrito;