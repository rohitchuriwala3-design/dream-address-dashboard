import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  leadReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getLeads = cache(async () => {
  let user;
  try {
    user = await requirePermission("crm.view", { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.crm_Leads.findMany({
    where: { ...leadReadScopeWhere(user) },
    include: {
      lead_status: { select: { name: true } },
      lead_source: { select: { name: true } },
      // Include assigned user (uses "LeadAssignedTo" relation)
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      preClosureOpportunity: {
        select: {
          status: true,
          budget: true,
          expected_revenue: true,
          next_step: true,
          next_step_due_at: true,
          assigned_sales_stage: { select: { name: true, probability: true } },
        },
      },
      // Include documents through DocumentsToLeads junction table
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const emptySummary = data.map((lead) => ({ ...lead, nextFollowUp: null, followUpOverdueCount: 0, followUpUpcomingCount: 0 }));
  if (!data.length) return data;

  try {
    const links = await (prismadb as any).crm_ActivityLinks.findMany({
      where: { entityType: "lead", entityId: { in: data.map((lead) => lead.id) } },
      select: { entityId: true, activityId: true },
    }) as Array<{ entityId: string; activityId: string }>;
    const activityIds = Array.from(new Set(links.map((link) => link.activityId)));
    if (!activityIds.length) return emptySummary;

    const activities = await (prismadb as any).crm_Activities.findMany({
      where: { id: { in: activityIds }, status: "scheduled", deletedAt: null },
      select: { id: true, title: true, date: true, status: true },
      orderBy: { date: "asc" },
    }) as Array<{ id: string; title: string; date: Date; status: "scheduled" }>;
    const activityById = new Map(activities.map((activity) => [activity.id, activity]));
    const linksByLead = new Map<string, Array<{ id: string; title: string; date: Date; status: "scheduled" }>>();
    for (const link of links) {
      const activity = activityById.get(link.activityId);
      if (!activity) continue;
      const current = linksByLead.get(link.entityId) ?? [];
      current.push(activity);
      linksByLead.set(link.entityId, current);
    }

    const now = Date.now();
    return data.map((lead) => {
      const scheduled = linksByLead.get(lead.id) ?? [];
      const overdue = scheduled.filter((activity) => new Date(activity.date).getTime() < now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const upcoming = scheduled.filter((activity) => new Date(activity.date).getTime() >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return {
        ...lead,
        nextFollowUp: overdue[0] ?? upcoming[0] ?? null,
        followUpOverdueCount: overdue.length,
        followUpUpcomingCount: upcoming.length,
      };
    });
  } catch (error) {
    console.error("getLeads follow-up summary error:", error);
    return emptySummary;
  }
});
