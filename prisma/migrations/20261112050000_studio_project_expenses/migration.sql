CREATE TYPE "StudioProjectExpenseStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'VOID');

CREATE TABLE "StudioProjectExpense" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "vendorName" VARCHAR(160),
    "description" VARCHAR(1000) NOT NULL,
    "reference" VARCHAR(120),
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "incurredOn" DATE NOT NULL,
    "status" "StudioProjectExpenseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedBy" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" VARCHAR(1000),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudioProjectExpense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StudioProjectExpense_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StudioProjectExpense_projectId_status_incurredOn_idx"
  ON "StudioProjectExpense"("projectId", "status", "incurredOn");
CREATE INDEX "StudioProjectExpense_status_incurredOn_idx"
  ON "StudioProjectExpense"("status", "incurredOn");
CREATE INDEX "StudioProjectExpense_submittedBy_submittedAt_idx"
  ON "StudioProjectExpense"("submittedBy", "submittedAt");
