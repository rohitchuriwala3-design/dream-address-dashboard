import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadBoard,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getBoardSections = async (boadId: string) => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  try {
    await assertCanReadBoard(user, boadId);
  } catch (e) {
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.sections.findMany({
    where: {
      board: boadId,
    },
  });

  return data;
};
