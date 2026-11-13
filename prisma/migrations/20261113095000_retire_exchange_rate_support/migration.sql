-- MARK IV V1 does not use currency conversion. The preceding INR-only
-- migration clears the rate table; remove its unused schema and setting.
DROP TABLE IF EXISTS "ExchangeRate";
DROP TYPE IF EXISTS "ExchangeRateSource";
DELETE FROM "crm_SystemSettings" WHERE "key" = 'ecb_auto_update';
