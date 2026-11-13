import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadContact,
  opportunityReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getOpportunitiesFullByContactId = async (contactId: string) => {
  let user;
  try {
    user = await requirePermission("crm.view", { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  try {
    // Verify access to the parent contact first; return [] on miss to avoid
    // existence leaks of contacts the caller cannot read.
    await assertCanReadContact(user, contactId);
  } catch (e) {
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // Defense in depth: scope the opportunity list by ownership rules even
  // when the caller has access to the linked contact.
  const data = await prismadb.crm_Opportunities.findMany({
    where: { contacts: { some: { contact_id: contactId } }, ...opportunityReadScopeWhere(user), AND: [{ currency: "INR" }] },
    include: {
      assigned_account: {
        select: {
          name: true,
        },
      },
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return data;
};
