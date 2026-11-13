import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, type AuthzUser } from "./session";
import { AuthorizationError } from "./errors";
import { NEXUS_PERMISSIONS, type NexusPermission } from "./permission-catalog";

export { parseNexusPermissions } from "./permission-catalog";
const validKeys = new Set<string>(NEXUS_PERMISSIONS.map(({ key }) => key));

export async function getUserPermissions(userId: string): Promise<NexusPermission[]> {
  const rows = await prismadb.nexusUserPermission.findMany({ where: { userId }, select: { key: true } });
  return rows.map(({ key }) => key).filter((key): key is NexusPermission => validKeys.has(key));
}

export async function requirePermission(
  permission: NexusPermission,
  options?: { partner?: boolean },
): Promise<AuthzUser> {
  const user = await requireAuthenticated(options);
  // Partner access is governed by the existing account/record scope checks in
  // each action. This preserves that restricted client-facing role while the
  // module checklist controls internal staff accounts.
  if (user.role === "admin" || (user.role === "partner" && options?.partner === true)) return user;
  const permissions = await getUserPermissions(user.id);
  const impliedBy: Partial<Record<NexusPermission, NexusPermission>> = {
    "crm.view": "crm.manage",
    "projects.view": "projects.manage",
    "finance.view": "finance.manage",
    "reports.view": "reports.manage",
  };
  if (!permissions.includes(permission) && (!impliedBy[permission] || !permissions.includes(impliedBy[permission]!))) {
    throw new AuthorizationError();
  }
  return user;
}

export async function requireAnyPermission(
  permissions: readonly NexusPermission[],
  options?: { partner?: boolean },
): Promise<AuthzUser> {
  if (permissions.length === 0) throw new AuthorizationError();
  const user = await requireAuthenticated(options);
  if (user.role === "admin" || (user.role === "partner" && options?.partner === true)) return user;
  const granted = new Set(await getUserPermissions(user.id));
  const impliedBy: Partial<Record<NexusPermission, NexusPermission>> = {
    "crm.view": "crm.manage",
    "projects.view": "projects.manage",
    "finance.view": "finance.manage",
    "reports.view": "reports.manage",
  };
  if (!permissions.some((permission) => granted.has(permission) || (impliedBy[permission] && granted.has(impliedBy[permission]!)))) {
    throw new AuthorizationError();
  }
  return user;
}
