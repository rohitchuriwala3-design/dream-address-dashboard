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
export type LeadCustomField = { key: string; label: string; type: "text" | "number" | "date" | "select" | "checkbox"; options?: string[]; required: boolean; hidden: boolean };
export type LeadFieldSettings = { hidden: ConfigurableLeadField[]; required: ConfigurableLeadField[]; customFields: LeadCustomField[] };

export function sanitizeLeadCustomFields(value: unknown): LeadCustomField[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (seen.size >= 20) return [];
    if (!item || typeof item !== "object") return [];
    const raw = item as Record<string, unknown>;
    const key = typeof raw.key === "string" ? raw.key : "";
    const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 60) : "";
    const type = raw.type;
    if (!/^[a-z][a-z0-9_]{1,39}$/.test(key) || !label || seen.has(key) || !["text", "number", "date", "select", "checkbox"].includes(String(type))) return [];
    const options = type === "select" && Array.isArray(raw.options)
      ? Array.from(new Set(raw.options.filter((option): option is string => typeof option === "string").map((option) => option.trim().slice(0, 50)).filter(Boolean))).slice(0, 30)
      : undefined;
    if (type === "select" && !options?.length) return [];
    seen.add(key);
    const hidden = raw.hidden === true;
    return [{ key, label, type: type as LeadCustomField["type"], ...(options ? { options } : {}), required: !hidden && raw.required === true, hidden }];
  });
}

export function sanitizeLeadFieldSettings(value: unknown): LeadFieldSettings {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const allowed = new Set<string>(CONFIGURABLE_LEAD_FIELDS.map((field) => field.key));
  const clean = (list: unknown) => Array.isArray(list)
    ? Array.from(new Set(list.filter((item): item is ConfigurableLeadField => typeof item === "string" && allowed.has(item))))
    : [];
  const hidden = clean(input.hidden);
  return { hidden, required: clean(input.required).filter((key) => !hidden.includes(key)), customFields: sanitizeLeadCustomFields(input.customFields) };
}
