import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  contactReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getContacts = cache(async () => {
  let user;
  try {
    user = await requirePermission('crm.view', { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.crm_Contacts.findMany({
    where: { ...contactReadScopeWhere(user) },
    include: {
      // Include assigned user (uses "assigned_contacts" relation)
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      // Include creator user (uses "created_contacts" relation)
      crate_by_user: {
        select: {
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      // Include opportunities through ContactsToOpportunities junction table
      opportunities: {
        include: {
          opportunity: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      // Include documents through DocumentsToContacts junction table
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
  });
  return data;
});
