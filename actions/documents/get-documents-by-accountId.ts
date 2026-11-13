import { prismadb } from "@/lib/prisma";
import {
  requireAnyPermission,
  assertCanReadAccount,
  documentReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getDocumentsByAccountId = async (accountId: string) => {
  let user;
  try {
    user = await requireAnyPermission(["crm.view", "projects.view"], { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  try {
    await assertCanReadAccount(user, accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // Query through DocumentsToAccounts junction table
  const data = await prismadb.documents.findMany({
    where: {
      accounts: {
        some: {
          account_id: accountId,
        },
      },
      ...documentReadScopeWhere(user),
    },
    include: {
      created_by: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assigned_to_user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_created: "desc",
    },
  });
  return data;
};
