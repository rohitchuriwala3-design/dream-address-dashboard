"use server";

import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export async function getAccountById(accountId: string) {
  let user;
  try {
    user = await requirePermission('crm.view', { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  try {
    await assertCanReadAccount(user, accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  const account = await prismadb.crm_Accounts.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { id: true, name: true },
  });

  return account ?? null;
}
