import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, type AuthzUser } from "./session";
import { AuthorizationError } from "./errors";

export const NEXUS_PERMISSIONS = [
  { key: "dashboard.view", label: "Overview", description: "View dashboards and summaries" },
  { key: "crm.view", label: "CRM", description: "View leads, contacts, accounts and opportunities" },
  { key: "crm.manage", label: "Manage CRM", description: "Create and update CRM records" },
  { key: "projects.view", label: "Projects", description: "View projects, milestones and delivery" },
  { key: "projects.manage", label: "Manage projects", description: "Create and update project delivery" },
  { key: "finance.view", label: "Finance", description: "View invoices, expenses and treasury" },
  { key: "finance.manage", label: "Manage finance", description: "Create and update financial records" },
  { key: "reports.view", label: "Analytics and reports", description: "View reports and performance analytics" },
  { key: "sheets.audit", label: "Sheet audit", description: "Review spreadsheet connection and data quality" },
] as const;

export type NexusPermission = (typeof NEXUS_PERMISSIONS)[number]["key"];
const validKeys = new Set<string>(NEXUS_PERMISSIONS.map(({ key }) => key));

export function parseNexusPermissions(value: unknown): NexusPermission[] | null {
  if (!Array.isArray(value) || value.some((key) => typeof key !== "string" || !validKeys.has(key))) return null;
  return [...new Set(value)] as NexusPermission[];
}

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
