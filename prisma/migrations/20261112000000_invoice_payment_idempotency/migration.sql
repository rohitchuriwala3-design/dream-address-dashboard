-- Give each payment request a stable retry key and backfill existing ledger rows.
ALTER TABLE "Invoice_Payments" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "Invoice_Payments" SET "idempotencyKey" = gen_random_uuid()::text WHERE "idempotencyKey" IS NULL;
ALTER TABLE "Invoice_Payments" ALTER COLUMN "idempotencyKey" SET NOT NULL;
CREATE UNIQUE INDEX "Invoice_Payments_idempotencyKey_key" ON "Invoice_Payments"("idempotencyKey");
