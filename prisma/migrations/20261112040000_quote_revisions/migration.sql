CREATE TABLE "OpportunityQuoteRevision" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "snapshot" JSONB NOT NULL,
    "submittedBy" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "reopenReason" TEXT,
    CONSTRAINT "OpportunityQuoteRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OpportunityQuoteRevision_opportunityId_fkey"
      FOREIGN KEY ("opportunityId") REFERENCES "crm_Opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OpportunityQuoteRevision_opportunityId_revisionNo_key"
  ON "OpportunityQuoteRevision"("opportunityId", "revisionNo");
CREATE INDEX "OpportunityQuoteRevision_opportunityId_submittedAt_idx"
  ON "OpportunityQuoteRevision"("opportunityId", "submittedAt");
CREATE INDEX "OpportunityQuoteRevision_status_idx"
  ON "OpportunityQuoteRevision"("status");
