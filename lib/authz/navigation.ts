import type { NexusPermission } from "./permission-catalog";

export type NavigationModule =
  | "dashboard"
  | "crm"
  | "projects"
  | "finance"
  | "reports"
  | "documents"
  | "emails"
  | "plugins";

const CRM_PERMISSIONS: readonly NexusPermission[] = ["crm.view", "crm.manage"];
const PROJECT_PERMISSIONS: readonly NexusPermission[] = ["projects.view", "projects.manage"];

export function canSeeNavigationModule(
  role: string | null | undefined,
  permissions: readonly NexusPermission[],
  module: NavigationModule,
): boolean {
  if (role === "admin" || role === "partner") return true;

  switch (module) {
    case "dashboard":
      return permissions.includes("dashboard.view");
    case "crm":
      return CRM_PERMISSIONS.some((permission) => permissions.includes(permission));
    case "projects":
      return PROJECT_PERMISSIONS.some((permission) => permissions.includes(permission));
    case "finance":
      return permissions.includes("finance.view") || permissions.includes("finance.manage");
    case "reports":
      return permissions.includes("reports.view") || permissions.includes("reports.manage");
    case "documents":
      return [...CRM_PERMISSIONS, ...PROJECT_PERMISSIONS].some((permission) => permissions.includes(permission));
    // These surfaces have no staff-level permission key yet, so keep them admin-only.
    case "emails":
    case "plugins":
      return false;
  }
}
