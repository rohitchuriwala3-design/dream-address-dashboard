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
  return data;
});
