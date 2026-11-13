import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  boardReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getSections = async () => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.sections.findMany({
    where: {
      board_relation: boardReadScopeWhere(user),
    },
  });

  return data;
};
