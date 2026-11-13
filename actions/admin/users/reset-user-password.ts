"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { verifyPassword } from "better-auth/crypto";
import { prismadb } from "@/lib/prisma";
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
    // Better Auth owns credential hashing. Verify against its existing hash
    // before asking Better Auth to hash and save the replacement.
    const credential = await prismadb.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { password: true },
    });
    if (credential?.password && await verifyPassword({ hash: credential.password, password: newPassword })) {
      return { error: "Choose a password you have not used before." };
    }

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
    const errorType = error instanceof Error ? error.name : "UnknownError";
    const statusCode = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
    console.error("[ADMIN_RESET_USER_PASSWORD] Password reset failed.", { errorType, statusCode });
    return { error: "Password reset failed. Please retry or contact support." };
  }
}
