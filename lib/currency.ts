import { prismadb } from "@/lib/prisma";

// Re-export pure functions so existing server-side imports still work
export { formatCurrency } from "@/lib/currency-format";

export async function getEnabledCurrencies() {
  return prismadb.currency.findMany({ where: { isEnabled: true, isDefault: true, code: "INR" } });
}
