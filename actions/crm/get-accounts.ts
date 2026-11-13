import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requirePermission, accountReadScopeWhere } from "@/lib/authz";

export const getAccounts = cache(async () => {
  const user = await requirePermission('crm.view', { partner: true });
  const data = await prismadb.crm_Accounts.findMany({
    where: accountReadScopeWhere(user),
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
      // Watchers relationship through AccountWatchers junction table
      watchers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
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
