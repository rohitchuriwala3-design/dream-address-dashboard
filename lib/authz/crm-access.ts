import type { AppRole } from "@/lib/authz/roles";
import type { NexusPermission } from "@/lib/authz/permission-catalog";

/** CRM pages are available to full admins, account-scoped partners, and staff
 * with either CRM view or manage permission. */
export function canAccessCrm(
  role: AppRole | null | undefined,
  permissions: readonly NexusPermission[] = [],
): boolean {
  if (role === "admin" || role === "partner") return true;
  return permissions.includes("crm.view") || permissions.includes("crm.manage");
}
