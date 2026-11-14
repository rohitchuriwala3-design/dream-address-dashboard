import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadLead,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getLead = async (leadId: string) => {
  let user;
  try {
    user = await requirePermission("crm.view", { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  try {
    await assertCanReadLead(user, leadId);
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  const data = await prismadb.crm_Leads.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
    include: {
      // Include FK relation name fields
      lead_source: { select: { id: true, name: true } },
      lead_status: { select: { id: true, name: true } },
      lead_type:   { select: { id: true, name: true } },
      // Include assigned user (uses "LeadAssignedTo" relation)
      assigned_to_user: {
        select: {
          id: true,
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      // Include documents through DocumentsToLeads junction table
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
              document_type: true,
              document_file_url: true,
              document_file_mimeType: true,
              createdAt: true,
              created_by: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      preClosureOpportunity: {
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          expected_revenue: true,
          next_step: true,
          next_step_due_at: true,
          sales_stage: true,
          assigned_sales_stage: { select: { name: true } },
          _count: { select: { quoteRevisions: true } },
        },
      },
    },
  });
  return data
    ? {
        ...data,
        preClosureOpportunity: data.preClosureOpportunity
          ? {
              ...data.preClosureOpportunity,
              budget: data.preClosureOpportunity.budget.toString(),
              expected_revenue: data.preClosureOpportunity.expected_revenue.toString(),
            }
          : null,
      }
    : null;
};
