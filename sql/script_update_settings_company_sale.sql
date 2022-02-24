UPDATE com_companies SET settings = JSON_SET(settings, "$.flagWholesaleVariationGroup", false);
UPDATE com_companies SET settings = JSON_SET(settings, "$.flagStockDiscountSaleTransfer", false);
