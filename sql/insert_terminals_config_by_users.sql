INSERT INTO `com_terminal_users` (`terminal_id`, `user_id`, `company_id`) 
SELECT `sal_terminals`.`id` as `terminal_id`, `com_employee`.`id` as `user_id`, `com_companies`.`id` as `company_id`
FROM `com_employee` 
JOIN `com_companies` on `com_employee`.`company_id` = `com_companies`.`id` 
JOIN `sal_terminals` on `com_employee`.`sal_terminals_id` = `sal_terminals`.`id`
WHERE
`com_companies`.`flag_active` = 1 and `com_companies`.`deleted_at` is null
and `sal_terminals`.`flag_active` = 1
and `com_employee`.`flag_active` = 1;