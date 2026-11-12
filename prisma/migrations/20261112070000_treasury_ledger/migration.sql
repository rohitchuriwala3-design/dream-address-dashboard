CREATE TYPE "TreasuryTransactionType" AS ENUM ('OPENING_BALANCE', 'TRANSFER', 'MANUAL_INCOME', 'MANUAL_EXPENSE', 'INVOICE_RECEIPT', 'VENDOR_PAYMENT', 'PROJECT_EXPENSE');

CREATE TABLE "TreasuryAccount" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "institution" VARCHAR(120),
  "accountMask" VARCHAR(12),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TreasuryAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TreasuryAccount_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "TreasuryAccount_active_currency_idx" ON "TreasuryAccount"("active", "currency");

CREATE TABLE "TreasuryTransaction" (
  "id" UUID NOT NULL,
  "type" "TreasuryTransactionType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "reference" VARCHAR(160),
  "description" VARCHAR(1000) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "sourceType" VARCHAR(60),
  "sourceId" UUID,
  "idempotencyKey" VARCHAR(200),
  "createdBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TreasuryTransaction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TreasuryTransaction_idempotencyKey_key" ON "TreasuryTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "TreasuryTransaction_sourceType_sourceId_key" ON "TreasuryTransaction"("sourceType", "sourceId");
CREATE INDEX "TreasuryTransaction_occurredAt_type_idx" ON "TreasuryTransaction"("occurredAt", "type");

CREATE TABLE "TreasuryEntry" (
  "id" UUID NOT NULL,
  "transactionId" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  CONSTRAINT "TreasuryEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TreasuryEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "TreasuryTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TreasuryEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TreasuryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TreasuryEntry_transactionId_accountId_key" ON "TreasuryEntry"("transactionId", "accountId");
CREATE INDEX "TreasuryEntry_accountId_transactionId_idx" ON "TreasuryEntry"("accountId", "transactionId");

CREATE TABLE "TreasuryReconciliation" (
  "id" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "statementDate" DATE NOT NULL,
  "statementBalance" DECIMAL(18,2) NOT NULL,
  "ledgerBalance" DECIMAL(18,2) NOT NULL,
  "variance" DECIMAL(18,2) NOT NULL,
  "note" VARCHAR(1000),
  "reconciledBy" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreasuryReconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TreasuryReconciliation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TreasuryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TreasuryReconciliation_reconciledBy_fkey" FOREIGN KEY ("reconciledBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TreasuryReconciliation_accountId_statementDate_key" ON "TreasuryReconciliation"("accountId", "statementDate");
CREATE INDEX "TreasuryReconciliation_statementDate_idx" ON "TreasuryReconciliation"("statementDate");
