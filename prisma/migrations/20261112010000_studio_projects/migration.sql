CREATE TYPE "StudioProjectStatus" AS ENUM (
  'PLANNING', 'DESIGN', 'PROCUREMENT', 'EXECUTION', 'HANDOVER', 'COMPLETED', 'ON_HOLD', 'CANCELLED'
);

CREATE TABLE "StudioProject" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accountId" UUID NOT NULL,
  "opportunityId" UUID,
  "status" "StudioProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "siteAddress" TEXT,
  "floorAreaSqFt" DECIMAL(12,2),
  "scopeOfWork" TEXT,
  "contractValue" DECIMAL(18,2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "startDate" TIMESTAMP(3),
  "targetHandoverDate" TIMESTAMP(3),
  "actualHandoverDate" TIMESTAMP(3),
  "projectManagerId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" UUID NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" UUID,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" UUID,
  CONSTRAINT "StudioProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudioProject_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "crm_Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StudioProject_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "crm_Opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "StudioProjectMilestone" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "amount" DECIMAL(18,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" UUID NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioProjectMilestone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudioProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StudioProject_code_key" ON "StudioProject"("code");
CREATE UNIQUE INDEX "StudioProject_opportunityId_key" ON "StudioProject"("opportunityId");
CREATE INDEX "StudioProject_accountId_status_idx" ON "StudioProject"("accountId", "status");
CREATE INDEX "StudioProject_status_targetHandoverDate_idx" ON "StudioProject"("status", "targetHandoverDate");
CREATE INDEX "StudioProject_projectManagerId_idx" ON "StudioProject"("projectManagerId");
CREATE INDEX "StudioProject_deletedAt_idx" ON "StudioProject"("deletedAt");
CREATE INDEX "StudioProjectMilestone_projectId_sortOrder_idx" ON "StudioProjectMilestone"("projectId", "sortOrder");
CREATE INDEX "StudioProjectMilestone_dueDate_idx" ON "StudioProjectMilestone"("dueDate");
