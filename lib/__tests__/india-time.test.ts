import { formatIndiaDate, formatIndiaDateTime } from "@/lib/india-time";

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

describe("formatIndiaDate", () => {
  it("uses Asia/Kolkata for dates near the UTC day boundary", () => {
    expect(formatIndiaDate("2026-11-12T20:00:00.000Z", "en-GB")).toBe("13 Nov 2026");
  });

  it("uses a neutral placeholder for missing or invalid dates", () => {
    expect(formatIndiaDate(null)).toBe("—");
    expect(formatIndiaDate("not-a-date")).toBe("—");
  });
});
