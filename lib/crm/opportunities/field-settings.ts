import { prismadb } from "@/lib/prisma";
import { sanitizeLeadCustomFields, type LeadCustomField } from "@/lib/crm/leads/field-settings-shared";

const KEY = "crm_opportunity_custom_fields_v1";
const DEFAULT_CUSTOM_FIELDS: LeadCustomField[] = [
  { key: "project_type", label: "Interiors project type", type: "select", options: ["Full home interiors", "Kitchen", "Renovation", "Furniture only", "Other"], required: false, hidden: false },
  { key: "property_type", label: "Property type", type: "select", options: ["Apartment", "Independent house", "Villa", "Row house", "Other"], required: false, hidden: false },
  { key: "site_location", label: "Site location", type: "text", required: false, hidden: false },
  { key: "approx_area_sq_ft", label: "Approx. area (sq ft)", type: "number", required: false, hidden: false },
  { key: "possession_status", label: "Site / possession status", type: "select", options: ["Ready possession", "Under construction", "Occupied renovation", "Vacant renovation", "Other"], required: false, hidden: false },
  { key: "rooms_in_scope", label: "Rooms / areas in scope", type: "text", required: false, hidden: false },
  { key: "false_ceiling_scope", label: "False ceiling scope", type: "text", required: false, hidden: false },
  { key: "flooring_scope", label: "Flooring scope", type: "text", required: false, hidden: false },
  { key: "kitchen_carpentry_scope", label: "Kitchen & carpentry scope", type: "text", required: false, hidden: false },
  { key: "wardrobes_storage_scope", label: "Wardrobes & storage scope", type: "text", required: false, hidden: false },
  { key: "electrical_lighting_scope", label: "Electrical & lighting scope", type: "text", required: false, hidden: false },
  { key: "plumbing_bathroom_scope", label: "Plumbing & bathroom scope", type: "text", required: false, hidden: false },
  { key: "civil_renovation_scope", label: "Civil, demolition & renovation", type: "text", required: false, hidden: false },
  { key: "painting_wall_finish_scope", label: "Painting & wall finishes", type: "text", required: false, hidden: false },
  { key: "doors_windows_scope", label: "Doors & windows scope", type: "text", required: false, hidden: false },
  { key: "furniture_soft_furnishing_scope", label: "Furniture & soft furnishings", type: "text", required: false, hidden: false },
  { key: "appliances_scope", label: "Appliances / equipment", type: "text", required: false, hidden: false },
  { key: "design_style_preferences", label: "Design style & references", type: "text", required: false, hidden: false },
  { key: "client_priorities", label: "Client priorities", type: "text", required: false, hidden: false },
  { key: "site_constraints", label: "Site constraints / coordination notes", type: "text", required: false, hidden: false },
];

export async function getOpportunityFieldSettings(): Promise<{ customFields: LeadCustomField[] }> {
  const row = await prismadb.crm_SystemSettings.findUnique({ where: { key: KEY } });
  if (!row) return { customFields: DEFAULT_CUSTOM_FIELDS };
  try {
    const value = JSON.parse(row.value) as { customFields?: unknown };
    return { customFields: sanitizeLeadCustomFields(value.customFields).map((field) => ({ ...field, required: false })) };
  } catch {
    return { customFields: DEFAULT_CUSTOM_FIELDS };
  }
}

export async function validateOpportunityCustomFields(value: unknown) {
  const settings = await getOpportunityFieldSettings();
  const provided = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const fields = settings.customFields;
  const known = new Set(fields.map((field) => field.key));
  if (Object.keys(provided).some((key) => !known.has(key))) throw new Error("This opportunity contains a field that is not configured. Refresh and try again.");

  const clean: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    const raw = provided[field.key];
    if (raw == null || raw === "") continue;
    if (field.type === "checkbox") {
      if (typeof raw !== "boolean") throw new Error(`${field.label} must be yes or no.`);
      clean[field.key] = raw;
    } else if (field.type === "number") {
      const number = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(number)) throw new Error(`${field.label} must be a valid number.`);
      clean[field.key] = number;
    } else {
      if (typeof raw !== "string" || raw.length > 500) throw new Error(`${field.label} must be text of 500 characters or fewer.`);
      if (field.type === "select" && !field.options?.includes(raw)) throw new Error(`Choose a valid option for ${field.label}.`);
      if (field.type === "date" && Number.isNaN(Date.parse(raw))) throw new Error(`${field.label} must be a valid date.`);
      clean[field.key] = raw;
    }
  }
  return clean;
}

export function sanitizeOpportunityFieldSettings(value: unknown) {
  const customFields = value && typeof value === "object" ? (value as { customFields?: unknown }).customFields : undefined;
  return { customFields: sanitizeLeadCustomFields(customFields).map((field) => ({ ...field, required: false })) };
}

export async function saveOpportunityFieldSettings(value: unknown) {
  const settings = sanitizeOpportunityFieldSettings(value);
  await prismadb.crm_SystemSettings.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
  return settings;
}
