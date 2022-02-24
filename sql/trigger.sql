delimiter |
CREATE TRIGGER upd_sal_transactions 
AFTER UPDATE 
ON sal_transactions
       FOR EACH ROW
       BEGIN
insert into sal_transactions_record (sal_transactions_id, state_id, type_payment_id, payment_date, payment_amount, currency, amount, additional_information, company_id, operation_code)
values (NEW.id, NEW.state_id, NEW.type_payment_id, NEW.payment_date, NEW.payment_amount, NEW.currency, NEW.amount, NEW.additional_information, NEW.company_id, 'update');
       END;
|

delimiter |
CREATE TRIGGER ins_sal_transactions 
AFTER INSERT 
ON sal_transactions
       FOR EACH ROW
       BEGIN
insert into sal_transactions_record (sal_transactions_id, state_id, type_payment_id, payment_date, payment_amount, currency, amount, additional_information, company_id, operation_code)
values (NEW.id, NEW.state_id, NEW.type_payment_id, NEW.payment_date, NEW.payment_amount, NEW.currency, NEW.amount, NEW.additional_information, NEW.company_id, 'insert');
       END;
|

delimiter |
CREATE TRIGGER sal_transactions_updates_cash_balance
       AFTER INSERT ON sal_transactions
       FOR EACH ROW
BEGIN
    IF NEW.currency = "PEN" THEN 
        UPDATE com_cash SET balance = JSON_SET(balance, "$.PEN", NEW.balance) WHERE id = NEW.cash_id;
    ELSEIF NEW.currency = "USD" THEN
        UPDATE com_cash SET balance = JSON_SET(balance, "$.USD", NEW.balance) WHERE id = NEW.cash_id;
    ELSEIF NEW.currency = "EUR" THEN
        UPDATE com_cash SET balance = JSON_SET(balance, "$.EUR", NEW.balance) WHERE id = NEW.cash_id;
    END IF;
END
|