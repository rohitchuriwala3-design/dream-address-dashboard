ALTER TABLE "NexusSheetCrosswalk"
  ADD COLUMN "syncStatus" VARCHAR(24) NOT NULL DEFAULT 'UNSYNCED',
  ADD COLUMN "baseline" JSONB,
  ADD COLUMN "lastAppHash" VARCHAR(64),
  ADD COLUMN "lastSheetHash" VARCHAR(64),
  ADD COLUMN "conflictFields" JSONB,
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "lastSyncError" VARCHAR(1000);

CREATE INDEX "NexusSheetCrosswalk_syncStatus_updatedAt_idx"
  ON "NexusSheetCrosswalk"("syncStatus", "updatedAt");
