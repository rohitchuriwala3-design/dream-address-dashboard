import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  accountReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getAccountsByOpportunityId = async (opportunityId: string) => {
  let user;
  try {
    user = await requirePermission('crm.view', { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  const data = await prismadb.crm_Accounts.findMany({
    where: {
      ...accountReadScopeWhere(user),
      opportunities: {
        some: {
          id: opportunityId,
        },
      },
    },
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
