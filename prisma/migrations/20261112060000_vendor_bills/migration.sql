CREATE TYPE "VendorBillStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'VOID');

CREATE TABLE "VendorBill" (
    "id" UUID NOT NULL,
    "vendorAccountId" UUID NOT NULL,
    "projectId" UUID,
    "vendorInvoiceNumber" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "VendorBillStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedBy" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" VARCHAR(1000),
    "paymentReference" VARCHAR(160),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VendorBill_vendorAccountId_fkey"
      FOREIGN KEY ("vendorAccountId") REFERENCES "crm_Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VendorBill_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VendorBill_vendorAccountId_vendorInvoiceNumber_key"
  ON "VendorBill"("vendorAccountId", "vendorInvoiceNumber");
CREATE INDEX "VendorBill_status_dueDate_idx" ON "VendorBill"("status", "dueDate");
CREATE INDEX "VendorBill_projectId_status_idx" ON "VendorBill"("projectId", "status");
CREATE INDEX "VendorBill_vendorAccountId_invoiceDate_idx" ON "VendorBill"("vendorAccountId", "invoiceDate");
