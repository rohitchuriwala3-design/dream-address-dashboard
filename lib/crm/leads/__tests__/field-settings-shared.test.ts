import { sanitizeLeadCustomFields, sanitizeLeadFieldSettings } from "../field-settings-shared";

describe("Lead field configuration", () => {
  it("limits definitions, validates stable keys and requires options for pick lists", () => {
    const fields = sanitizeLeadCustomFields([
      { key: "site_locality", label: "Site locality", type: "text" },
      { key: "work_type", label: "Work type", type: "select", options: ["Full home", "Kitchen"] },
      { key: "missing_options", label: "Missing options", type: "select", options: [] },
      { key: "bad key", label: "Invalid key", type: "text" },
      { key: "site_locality", label: "Duplicate", type: "date" },
      ...Array.from({ length: 22 }, (_, index) => ({ key: `extra_${index}`, label: `Extra ${index}`, type: "text" })),
    ]);
    expect(fields).toHaveLength(20);
    expect(fields[0]).toMatchObject({ key: "site_locality", label: "Site locality", type: "text" });
    expect(fields[1].options).toEqual(["Full home", "Kitchen"]);
  });

  it("clears requiredness for hidden fields and preserves configured custom definitions", () => {
    const settings = sanitizeLeadFieldSettings({
      hidden: ["email"],
      required: ["email", "phone"],
      customFields: [{ key: "site_locality", label: "Site locality", type: "text", required: true, hidden: true }],
    });
    expect(settings.required).toEqual(["phone"]);
    expect(settings.customFields[0]).toMatchObject({ required: false, hidden: true });
  });
});
