ALTER TABLE "Invoices"
  ADD COLUMN "bankAccountHolder" TEXT,
  ADD COLUMN "bankIfsc" TEXT;

ALTER TABLE "Invoice_Settings"
  ADD COLUMN "bankAccountHolder" TEXT,
  ADD COLUMN "bankIfsc" TEXT;
