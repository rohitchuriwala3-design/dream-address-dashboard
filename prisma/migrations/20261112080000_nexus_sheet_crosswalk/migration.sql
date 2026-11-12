CREATE TABLE "NexusSheetCrosswalk" (
  "id" UUID NOT NULL,
  "spreadsheetId" VARCHAR(128) NOT NULL,
  "sheetTab" VARCHAR(80) NOT NULL,
  "sheetKey" VARCHAR(200) NOT NULL,
  "entityType" VARCHAR(40) NOT NULL,
  "appRecordId" UUID NOT NULL,
  "note" VARCHAR(500),
  "createdBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NexusSheetCrosswalk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NexusSheetCrosswalk_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NexusSheetCrosswalk_spreadsheetId_sheetTab_sheetKey_key" ON "NexusSheetCrosswalk"("spreadsheetId", "sheetTab", "sheetKey");
CREATE UNIQUE INDEX "NexusSheetCrosswalk_entityType_appRecordId_key" ON "NexusSheetCrosswalk"("entityType", "appRecordId");
CREATE INDEX "NexusSheetCrosswalk_sheetTab_sheetKey_idx" ON "NexusSheetCrosswalk"("sheetTab", "sheetKey");
CREATE INDEX "NexusSheetCrosswalk_createdBy_createdAt_idx" ON "NexusSheetCrosswalk"("createdBy", "createdAt");
