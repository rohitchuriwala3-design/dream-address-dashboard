import { prismadb } from "@/lib/prisma";
import { LeadError } from "./types";
import { CONFIGURABLE_LEAD_FIELDS, sanitizeLeadFieldSettings, type LeadFieldSettings } from "./field-settings-shared";
export { CONFIGURABLE_LEAD_FIELDS, sanitizeLeadFieldSettings } from "./field-settings-shared";
export type { ConfigurableLeadField, LeadFieldSettings } from "./field-settings-shared";
const KEY = "crm_lead_field_settings_v1";

export async function getLeadFieldSettings(): Promise<LeadFieldSettings> {
  const settingsTable = prismadb.crm_SystemSettings;
  // The model always exists in the deployed Prisma client. Keep lightweight
  // Prisma test doubles and pre-migration preview environments on safe defaults.
  if (!settingsTable) return { hidden: [], required: [], customFields: [] };
  const row = await settingsTable.findUnique({ where: { key: KEY } });
  if (!row) return { hidden: [], required: [], customFields: [] };
  try { return sanitizeLeadFieldSettings(JSON.parse(row.value)); }
  catch { return { hidden: [], required: [], customFields: [] }; }
}

export async function saveLeadFieldSettings(value: unknown): Promise<LeadFieldSettings> {
  const settings = sanitizeLeadFieldSettings(value);
  await prismadb.crm_SystemSettings.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
  return settings;
}

export async function validateRequiredLeadFields(input: object) {
  const settings = await getLeadFieldSettings();
  const values = input as Record<string, unknown>;
  const missing = settings.required.filter((key) => {
    const value = values[key];
    return value == null || String(value).trim() === "";
  });
  if (missing.length) {
    const labels = new Map(CONFIGURABLE_LEAD_FIELDS.map((field) => [field.key, field.label]));
    throw new LeadError("invalidInput", `Required lead information is missing: ${missing.map((key) => labels.get(key)).join(", ")}`);
  }
  const custom = values.customFields && typeof values.customFields === "object" && !Array.isArray(values.customFields) ? values.customFields as Record<string, unknown> : {};
  const fields = settings.customFields;
  const known = new Set(fields.map((field) => field.key));
  if (Object.keys(custom).some((key) => !known.has(key))) throw new LeadError("invalidInput", "This Lead contains a field that is not configured. Refresh and try again.");
  const clean: Record<string, string | number | boolean> = {};
  const missingCustom: string[] = [];
  for (const field of fields) {
    const value = custom[field.key];
    if (field.required && (value == null || value === "")) missingCustom.push(field.label);
    if (value == null || value === "") continue;
    if (field.type === "checkbox") {
      if (typeof value !== "boolean") throw new LeadError("invalidInput", `${field.label} must be checked or unchecked.`);
      clean[field.key] = value;
    } else if (field.type === "number") {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number)) throw new LeadError("invalidInput", `${field.label} must be a valid number.`);
      clean[field.key] = number;
    } else {
      if (typeof value !== "string" || value.length > 500) throw new LeadError("invalidInput", `${field.label} must be text of 500 characters or fewer.`);
      if (field.type === "select" && !field.options?.includes(value)) throw new LeadError("invalidInput", `Choose a valid option for ${field.label}.`);
      if (field.type === "date" && Number.isNaN(Date.parse(value))) throw new LeadError("invalidInput", `${field.label} must be a valid date.`);
      clean[field.key] = value;
    }
  }
  if (missingCustom.length) throw new LeadError("invalidInput", `Required lead information is missing: ${missingCustom.join(", ")}`);
  values.customFields = clean;
}
