"use server";

import { requirePermission } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { getLeadFieldSettings } from "@/lib/crm/leads/field-settings";

export async function getLeadFormOptions() {
  await requirePermission("crm.view", { partner: true });
  const [leadSources, leadStatuses, leadTypes, leadFieldSettings] = await Promise.all([
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
    getLeadFieldSettings(),
  ]);
  return { leadSources, leadStatuses, leadTypes, leadFieldSettings };
}
