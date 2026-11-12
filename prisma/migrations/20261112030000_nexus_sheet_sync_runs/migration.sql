CREATE TABLE "NexusSheetSyncRun" (
  "id" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'READ_ONLY_AUDIT',
  "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "tabsScanned" INTEGER NOT NULL DEFAULT 0,
  "rowsScanned" INTEGER NOT NULL DEFAULT 0,
  "issueCount" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,
  "error" TEXT,
  CONSTRAINT "NexusSheetSyncRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NexusSheetSyncRun_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "NexusSheetSyncRun_startedAt_idx" ON "NexusSheetSyncRun"("startedAt");
CREATE INDEX "NexusSheetSyncRun_actorId_startedAt_idx" ON "NexusSheetSyncRun"("actorId", "startedAt");
CREATE INDEX "NexusSheetSyncRun_status_startedAt_idx" ON "NexusSheetSyncRun"("status", "startedAt");
