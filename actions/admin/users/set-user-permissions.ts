"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { AuthenticationError, AuthorizationError, requireRole } from "@/lib/authz";
import { parseNexusPermissions } from "@/lib/authz/permissions";

export async function setUserPermissions(userId: string, requested: string[]) {
  let actor;
  try { actor = await requireRole(["admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }
  if (!userId) return { error: "A profile is required." };
  const permissions = parseNexusPermissions(requested);
  if (!permissions) return { error: "Choose only valid profile permissions." };
  if (userId === actor.id) return { error: "Your administrator access is managed through your role." };
  try {
    const before = await prismadb.nexusUserPermission.findMany({ where: { userId }, select: { key: true } });
    if (!await prismadb.users.findUnique({ where: { id: userId }, select: { id: true } })) return { error: "Profile not found." };
    await prismadb.$transaction([
      prismadb.nexusUserPermission.deleteMany({ where: { userId } }),
      ...(permissions.length ? [prismadb.nexusUserPermission.createMany({ data: permissions.map((key) => ({ userId, key })) })] : []),
    ]);
    const previous = before.map(({ key }) => key).sort();
    const next = [...permissions].sort();
    await writeAuditLog({
      entityType: "user", entityId: userId, action: "updated",
      changes: [{ field: "permissions", old: previous, new: next }], userId: actor.id,
    });
    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { success: true };
  } catch {
    return { error: "Could not update profile permissions." };
  }
}
