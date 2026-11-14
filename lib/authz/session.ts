import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { AppRole, mapLegacyRole } from "./roles";

export { isManagerOrAdmin } from "./roles";
import { AuthenticationError, AuthorizationError } from "./errors";

export interface AuthzUser {
  id: string;
  role: AppRole;
  accessLevelId?: string | null;
  accessLevelSlug?: string | null;
  reportsToId?: string | null;
  crmRecordScope?: "OWN" | "ASSIGNED" | "REPORTING_TREE" | "TEAM" | "COMPANY";
  reportingTreeIds?: string[];
}

async function getReportingTreeIds(userId: string): Promise<string[]> {
  // Some isolated unit tests mock only model delegates and omit raw SQL.
  if (typeof prismadb.$queryRaw !== "function") return [];
  const rows = await prismadb.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE reporting_tree("id") AS (
      SELECT "id" FROM "Users" WHERE "reportsToId" = ${userId}::uuid
      UNION
      SELECT child."id"
      FROM "Users" child
      INNER JOIN reporting_tree parent ON child."reportsToId" = parent."id"
    )
    SELECT "id"::text AS "id" FROM reporting_tree WHERE "id" <> ${userId}::uuid
  `;
  return rows.map(({ id }) => id);
}

/**
 * The signed-in user. Refuses a partner unless the caller opts in with
 * { partner: true } (deny by default, partner-role spec ticket 4).
 */
export async function requireAuthenticated(opts?: { partner?: boolean }): Promise<AuthzUser> {
  const session = await getSession(opts);
  const userId = session?.user?.id;
  if (!userId) throw new AuthenticationError();

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      accessLevelId: true,
      reportsToId: true,
      accessLevel: {
        select: {
          slug: true,
          permissions: {
            where: { key: { in: ["crm.view", "crm.manage"] } },
            select: { key: true, scope: true },
          },
        },
      },
      permissions: {
        where: { key: { in: ["crm.view", "crm.manage"] } },
        select: { key: true, scope: true },
      },
    },
  });
  if (!dbUser) throw new AuthenticationError();
  if (dbUser.role === "partner" && !opts?.partner) throw new AuthenticationError();

  const levelSlug = dbUser.accessLevel?.slug ?? null;
  const levelCrmScope = dbUser.accessLevel?.permissions?.find(({ key }) => key === "crm.view" || key === "crm.manage")?.scope;
  const companyWide = levelSlug === "founder" || levelSlug === "administrator" || dbUser.role === "admin";
  const fallbackScope =
    levelSlug === "manager" || levelSlug === "senior-manager" || (!levelSlug && dbUser.role === "manager")
      ? "REPORTING_TREE"
      : "ASSIGNED";
  // Module grants decide whether CRM is available; designation/reporting decides
  // record visibility. Per-user grant rows currently default to ASSIGNED and
  // must not accidentally override a Manager's reporting-tree access.
  const crmRecordScope = (companyWide ? "COMPANY" : levelCrmScope ?? fallbackScope) as AuthzUser["crmRecordScope"];
  const reportingTreeIds =
    crmRecordScope === "REPORTING_TREE" || crmRecordScope === "TEAM"
      ? await getReportingTreeIds(dbUser.id)
      : [];

  return {
    id: dbUser.id,
    role: mapLegacyRole(dbUser.role),
    accessLevelId: dbUser.accessLevelId,
    accessLevelSlug: levelSlug,
    reportsToId: dbUser.reportsToId,
    crmRecordScope,
    reportingTreeIds,
  };
}

export async function requireRole(
  allowedRoles: ReadonlyArray<AppRole>
): Promise<AuthzUser> {
  const user = await requireAuthenticated();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError();
  }
  return user;
}

export function isAdmin(user: AuthzUser): boolean {
  return user.role === "admin";
}
