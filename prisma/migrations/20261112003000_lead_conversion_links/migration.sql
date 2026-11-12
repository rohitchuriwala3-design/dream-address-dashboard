-- Record the output of an atomic lead conversion for safe retries and auditability.
ALTER TABLE "crm_Leads"
  ADD COLUMN "convertedAt" TIMESTAMP(3),
  ADD COLUMN "convertedAccountId" UUID,
  ADD COLUMN "convertedContactId" UUID,
  ADD COLUMN "convertedOpportunityId" UUID;

CREATE UNIQUE INDEX "crm_Leads_convertedOpportunityId_key"
  ON "crm_Leads"("convertedOpportunityId");

CREATE INDEX "crm_Leads_convertedAccountId_idx"
  ON "crm_Leads"("convertedAccountId");
