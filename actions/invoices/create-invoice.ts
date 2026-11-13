"use server";

import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanWriteAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { Decimal } from "decimal.js";
import { computeInvoiceTotals, computeLineTotal } from "@/lib/invoices/totals";
import { createInvoiceSchema } from "@/types/invoice";
import { serializeDecimals } from "@/lib/serialize-decimals";

export async function createInvoice(raw: unknown) {
  let user;
  try {
    user = await requirePermission("finance.manage");
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    throw e;
  }
  const input = createInvoiceSchema.parse(raw);

  try {
    await assertCanWriteAccount(user, input.accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (input.studioProjectId) {
    const project = await prismadb.studioProject.findFirst({
      where: { id: input.studioProjectId, deletedAt: null, accountId: input.accountId },
      select: { id: true },
    });
    if (!project) throw new Error("Project not found or does not belong to the selected account");
  }

  const lineInputs = input.lineItems.map((l) => ({
    quantity: new Decimal(l.quantity),
    unitPrice: new Decimal(l.unitPrice),
    discountPercent: new Decimal(l.discountPercent),
    taxRate: new Decimal(0),
  }));
  const totals = computeInvoiceTotals(lineInputs);

  const invoice = await prismadb.invoices.create({
    data: {
      type: input.type,
      status: "DRAFT",
      createdBy: user.id,
      accountId: input.accountId,
      studioProjectId: input.studioProjectId ?? null,
      seriesId: input.seriesId ?? null,
      currency: input.currency,
      dueDate: input.dueDate ?? null,
      publicNotes: input.publicNotes ?? null,
      internalNotes: input.internalNotes ?? null,
      bankName: input.bankName ?? null,
      bankAccount: input.bankAccount ?? null,
      bankAccountHolder: input.bankAccountHolder ?? null,
      bankIfsc: input.bankIfsc || null,
      originalInvoiceId: input.originalInvoiceId ?? null,
      subtotal: totals.subtotal.toString(),
      discountTotal: totals.discountTotal.toString(),
      vatTotal: totals.vatTotal.toString(),
      grandTotal: totals.grandTotal.toString(),
      balanceDue: totals.grandTotal.toString(),
      lineItems: {
        create: input.lineItems.map((l, i) => {
          const lt = computeLineTotal(lineInputs[i]);
          return {
            position: l.position ?? i,
            productId: l.productId ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            taxRateId: null,
            lineSubtotal: lt.lineSubtotal.toString(),
            lineVat: lt.lineVat.toString(),
            lineTotal: lt.lineTotal.toString(),
          };
        }),
      },
      activity: {
        create: { actorId: user.id, action: "CREATED" },
      },
    },
  });

  return serializeDecimals(invoice);
}
