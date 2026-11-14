-- Distinguish won and lost commercial outcomes from the existing generic status.
ALTER TYPE "crm_Opportunity_Status" ADD VALUE IF NOT EXISTS 'WON';
ALTER TYPE "crm_Opportunity_Status" ADD VALUE IF NOT EXISTS 'LOST';

-- Keep a qualified prospect opportunity linked to its source lead before a
-- customer account exists. Preserve provenance for records converted earlier.
ALTER TABLE "crm_Opportunities"
  ADD COLUMN "sourceLeadId" UUID,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closedBy" UUID,
  ADD COLUMN "outcomeNote" TEXT;

UPDATE "crm_Opportunities" AS opportunity
SET "sourceLeadId" = lead."id"
FROM "crm_Leads" AS lead
WHERE lead."convertedOpportunityId" = opportunity."id"
  AND opportunity."sourceLeadId" IS NULL;

CREATE UNIQUE INDEX "crm_Opportunities_sourceLeadId_key"
  ON "crm_Opportunities"("sourceLeadId");

ALTER TABLE "crm_Opportunities"
  ADD CONSTRAINT "crm_Opportunities_sourceLeadId_fkey"
  FOREIGN KEY ("sourceLeadId") REFERENCES "crm_Leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
