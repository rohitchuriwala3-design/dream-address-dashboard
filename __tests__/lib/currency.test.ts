import { formatCurrency } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";

describe("single-currency INR behavior", () => {
  it("formats values as Indian rupees", () => {
    expect(formatCurrency(new Decimal("1234.56"), "INR")).toContain("₹");
    expect(formatCurrency(new Decimal("1000"), "INR")).not.toContain(".00");
  });

  it("suppresses unlabeled legacy values until an admin reviews them", () => {
    expect(formatCurrency(new Decimal("1234.56"), "OTHER")).toBe("Amount needs INR review");
  });
});
