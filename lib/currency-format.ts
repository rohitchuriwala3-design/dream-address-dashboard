import { Decimal } from "@prisma/client/runtime/client";

export function formatCurrency(amount: Decimal, currencyCode: string): string {
  if (currencyCode !== "INR") return "Amount needs INR review";
  const num = amount.toNumber();
  const isWhole = num % 1 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(num);
}
