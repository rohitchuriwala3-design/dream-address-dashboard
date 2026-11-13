import { prismadb } from "@/lib/prisma";
import { junctionTableHelpers } from "@/lib/junction-helpers";
import {
  requirePermission,
  boardReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getBoards = async (_userId?: string) => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  const data = await prismadb.boards.findMany({
    where: boardReadScopeWhere(user),
    include: {
      assigned_user: {
        select: {
          name: true,
        },
      },
      // Include watchers through BoardWatchers junction table
      ...junctionTableHelpers.includeWatchersWithUsers(),
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  return data;
};
