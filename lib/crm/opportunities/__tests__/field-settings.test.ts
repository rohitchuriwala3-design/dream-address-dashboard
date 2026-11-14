jest.mock("@/lib/prisma", () => ({
  prismadb: { crm_SystemSettings: { findUnique: jest.fn() } },
}));

import { prismadb } from "@/lib/prisma";
import { getOpportunityFieldSettings, validateOpportunityCustomFields } from "../field-settings";

const findSettings = prismadb.crm_SystemSettings.findUnique as jest.Mock;

describe("opportunity form field settings", () => {
  beforeEach(() => findSettings.mockReset().mockResolvedValue(null));

  it("provides optional interior scope fields by default", async () => {
    const settings = await getOpportunityFieldSettings();
    expect(settings.customFields.find((field) => field.key === "false_ceiling_scope")).toMatchObject({ required: false, hidden: false });
    expect(settings.customFields.find((field) => field.key === "flooring_scope")).toMatchObject({ required: false, hidden: false });
    expect(settings.customFields).toHaveLength(20);
    expect(settings.customFields.every((field) => field.required === false)).toBe(true);
    expect(settings.customFields.map((field) => field.key)).toContain("civil_renovation_scope");
  });

  it("normalizes supported custom values and rejects invalid configured choices", async () => {
    findSettings.mockResolvedValue({ value: JSON.stringify({ customFields: [
      { key: "rooms_count", label: "Room count", type: "number", required: true },
      { key: "ceiling_scope", label: "Ceiling scope", type: "select", options: ["Gypsum", "POP"] },
    ] }) });
    await expect(validateOpportunityCustomFields({ rooms_count: "4", ceiling_scope: "Gypsum" })).resolves.toEqual({ rooms_count: 4, ceiling_scope: "Gypsum" });
    await expect(validateOpportunityCustomFields({ ceiling_scope: "Unknown" })).rejects.toThrow("valid option");
    await expect(validateOpportunityCustomFields({ unconfigured: "value" })).rejects.toThrow("not configured");
  });
});
