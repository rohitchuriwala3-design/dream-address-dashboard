import { PrismaClient } from "@prisma/client";

// Stable deterministic UUIDs for idempotent re-runs
const SERIES_ID = "00000000-0000-4000-a000-000000000001";
const SETTINGS_ID = "00000000-0000-4000-a000-000000000002";
export async function seedInvoices(prisma: PrismaClient) {
  console.log("Seeding invoice series...");
  await prisma.invoice_Series.upsert({
    where: { id: SERIES_ID },
    update: { name: "Main", prefixTemplate: "INV-{YYYY}-{####}" },
    create: {
      id: SERIES_ID,
      name: "Main",
      prefixTemplate: "INV-{YYYY}-{####}",
      resetPolicy: "YEARLY",
      counter: 0,
      isDefault: true,
    },
  });

  console.log("Seeding invoice settings...");
  await prisma.invoice_Settings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      baseCurrency: "INR",
      defaultDueDays: 14,
      defaultSeriesId: SERIES_ID,
      defaultTaxRateId: null,
    },
    create: {
      id: SETTINGS_ID,
      baseCurrency: "INR",
      defaultDueDays: 14,
      defaultSeriesId: SERIES_ID,
      defaultTaxRateId: null,
    },
  });

  console.log("Invoice seed data completed.");
}
