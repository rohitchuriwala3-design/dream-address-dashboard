ALTER TABLE "crm_Opportunities"
ADD COLUMN IF NOT EXISTS "customFields" JSONB NOT NULL DEFAULT '{}'::jsonb;
