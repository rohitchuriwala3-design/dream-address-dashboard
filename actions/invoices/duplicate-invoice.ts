"use server";

import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanWriteAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { canReadInvoice, type InvoiceStatus } from "@/lib/invoices/permissions";
import { serializeDecimals } from "@/lib/serialize-decimals";
import { computeLineTotal, computeInvoiceTotals } from "@/lib/invoices/totals";
import { Decimal } from "decimal.js";

export async function duplicateInvoice(invoiceId: string) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    throw e;
  }

  const source = await prismadb.invoices.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  if (
    !canReadInvoice(
      { status: source.status as InvoiceStatus, createdBy: source.createdBy },
      { id: user.id, role: user.role },
    )
  ) {
    throw new Error("Forbidden");
  }

  try {
    await assertCanWriteAccount(user, source.accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (source.currency !== "INR") {
    throw new Error("Only INR invoices can be duplicated in MARK IV V1; historical currency values are preserved without conversion");
  }

  // A duplicate is a new V1 document. Recalculate it with zero tax even when
  // its source is a historical tax-bearing invoice.
  const lines = source.lineItems.map((li) => {
    const amounts = computeLineTotal({
      quantity: new Decimal(String(li.quantity)),
      unitPrice: new Decimal(String(li.unitPrice)),
      discountPercent: new Decimal(String(li.discountPercent)),
      taxRate: new Decimal(0),
    });
    return { li, amounts };
  });
  const totals = computeInvoiceTotals(lines.map(({ li }) => ({
    quantity: new Decimal(String(li.quantity)),
    unitPrice: new Decimal(String(li.unitPrice)),
    discountPercent: new Decimal(String(li.discountPercent)),
    taxRate: new Decimal(0),
  })));

  const invoice = await prismadb.invoices.create({
    data: {
      type: source.type,
      status: "DRAFT",
      createdBy: user.id,
      accountId: source.accountId,
      seriesId: source.seriesId,
      currency: source.currency,
      dueDate: source.dueDate,
      publicNotes: source.publicNotes,
      internalNotes: source.internalNotes,
      bankName: source.bankName,
      bankAccount: source.bankAccount,
      iban: source.iban,
      swift: source.swift,
      variableSymbol: source.variableSymbol,
      originalInvoiceId: source.id,
      subtotal: totals.subtotal.toString(),
      discountTotal: totals.discountTotal.toString(),
      vatTotal: "0",
      grandTotal: totals.grandTotal.toString(),
      balanceDue: totals.grandTotal.toString(),
      lineItems: {
        create: lines.map(({ li, amounts }) => ({
          position: li.position,
          productId: li.productId,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discountPercent: li.discountPercent,
          taxRateId: null,
          lineSubtotal: amounts.lineSubtotal.toString(),
          lineVat: "0",
          lineTotal: amounts.lineTotal.toString(),
        })),
      },
      activity: {
        create: {
          actorId: user.id,
          action: "DUPLICATED",
          meta: { sourceInvoiceId: invoiceId },
        },
      },
    },
  });

  return serializeDecimals(invoice);
}
