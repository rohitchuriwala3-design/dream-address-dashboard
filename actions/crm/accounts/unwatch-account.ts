"use server";
import { prismadb } from "@/lib/prisma";
import { junctionTableHelpers } from "@/lib/junction-helpers";
import {
  requirePermission,
  assertCanWriteAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const unwatchAccount = async (accountId: string) => {
  if (!accountId) return { error: "accountId is required" };

  // Symmetric with watchAccount: watcher membership is write-scoped.
  let user;
  try {
    user = await requirePermission('crm.manage');
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }
  try {
    await assertCanWriteAccount(user, accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    await prismadb.crm_Accounts.update({
      where: { id: accountId },
      data: {
        watchers: junctionTableHelpers.removeAccountWatcher(
          accountId,
          user.id
        ),
      },
    });
    return { success: true };
  } catch (error) {
    console.log("[UNWATCH_ACCOUNT]", error);
    return { error: "Failed to unwatch account" };
  }
};
