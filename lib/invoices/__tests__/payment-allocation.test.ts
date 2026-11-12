import { calculatePaymentAllocation } from "../payment-allocation";

describe("calculatePaymentAllocation", () => {
  it("applies a partial payment and preserves paise precision", () => {
    expect(calculatePaymentAllocation({
      grandTotal: "1000.00",
      paidTotal: "125.25",
      amount: "300.40",
    })).toEqual({
      newPaidTotal: "425.65",
      newBalanceDue: "574.35",
      newStatus: "PARTIALLY_PAID",
    });
  });

  it("marks the invoice paid at the exact outstanding balance", () => {
    expect(calculatePaymentAllocation({
      grandTotal: "1000.00",
      paidTotal: "750.00",
      amount: "250.00",
    })).toEqual({
      newPaidTotal: "1000.00",
      newBalanceDue: "0.00",
      newStatus: "PAID",
    });
  });

  it("rejects overpayment and sub-paise amounts", () => {
    expect(() => calculatePaymentAllocation({
      grandTotal: "100.00", paidTotal: "80.00", amount: "20.01",
    })).toThrow("exceeds the outstanding");
    expect(() => calculatePaymentAllocation({
      grandTotal: "100.00", paidTotal: "0.00", amount: "0.001",
    })).toThrow("one paisa");
  });
});
