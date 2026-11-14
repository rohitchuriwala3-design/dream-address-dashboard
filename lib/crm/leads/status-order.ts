import { prismadb } from "@/lib/prisma";

const KEY = "crm_lead_status_order_v1";

export async function getLeadStatusOrder() {
  const row = await prismadb.crm_SystemSettings.findUnique({ where: { key: KEY } });
  if (!row) return [] as string[];
  try {
    const parsed: unknown = JSON.parse(row.value);
    return Array.isArray(parsed) ? Array.from(new Set(parsed.filter((item): item is string => typeof item === "string"))) : [];
  } catch { return []; }
}

export async function saveLeadStatusOrder(value: unknown) {
  const order = Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string"))) : [];
  await prismadb.crm_SystemSettings.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(order) },
    update: { value: JSON.stringify(order) },
  });
  return order;
}
