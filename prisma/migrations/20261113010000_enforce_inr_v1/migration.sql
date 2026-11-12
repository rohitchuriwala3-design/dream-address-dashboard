-- MARK IV V1 is a single-currency India deployment. Preserve legacy currency
-- rows and transaction amounts, while making INR the only currency available
-- to active V1 workflows.
INSERT INTO "Currency" ("code", "name", "symbol", "isEnabled", "isDefault", "createdAt", "updatedAt")
VALUES ('INR', 'Indian Rupee', '₹', true, true, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "symbol" = EXCLUDED."symbol",
    "isEnabled" = true,
    "isDefault" = true,
    "updatedAt" = NOW();

UPDATE "Currency"
SET "isEnabled" = false,
    "isDefault" = false,
    "updatedAt" = NOW()
WHERE "code" <> 'INR';

-- V1 does not use foreign exchange conversions.
DELETE FROM "ExchangeRate";

INSERT INTO "crm_SystemSettings" ("key", "value", "updatedAt")
VALUES ('default_currency', 'INR', NOW()), ('ecb_auto_update', 'false', NOW())
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value", "updatedAt" = NOW();

-- Invoice drafts and new invoices use INR as the base and no configured tax.
-- Issued historical invoice amounts and snapshots remain untouched.
UPDATE "Invoice_Settings"
SET "baseCurrency" = 'INR', "defaultTaxRateId" = NULL, "updatedAt" = NOW();
