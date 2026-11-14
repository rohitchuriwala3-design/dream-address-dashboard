import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadLead,
  assertCanReadAccount,
  assertCanReadOpportunity,
  AuthorizationError,
  AuthenticationError,
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
          quoteRevisions: {
            orderBy: { revisionNo: "desc" },
            take: 5,
            select: { id: true, revisionNo: true, status: true, snapshot: true, submittedAt: true, reviewNote: true, reopenReason: true },
          },
        },
      },
    },
  });
  if (!data) return null;

  const canReadLinkedRecord = async (check: () => Promise<void>) => {
    try { await check(); return true; }
    catch (error) { if (error instanceof AuthorizationError) return false; throw error; }
  };
  const [accountVisible, opportunityVisible] = await Promise.all([
    data.assigned_accounts ? canReadLinkedRecord(() => assertCanReadAccount(user, data.assigned_accounts!.id)) : Promise.resolve(false),
    data.preClosureOpportunity ? canReadLinkedRecord(() => assertCanReadOpportunity(user, data.preClosureOpportunity!.id)) : Promise.resolve(false),
  ]);
  return data
    ? {
        ...data,
        assigned_accounts: accountVisible ? data.assigned_accounts : null,
        preClosureOpportunity: opportunityVisible && data.preClosureOpportunity
          ? {
              ...data.preClosureOpportunity,
              budget: data.preClosureOpportunity.budget.toString(),
              expected_revenue: data.preClosureOpportunity.expected_revenue.toString(),
            }
          : null,
      }
    : null;
};
