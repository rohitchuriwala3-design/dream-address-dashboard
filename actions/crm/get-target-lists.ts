"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  targetListReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getTargetLists = async () => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const targetLists = await prismadb.crm_TargetLists.findMany({
    where: { ...targetListReadScopeWhere(user) },
    orderBy: { created_on: "desc" },
    include: {
      crate_by_user: { select: { name: true } },
      _count: { select: { targets: true } },
    },
  });
  return targetLists;
};
