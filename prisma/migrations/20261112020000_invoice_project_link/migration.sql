ALTER TABLE "Invoices"
ADD COLUMN "studioProjectId" UUID;

CREATE INDEX "Invoices_studioProjectId_idx" ON "Invoices"("studioProjectId");

ALTER TABLE "Invoices"
ADD CONSTRAINT "Invoices_studioProjectId_fkey"
FOREIGN KEY ("studioProjectId") REFERENCES "StudioProject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
