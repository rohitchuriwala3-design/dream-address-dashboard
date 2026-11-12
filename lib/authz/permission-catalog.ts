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
  return Array.from(new Set(value)) as NexusPermission[];
}
