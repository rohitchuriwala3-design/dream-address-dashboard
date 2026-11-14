"use server";

import { requirePermission } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";

export async function getLeadFormOptions() {
  await requirePermission("crm.view", { partner: true });
  const [leadSources, leadStatuses, leadTypes] = await Promise.all([
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { leadSources, leadStatuses, leadTypes };
}
