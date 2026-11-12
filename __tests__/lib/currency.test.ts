import { convertAmount, formatCurrency, findRate } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";

type Rate = { fromCurrency: string; toCurrency: string; rate: Decimal };

const mockRates: Rate[] = [
  { fromCurrency: "AAA", toCurrency: "BBB", rate: new Decimal("1.084") },
  { fromCurrency: "AAA", toCurrency: "CCC", rate: new Decimal("25.315") },
  { fromCurrency: "BBB", toCurrency: "AAA", rate: new Decimal("0.92251") },
  { fromCurrency: "BBB", toCurrency: "CCC", rate: new Decimal("23.35") },
  { fromCurrency: "CCC", toCurrency: "AAA", rate: new Decimal("0.0395") },
  { fromCurrency: "CCC", toCurrency: "BBB", rate: new Decimal("0.04283") },
];

describe("findRate", () => {
  it("returns direct rate when available", () => {
    const rate = findRate("AAA", "BBB", mockRates);
    expect(rate?.toString()).toBe("1.084");
  });

  it("returns 1 when from === to", () => {
    const rate = findRate("AAA", "AAA", mockRates);
    expect(rate?.toString()).toBe("1");
  });

  it("returns null when no rate exists", () => {
    const rate = findRate("DDD", "BBB", mockRates);
    expect(rate).toBeNull();
  });
});

describe("convertAmount", () => {
  it("converts AAA to BBB using direct rate", () => {
    const result = convertAmount(new Decimal("1000"), "AAA", "BBB", mockRates);
    expect(result?.toString()).toBe("1084");
  });

  it("returns same amount when currencies match", () => {
    const result = convertAmount(new Decimal("500"), "AAA", "AAA", mockRates);
    expect(result?.toString()).toBe("500");
  });

  it("converts CCC to BBB", () => {
    const result = convertAmount(new Decimal("10000"), "CCC", "BBB", mockRates);
    expect(result?.toString()).toBe("428.3");
  });

  it("returns null when rate is missing", () => {
    const result = convertAmount(new Decimal("100"), "DDD", "BBB", mockRates);
    expect(result).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("formats AAA amount", () => {
    const result = formatCurrency(new Decimal("1234.56"), "AAA");
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("AAA");
  });

  it("formats BBB amount", () => {
    const result = formatCurrency(new Decimal("1234.56"), "BBB");
    expect(result).toContain("BBB");
  });

  it("formats CCC amount", () => {
    const result = formatCurrency(new Decimal("1234.56"), "CCC");
    expect(result).toContain("CCC");
  });

  it("formats whole numbers without unnecessary decimals", () => {
    const result = formatCurrency(new Decimal("1000"), "AAA");
    expect(result).not.toContain(".00");
  });
});
