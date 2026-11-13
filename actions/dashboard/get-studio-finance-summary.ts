import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { invoiceReadScopeWhere } from "@/lib/invoices/permissions";
import { Invoice_Status, Prisma } from "@prisma/client";

/**
 * Dashboard finance figures are deliberately limited to INR invoices. Other
 * currencies are excluded rather than silently added without an FX snapshot.
 */
export async function getStudioFinanceSummary() {
  try {
    const user = await requirePermission("finance.view", { partner: true });
    const scope = invoiceReadScopeWhere(user);
    const issuedInvoices: Prisma.InvoicesWhereInput = {
      ...scope,
      type: "INVOICE" as const,
      currency: "INR",
      status: { in: [Invoice_Status.ISSUED, Invoice_Status.SENT, Invoice_Status.PARTIALLY_PAID, Invoice_Status.PAID, Invoice_Status.OVERDUE] },
    };

    const [totals, overdueCount] = await Promise.all([
      prismadb.invoices.aggregate({
        where: issuedInvoices,
        _sum: { grandTotal: true, paidTotal: true, balanceDue: true },
        _count: { _all: true },
      }),
      prismadb.invoices.count({
        where: {
          ...issuedInvoices,
          dueDate: { lt: new Date() },
          balanceDue: { gt: 0 },
        },
      }),
    ]);

    return {
      issuedInvoiceValue: totals._sum.grandTotal?.toString() ?? "0",
      collected: totals._sum.paidTotal?.toString() ?? "0",
      receivables: totals._sum.balanceDue?.toString() ?? "0",
      issuedInvoiceCount: totals._count._all,
      overdueCount,
      currency: "INR",
      excludesOtherCurrencies: true,
    };
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return {
        issuedInvoiceValue: "0",
        collected: "0",
        receivables: "0",
        issuedInvoiceCount: 0,
        overdueCount: 0,
        currency: "INR",
        excludesOtherCurrencies: true,
      };
    }
    throw error;
  }
}
