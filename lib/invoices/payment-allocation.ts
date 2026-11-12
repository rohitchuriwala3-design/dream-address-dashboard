import { Decimal } from "decimal.js";

export function calculatePaymentAllocation(input: {
  grandTotal: string;
  paidTotal: string;
  amount: string;
}) {
  const grandTotal = new Decimal(input.grandTotal);
  const paidTotal = new Decimal(input.paidTotal);
  const amount = new Decimal(input.amount);
  const balanceDue = Decimal.max(grandTotal.sub(paidTotal), 0);

  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error("Payment amount must be greater than zero");
  }
  if (amount.decimalPlaces() > 2) {
    throw new Error("Payment amount cannot have fractions smaller than one paisa");
  }
  if (amount.gt(balanceDue)) {
    throw new Error("Payment amount exceeds the outstanding invoice balance");
  }

  const newPaidTotal = paidTotal.add(amount);
  const newBalanceDue = Decimal.max(grandTotal.sub(newPaidTotal), 0);
  return {
    newPaidTotal: newPaidTotal.toFixed(2),
    newBalanceDue: newBalanceDue.toFixed(2),
    newStatus: newBalanceDue.isZero() ? "PAID" as const : "PARTIALLY_PAID" as const,
  };
}
