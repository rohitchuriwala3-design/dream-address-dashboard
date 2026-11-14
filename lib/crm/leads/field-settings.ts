import { prismadb } from "@/lib/prisma";
import { LeadError } from "./types";
import { CONFIGURABLE_LEAD_FIELDS, sanitizeLeadFieldSettings, type LeadFieldSettings } from "./field-settings-shared";
export { CONFIGURABLE_LEAD_FIELDS, sanitizeLeadFieldSettings } from "./field-settings-shared";
export type { ConfigurableLeadField, LeadFieldSettings } from "./field-settings-shared";
const KEY = "crm_lead_field_settings_v1";

export async function getLeadFieldSettings(): Promise<LeadFieldSettings> {
  const row = await prismadb.crm_SystemSettings.findUnique({ where: { key: KEY } });
  if (!row) return { hidden: [], required: [] };
  try { return sanitizeLeadFieldSettings(JSON.parse(row.value)); }
  catch { return { hidden: [], required: [] }; }
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
  const missing = settings.required.filter((key) => {
    const value = (input as Record<string, unknown>)[key];
    return value == null || String(value).trim() === "";
  });
  if (missing.length) {
    const labels = new Map(CONFIGURABLE_LEAD_FIELDS.map((field) => [field.key, field.label]));
    throw new LeadError("invalidInput", `Required lead information is missing: ${missing.map((key) => labels.get(key)).join(", ")}`);
  }
}
