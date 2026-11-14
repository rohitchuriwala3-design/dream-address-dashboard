export const CONFIGURABLE_LEAD_FIELDS = [
  { key: "company", label: "Company / client" },
  { key: "jobTitle", label: "Job title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "description", label: "Enquiry details" },
  { key: "lead_source_id", label: "Lead source" },
  { key: "refered_by", label: "Referred by" },
  { key: "lead_status_id", label: "Lead status" },
  { key: "lead_type_id", label: "Lead type" },
  { key: "campaign", label: "Campaign" },
] as const;

export type ConfigurableLeadField = (typeof CONFIGURABLE_LEAD_FIELDS)[number]["key"];
export type LeadFieldSettings = { hidden: ConfigurableLeadField[]; required: ConfigurableLeadField[] };

export function sanitizeLeadFieldSettings(value: unknown): LeadFieldSettings {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const allowed = new Set<string>(CONFIGURABLE_LEAD_FIELDS.map((field) => field.key));
  const clean = (list: unknown) => Array.isArray(list)
    ? Array.from(new Set(list.filter((item): item is ConfigurableLeadField => typeof item === "string" && allowed.has(item))))
    : [];
  const hidden = clean(input.hidden);
  return { hidden, required: clean(input.required).filter((key) => !hidden.includes(key)) };
}
