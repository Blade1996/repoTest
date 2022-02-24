UPDATE com_companies SET settings = JSON_SET(settings, "$.flagTransferDefault", true);
UPDATE com_companies SET settings = JSON_SET(settings, "$.flagTransferDisplay", true);
UPDATE com_companies SET settings = JSON_SET(settings, "$.typeProductsCreationPermission", CAST('[1, 2]' AS JSON));
