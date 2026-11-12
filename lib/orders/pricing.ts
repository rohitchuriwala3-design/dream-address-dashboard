import { Decimal } from "decimal.js";
import { computeLineTotal } from "@/lib/invoices/totals";

export const round2 = (d: Decimal): Decimal => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function isBelowList(l: { unitPrice: Decimal; listPrice: Decimal }): boolean {
  return l.unitPrice.lt(l.listPrice);
}

export function lineAmounts(l: { quantity: Decimal; unitPrice: Decimal; vatRate: Decimal }) {
  // New MARK IV V1 order calculations are tax-free. `vatRate` remains in the
  // type for compatibility with stored legacy order lines.
  return computeLineTotal({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: new Decimal(0), taxRate: new Decimal(0) });
}

export function orderTotals(lines: { lineSubtotal: Decimal; lineVat: Decimal }[]) {
  const subtotal = lines.reduce((s, l) => s.add(l.lineSubtotal), new Decimal(0));
  return { subtotal: round2(subtotal), vatTotal: new Decimal(0), grandTotal: round2(subtotal) };
}

/** Display only: 1 − unit / list, in percent. Null when the list price is 0. */
export function discountPercent(l: { unitPrice: Decimal; listPrice: Decimal }): Decimal | null {
  if (l.listPrice.isZero()) return null;
  return round2(new Decimal(1).sub(l.unitPrice.div(l.listPrice)).mul(100));
}
