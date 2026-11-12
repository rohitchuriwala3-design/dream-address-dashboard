import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, type AuthzUser } from "./session";
import { AuthorizationError } from "./errors";
import { type NexusPermission } from "./permission-catalog";

export { parseNexusPermissions } from "./permission-catalog";

export async function getUserPermissions(userId: string): Promise<NexusPermission[]> {
  const rows = await prismadb.nexusUserPermission.findMany({ where: { userId }, select: { key: true } });
  return rows.map(({ key }) => key).filter((key): key is NexusPermission => validKeys.has(key));
}

export async function requirePermission(permission: NexusPermission): Promise<AuthzUser> {
  const user = await requireAuthenticated();
  if (user.role === "admin") return user;
  const permissions = await getUserPermissions(user.id);
  const implies: Partial<Record<NexusPermission, NexusPermission>> = {
    "crm.manage": "crm.view",
    "projects.manage": "projects.view",
    "finance.manage": "finance.view",
  };
  if (!permissions.includes(permission) && (!implies[permission] || !permissions.includes(implies[permission]!))) {
    throw new AuthorizationError();
  }
  return user;
}
