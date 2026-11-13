import { PrismaClient } from "@prisma/client";

const currencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", isEnabled: true, isDefault: true },
];

export async function seedCurrencies(prisma: PrismaClient) {
  console.log("Seeding currencies...");

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: { name: currency.name, symbol: currency.symbol, isEnabled: true, isDefault: true },
      create: currency,
    });
  }

  await prisma.currency.updateMany({ where: { code: { not: "INR" } }, data: { isEnabled: false, isDefault: false } });
  await prisma.currency.updateMany({ where: { code: "INR" }, data: { isDefault: true, isEnabled: true } });

  await prisma.crm_SystemSettings.upsert({
    where: { key: "default_currency" },
    update: { value: "INR" },
    create: { key: "default_currency", value: "INR" },
  });

  console.log("Currencies seeded.");
}
