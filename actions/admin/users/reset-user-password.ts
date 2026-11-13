"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import {
  requireRole,
  AuthzUser,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export async function resetUserPassword(userId: string, newPassword: string) {
  let actor: AuthzUser;
  try {
    actor = await requireRole(["admin"]);
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  if (!userId || newPassword.length < 8 || newPassword.length > 128) {
    return { error: "Use a password between 8 and 128 characters." };
  }

  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });
    await writeAuditLog({
      entityType: "user",
      entityId: userId,
      action: "updated",
      changes: [{ field: "password", old: "[redacted]", new: "[reset by admin]" }],
      userId: actor.id,
    });
    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_RESET_USER_PASSWORD] Password reset failed.");
    return { error: "Password reset failed. Please retry or contact support." };
  }
}
