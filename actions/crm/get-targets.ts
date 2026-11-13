"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  targetReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getTargets = async () => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const targets = await prismadb.crm_Targets.findMany({
    where: { ...targetReadScopeWhere(user) },
    orderBy: { created_on: "desc" },
    include: {
      crate_by_user: { select: { name: true } },
      target_lists: { include: { target_list: { select: { id: true, name: true } } } },
    },
  });
  return targets;
};
