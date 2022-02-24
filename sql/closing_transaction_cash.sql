update sal_transactions set sal_cash_desk_closing_id = NEW_CLOSING_ID 
WHERE `cash_id` = CASH_ID AND `sal_cash_desk_closing_id` IS NULL AND `company_id` = COMPANY_ID;

BEGIN
    IF NEW.flag_trigger = 1 then
        IF NEW.currency = "PEN" THEN 
            UPDATE com_cash SET balance = JSON_SET(balance, "$.PEN", JSON_EXTRACT(balance, "$.PEN") + NEW.amount) WHERE id = NEW.cash_id;
        ELSEIF NEW.currency = "USD" THEN
            UPDATE com_cash SET balance = JSON_SET(balance, "$.USD", JSON_EXTRACT(balance, "$.USD") + NEW.amount) WHERE id = NEW.cash_id;
        ELSEIF NEW.currency = "COP" THEN
            UPDATE com_cash SET balance = JSON_SET(balance, "$.COP", NEW.amount) WHERE id = NEW.cash_id;
        ELSEIF NEW.currency = "EUR" THEN
            UPDATE com_cash SET balance = JSON_SET(balance, "$.EUR", NEW.amount) WHERE id = NEW.cash_id;
        END IF;
    END IF;
END