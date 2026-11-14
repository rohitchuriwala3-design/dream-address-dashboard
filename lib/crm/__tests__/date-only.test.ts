import { parseCrmDateOnly, toCrmDateOnly } from "../date-only";

describe("CRM date-only values", () => {
  it("parses and formats a calendar day without timezone shifting", () => {
    const parsed = parseCrmDateOnly("2026-11-14");
    expect(parsed?.toISOString()).toBe("2026-11-14T00:00:00.000Z");
    expect(toCrmDateOnly(parsed)).toBe("2026-11-14");
  });

  it("distinguishes omitted, blank and explicit dates for safe updates", () => {
    expect(parseCrmDateOnly(undefined)).toBeUndefined();
    expect(parseCrmDateOnly("")).toBeNull();
    expect(parseCrmDateOnly(null)).toBeNull();
  });

  it.each(["2026-02-30", "14-11-2026", "2026-1-04"])("rejects invalid input %s", (value) => {
    expect(() => parseCrmDateOnly(value)).toThrow("Invalid date");
  });
});
