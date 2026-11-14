"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { AuthenticationError, AuthorizationError, requireRole } from "@/lib/authz";

export async function setUserOrganization(userId: string, accessLevelId: string, reportsToId: string | null) {
  let actor;
  try { actor = await requireRole(["admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }
  if (!userId || !accessLevelId || userId === reportsToId) return { error: "Choose a designation and a valid reporting manager." };

  try {
    const [target, level] = await Promise.all([
      prismadb.users.findUnique({ where: { id: userId }, select: { id: true, role: true, accessLevelId: true, reportsToId: true } }),
      prismadb.nexusAccessLevel.findFirst({ where: { id: accessLevelId, isActive: true }, select: { id: true, name: true, rank: true } }),
    ]);
    if (!target) return { error: "Profile not found." };
    if (target.role === "partner") return { error: "External partners do not use the internal team hierarchy." };
    if (!level) return { error: "Choose an active designation." };

    let reportsTo: { id: string; name: string | null; accessLevelId: string | null; role: string } | null = null;
    if (reportsToId) {
      reportsTo = await prismadb.users.findUnique({ where: { id: reportsToId }, select: { id: true, name: true, accessLevelId: true, role: true } });
      if (!reportsTo || reportsTo.role === "partner") return { error: "Choose an internal reporting manager." };
      const managerLevel = reportsTo.accessLevelId
        ? await prismadb.nexusAccessLevel.findUnique({ where: { id: reportsTo.accessLevelId }, select: { rank: true } })
        : null;
      if (!managerLevel || managerLevel.rank <= level.rank) return { error: "The reporting manager must have a higher active designation level." };

      const cycle = await prismadb.$queryRaw<Array<{ found: boolean }>>`
        WITH RECURSIVE reporting_chain("id", "reportsToId") AS (
          SELECT "id", "reportsToId" FROM "Users" WHERE "id" = ${reportsToId}::uuid
          UNION
          SELECT parent."id", parent."reportsToId"
          FROM "Users" parent
          INNER JOIN reporting_chain child ON child."reportsToId" = parent."id"
        )
        SELECT EXISTS(SELECT 1 FROM reporting_chain WHERE "id" = ${userId}::uuid) AS found
      `;
      if (cycle[0]?.found) return { error: "This reporting change would create a hierarchy loop." };
    }

    await prismadb.users.update({ where: { id: userId }, data: { accessLevelId, reportsToId } });
    await writeAuditLog({
      entityType: "user", entityId: userId, action: "updated",
      changes: [
        { field: "accessLevelId", old: target.accessLevelId, new: accessLevelId },
        { field: "reportsToId", old: target.reportsToId, new: reportsToId },
      ],
      userId: actor.id,
    });
    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { success: true, designation: level.name, reportsTo: reportsTo?.name ?? null };
  } catch {
    return { error: "Could not save the reporting relationship." };
  }
}
