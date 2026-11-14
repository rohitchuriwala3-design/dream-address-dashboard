import { prismadb } from "@/lib/prisma";

const KEY = "crm_lead_status_order_v1";

export type LeadStatusItem = { id: string; name: string };

function defaultStatusRank(name: string) {
  const value = name.toLocaleLowerCase();
  if (/\bnew\b|enquir|inquir/.test(value)) return 0;
  if (/contact/.test(value)) return 1;
  if (/qualif/.test(value)) return 2;
  if (/lost|disqualif|drop/.test(value)) return 4;
  return 3;
}

/** Keep a useful default funnel when an admin has not saved a custom display order. */
export function orderLeadStatuses(statuses: LeadStatusItem[], configuredOrder: string[]) {
  const orderIndex = new Map(configuredOrder.map((id, index) => [id, index]));
  return [...statuses].sort((left, right) => {
    const leftConfigured = orderIndex.get(left.id);
    const rightConfigured = orderIndex.get(right.id);
    if (leftConfigured !== undefined || rightConfigured !== undefined) {
      const leftIndex = leftConfigured ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = rightConfigured ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }
    const rankDifference = defaultStatusRank(left.name) - defaultStatusRank(right.name);
    return rankDifference || left.name.localeCompare(right.name);
  });
}

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
