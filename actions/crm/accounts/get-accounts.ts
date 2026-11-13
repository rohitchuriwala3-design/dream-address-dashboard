"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  accountReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getAccounts = async () => {
  try {
    const user = await requirePermission('crm.view', { partner: true });
    const accounts = await prismadb.crm_Accounts.findMany({
      where: accountReadScopeWhere(user),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return { data: accounts };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { error: "Unauthorized" };
    }
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    return { error: "Failed to fetch accounts" };
  }
};
