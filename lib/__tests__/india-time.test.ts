import { formatIndiaDateTime } from "@/lib/india-time";

describe("formatIndiaDateTime", () => {
  it("formats dates in Indian Standard Time regardless of host timezone", () => {
    expect(formatIndiaDateTime("2026-11-12T10:17:00.000Z")).toBe(
      "12/11/2026 15:47 IST",
    );
  });

  it("uses a neutral placeholder for missing or invalid dates", () => {
    expect(formatIndiaDateTime(null)).toBe("—");
    expect(formatIndiaDateTime("not-a-date")).toBe("—");
  });
});
