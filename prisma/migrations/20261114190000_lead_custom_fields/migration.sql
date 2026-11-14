ALTER TABLE "crm_Leads"
ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}'::jsonb;
