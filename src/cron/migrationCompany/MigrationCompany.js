'use strict';

require('dotenv').config();
const Podium = require('podium');
const TypeProcess = require('../../models/TypeProcess');
const Person = require('../../models/Person');
const dbConfig = require('../../config/objection');

dbConfig.initConnection();

const podiumObject = new Podium();

podiumObject.registerEvent('ms_person');
podiumObject.registerEvent('com_customers');
podiumObject.registerEvent('pur_suppliers');
podiumObject.registerEvent('com_subsidiaries');
podiumObject.registerEvent('com_cash');
podiumObject.registerEvent('com_companies_bank_accounts');
podiumObject.registerEvent('sal_terminals');
podiumObject.registerEvent('sal_series');
podiumObject.registerEvent('com_companies_templates');

async function registerMigration() {
	try {
		const statusMigration = await TypeProcess.getByMigration({});
		if (statusMigration && statusMigration.settings) {
			const { settings, id } = statusMigration;
			const companies = Object.values(settings);
			const item = companies.find(i => i.status > -1);
			if (item.status === 1 && item.ejecuteNextScript && item.bdNextScript === 1) {
				podiumObject.emit(item.ejecuteNextScript, { settings, item, id });
			}
		}
		return statusMigration;
	} catch (error) {
		return error;
	}
}

podiumObject.on('ms_person', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'com_customers',
			scriptEjecute: 'ms_person',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw('update ms_person_aux set deleted_at = null where deleted_at IS NOT NULL');
		await knex.schema.raw(
			'update ms_person_aux as pe join com_customers_aux as cu on cu.person_id = pe.id set pe.deleted_at = now() where cu.com_companies_id = ?',
			[oldId],
		);
		await knex.schema.raw(
			'update ms_person_aux as pe join pur_suppliers_aux as su on su.person_id = pe.id set pe.deleted_at = now() where su.company_id = ?',
			[oldId],
		);
		await knex.schema.raw('insert into ms_person (fullname, document_number, nationality, email, flag_type_person) select fullname, document_number, id, email, flag_type_person from ms_person_aux where deleted_at IS NOT NULL');
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('com_customers', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const {
			id: companyId, oldId, employeeId, commerceId, subsidiaryId,
		} = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'pur_suppliers',
			scriptEjecute: 'com_customers',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'update com_customers_aux c inner join ms_person p on p.nationality = c.person_id set c.person_id = p.id where c.com_companies_id = ? and c.deleted_at  is null',
			[oldId],
		);
		if (commerceId) {
			await knex.schema.raw(
				'update com_customers_aux set commerce_id = ?, commerce_subsidiary_id = ? where com_companies_id = ? and deleted_at  is null',
				[commerceId, subsidiaryId, oldId],
			);
		}
		await knex.schema.raw(
			'insert into com_customers (`com_companies_id`, `person_id`, `user_id`, `customer_item_id`, `limit_amount_sale`, `name`, `lastname`, `rz_social`, `website_address`, `nationality`, `email`, `phone`, `ruc`, `dni`, `gender`, `date_birth`, `civil_status`, `son_number`, `contact`, `address`, `geo_position`, `url_image`, `group_id`, `flag_type_person`, `flag_generic`, `flag_accounting`, `additional_information`, `prospect`, `external_data`, `total_sales`, `debts_sales`, `flag_debts`, `sales_quantity`, `flag_related_customer`, `flag_post_dated_credit`, `customer_type`, `country_id`, `account_advance_account`, `accounting_code`, `payment_method_id`, `credit_limit_days`, `limit_amount_credit`, `credit_limitation_balance`, `flag_items_without_retainer`, `flag_retention_agent`, `flag_special_contributor`, `flag_exempt_taxes`, `phone_numbers`, `origin_income_id`, `type_destination_id`, `postal_code`, `zone`, `parish_id`, `city_id`, `province_id`, `longitude`, `latitude`, `establishment_code`, `acl_code`, `flag_involve_stock`, `flag_ecommerce`, `commerce_id`, `commerce_subsidiary_id`, `flag_active`, `com_item_id`, `flag_detraction`) select ?, person_id, ?, `customer_item_id`, `limit_amount_sale`, `name`, `lastname`, `rz_social`, `website_address`, `nationality`, `email`, `phone`, `ruc`, `dni`, `gender`, `date_birth`, `civil_status`, `son_number`, `contact`, `address`, `geo_position`, `url_image`, `group_id`, `flag_type_person`, `flag_generic`, `flag_accounting`, `additional_information`, `prospect`, `external_data`, `total_sales`, `debts_sales`, `flag_debts`, `sales_quantity`, `flag_related_customer`, `flag_post_dated_credit`, `customer_type`, `country_id`, `account_advance_account`, `accounting_code`, `payment_method_id`, `credit_limit_days`, `limit_amount_credit`, `credit_limitation_balance`, `flag_items_without_retainer`, `flag_retention_agent`, `flag_special_contributor`, `flag_exempt_taxes`, `phone_numbers`, `origin_income_id`, `type_destination_id`, `postal_code`, id, `parish_id`, `city_id`, `province_id`, `longitude`, `latitude`, `establishment_code`, `acl_code`, `flag_involve_stock`, `flag_ecommerce`, `commerce_id`, `commerce_subsidiary_id`, `flag_active`, `com_item_id`, `flag_detraction` FROM com_customers_aux where com_companies_id = ? and deleted_at is null',
			[companyId, employeeId, oldId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('pur_suppliers', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'com_subsidiaries',
			scriptEjecute: 'pur_suppliers',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'update pur_suppliers_aux c inner join ms_person p on p.nationality = c.person_id set c.person_id = p.id where c.company_id = ? and c.deleted_at  is null',
			[oldId],
		);
		await knex.schema.raw(
			'INSERT INTO `pur_suppliers` (`name`, `code`, `auto_code`, `contact_name`, `phone`, `location`, `percentage_taxes`, `code_taxes`, `code_taxes_goods`, `url_files`, `company_id`, `flag_active`, `deleted_at`, `created_at`, `updated_at`, `flag_type_person`, `person_id`, `document_number`, `commercial_name`, `accounting_code`, `flag_accounting`, `address`, `email`, `group_id`, `type_expense_id`, `latitude`, `longitude`, `geo_position`, `zone_id`, `postal_code`, `parish_id`, `city_id`, `province_id`, `observation`, `payment_method`, `credit_days`, `credit_limitation`, `credit_limitation_balance`, `bank_id`, `accounting_type_id`, `accounting_bank`, `supplier_type_id`, `currency_amount`, `purchases_quantity`, `additional_information`, `website_address`, `nationality`, `url_image`, `date_birth`) select `name`, `code`, `auto_code`, `contact_name`, `phone`, `location`, `percentage_taxes`, `code_taxes`, `code_taxes_goods`, `url_files`, ?, `flag_active`, `deleted_at`, `created_at`, `updated_at`, `flag_type_person`, `person_id`, `document_number`, `commercial_name`, `accounting_code`, `flag_accounting`, `address`, `email`, null, `type_expense_id`, `latitude`, `longitude`, `geo_position`,null, `postal_code`, null, null, null, `observation`, `payment_method`, `credit_days`, `credit_limitation`, `credit_limitation_balance`, `bank_id`, null, `accounting_bank`, `supplier_type_id`, `currency_amount`, `purchases_quantity`, `additional_information`, `website_address`, `nationality`, `url_image`, `date_birth` FROM pur_suppliers_aux where company_id = ? and deleted_at  is null',
			[companyId, oldId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('com_subsidiaries', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 2,
			ejecuteNextScript: 'war_warehouses',
			scriptEjecute: 'com_subsidiaries',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'INSERT INTO `com_subsidiaries` (`sucursal_name`, `rz_social`, `ruc`, `location`, `ubigeo`, `sucursal_code`, `phone`, `address`, `district_id`, `province_id`, `department_id`, `contact_name`, `contact_lastname`, `email`, `url_image`, `url_logo`, `website_description`, `flag_taxes`, `flag_account`, `flag_accounting_automatic`, `flag_accounting_engine`, `special_contributor`, `debts_sales`, `type_ambient_tax`, `flag_credit_dispatch`, `flag_default`, `rise`, `settings`, `token_store`, `subsidiary_acl_code`, `flag_integrations`, `company_id`, `config_integrations`, `subsidiary_id`, `distributor_customer_id`) select `sucursal_name`, `rz_social`, `ruc`, `location`, `ubigeo`, `sucursal_code`, `phone`, `address`, `district_id`, `province_id`, `department_id`, `contact_name`, `contact_lastname`, `email`, `url_image`, `url_logo`, `website_description`, `flag_taxes`, `flag_account`, `flag_accounting_automatic`, `flag_accounting_engine`, id, `debts_sales`, `type_ambient_tax`, `flag_credit_dispatch`, `flag_default`, `rise`, `settings`, `token_store`, `subsidiary_acl_code`, `flag_integrations`, ?, `config_integrations`, `subsidiary_id`, `distributor_customer_id` from com_subsidiaries_aux where company_id = ? and deleted_at  is null',
			[companyId, oldId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('com_cash', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 2,
			ejecuteNextScript: 'war_ms_categories',
			scriptEjecute: 'com_cash',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'update dp6_quipu_prod.com_cash_aux c inner join dp6_product_quipu_pro.war_warehouses p on p.external_code = c.war_warehouses_id set c.war_warehouses_id = p.id where c.company_id = ? and c.deleted_at  is null',
			[oldId],
		);
		await knex.schema.raw(
			'INSERT INTO `com_cash` (`code`, `balance`, `flag_control`, `name`, `description`, `account`, `type`, `war_warehouses_id`, `flag_general`, `state`, `company_id`) select `code`, `balance`, `flag_control`, `name`, `description`, id, `type`, `war_warehouses_id`, `flag_general`, `state`, ? from com_cash_aux where company_id = ? and deleted_at  is null',
			[companyId, oldId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('com_companies_bank_accounts', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'sal_terminals',
			scriptEjecute: 'com_companies_bank_accounts',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'INSERT INTO `com_companies_bank_accounts` (`bank_id`, `name`, `account_number`, `account_number_ci`, `currency`, `currency_symbol`, `balance`, `subsidiaries`, `additional_information`, `subsidiary_id`, `bank_account_type_id`, `cutoff_date`, `initial_balance`, `flag_format_charge`, `city_id`, `accounting_account`, `company_id`) select `bank_id`, `name`, `account_number`, `account_number_ci`, `currency`, `currency_symbol`, `balance`, `subsidiaries`, `additional_information`, `subsidiary_id`, `bank_account_type_id`, `cutoff_date`, `initial_balance`, `flag_format_charge`, `city_id`, `accounting_account`, ? from com_companies_bank_accounts_aux where company_id = ?',
			[companyId, oldId],
		);
		await knex.schema.raw(
			'update com_companies_bank_accounts a inner join com_subsidiaries b on b.special_contributor = a.subsidiary_id and b.company_id = ? set a.subsidiary_id = b.id where a.company_id = ? and a.subsidiary_id is not null',
			[companyId, companyId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('sal_terminals', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'sal_series',
			scriptEjecute: 'sal_terminals',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'INSERT INTO sal_terminals (`com_subsidiaries_id`, `war_warehouses_id`, `war_warehouses_name`, `sal_type_terminals_id`, `type_terminal`, `type_device`, `code`, `sunat_code`, `code_taxes`, `name`, `description`, `print_code`, `ruc`, `cash_id`, `authorization_date`, `flag_ecommerce`, `flag_admin`, `company_id`, `session_status_id`, `commerce_id`) select b.id, a.war_warehouses_id, a.war_warehouses_name, a.sal_type_terminals_id, a.type_terminal, a.type_device, a.code, a.sunat_code, a.id, a.name, a.description, a.print_code, a.ruc, a.cash_id, a.authorization_date, a.flag_ecommerce, a.flag_admin, ?, a.session_status_id, a.commerce_id from sal_terminals_aux a inner join com_subsidiaries b on a.com_subsidiaries_id = b.special_contributor and b.company_id = ? where a.company_id = ?',
			[companyId, companyId, oldId],
		);
		await knex.schema.raw(
			'update dp6_quipu_prod.sal_terminals a inner join dp6_product_quipu_pro.war_warehouses b on b.external_code = a.war_warehouses_id and b.company_id = ? set a.war_warehouses_id = b.id where a.company_id = ? and a.war_warehouses_id is not null',
			[companyId, companyId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('sal_series', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 1,
			ejecuteNextScript: 'com_companies_templates',
			scriptEjecute: 'sal_series',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw(
			'INSERT INTO sal_series (`com_subsidiaries_id`, `sal_terminals_id`, `sal_type_documents_id`, `serie`, `number`, `flag_billing_default`, `description`, `code_taxes`, `company_id`, `cash_id`, `type_billing`, `flag_send_billing`, `company_template_id`, `flag_active`, `notes_type_document_id`) select b.id, a.sal_terminals_id, a.sal_type_documents_id, a.serie, a.number, a.flag_billing_default, a.description, a.id, ?, a.cash_id, a.type_billing, a.flag_send_billing, null, a.flag_active, a.notes_type_document_id from sal_series_aux a inner join com_subsidiaries b on a.com_subsidiaries_id = b.special_contributor and b.company_id = ? where a.company_id = ?',
			[companyId, companyId, oldId],
		);
		await knex.schema.raw(
			'update sal_series a inner join sal_terminals b on b.code_taxes = a.sal_terminals_id and b.company_id = ? set a.sal_terminals_id = b.id where a.company_id = ? and a.sal_terminals_id is not null',
			[companyId, companyId],
		);
		await knex.schema.raw(
			'update sal_series a inner join sal_series b on b.code_taxes = a.notes_type_document_id and b.company_id = ? set a.notes_type_document_id = b.id where a.notes_type_document_id is not null and a.company_id = ?',
			[companyId, companyId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

podiumObject.on('com_companies_templates', async (objResponse) => {
	try {
		const { settings, item, id } = objResponse;
		const { id: companyId, oldId } = item;
		await TypeProcess.updateNextMigration({
			settings,
			id,
			bdNextScript: 2,
			ejecuteNextScript: 'com_banners',
			scriptEjecute: 'com_companies_templates',
			status: 0,
			companyId,
		});
		const knex = Person.knex();
		await knex.schema.raw('DELETE from com_companies_templates where company_id = ?', [companyId]);
		await knex.schema.raw(
			'INSERT INTO com_companies_templates (`name`, `code`, `recipe`, `template`, `type_document_id`, `company_id`) select id, code, recipe, template, type_document_id, ? from com_companies_templates_aux where company_id = ?',
			[companyId, oldId],
		);
		await knex.schema.raw(
			'update sal_series a inner join com_companies_templates b on b.name = a.company_template_id and b.company_id = ? set a.company_template_id = b.id where a.company_id = ? and a.company_template_id is not null',
			[companyId, companyId],
		);
		await knex.schema.raw(
			'update com_companies_templates a inner join com_companies_templates_aux b on b.id = a.name and b.company_id = ? set a.name = b.name where a.company_id = ?',
			[oldId, companyId],
		);
		await TypeProcess.updateNextMigration({
			settings,
			id,
			status: 1,
			companyId,
		});
		return Promise.resolve();
	} catch (error) {
		// eslint-disable-next-line no-console
		return console.log(error);
	}
});

module.exports = registerMigration;
