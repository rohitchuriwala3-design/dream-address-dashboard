import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { crmTaskReadScopeWhere } from "@/lib/authz/scopes/crm";

export const getUserCRMTasks = async (userId: string) => {
  let user;
  try {
    user = await requirePermission('crm.view');
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  const data = await prismadb.crm_Accounts_Tasks.findMany({
    where: {
      user: userId,
      ...crmTaskReadScopeWhere(user),
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
};
