"use server";

import { requirePermission } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { getLeadFieldSettings } from "@/lib/crm/leads/field-settings";
import { getLeadStatusOrder } from "@/lib/crm/leads/status-order";

export async function getLeadFormOptions() {
  await requirePermission("crm.view", { partner: true });
  const [leadSources, rawLeadStatuses, leadTypes, leadFieldSettings, statusOrder] = await Promise.all([
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
    getLeadFieldSettings(),
    getLeadStatusOrder(),
  ]);
  const orderIndex = new Map(statusOrder.map((id, index) => [id, index]));
  const leadStatuses = rawLeadStatuses.sort((left, right) => {
    const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex || left.name.localeCompare(right.name);
  });
  return { leadSources, leadStatuses, leadTypes, leadFieldSettings };
}
