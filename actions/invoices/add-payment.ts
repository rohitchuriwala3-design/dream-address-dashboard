"use server";

import { prismadb } from "@/lib/prisma";
import { getUser } from "@/actions/get-user";
import { Decimal } from "decimal.js";
import { addPaymentSchema } from "@/types/invoice";
import {
  canAddPayment,
  canReadInvoice,
  type InvoiceStatus,
} from "@/lib/invoices/permissions";
import { mapLegacyRole } from "@/lib/authz";
import { serializeDecimals } from "@/lib/serialize-decimals";
import { calculatePaymentAllocation } from "@/lib/invoices/payment-allocation";

export async function addPayment(raw: unknown) {
  const user = await getUser();
  const input = addPaymentSchema.parse(raw);

  return prismadb.$transaction(async (tx) => {
    // Serialize payment attempts for one invoice before reading the balance.
    // Without this lock, two concurrent requests can both pass the same due check.
    await tx.$queryRaw`SELECT "id" FROM "Invoices" WHERE "id" = ${input.invoiceId}::uuid FOR UPDATE`;

    const invoice = await tx.invoices.findUniqueOrThrow({
      where: { id: input.invoiceId },
      select: { id: true, status: true, createdBy: true, grandTotal: true, paidTotal: true, currency: true },
    });

    const role = mapLegacyRole(user.role);
    const retry = await tx.invoice_Payments.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, invoiceId: true, amount: true, paidAt: true, method: true, reference: true, note: true, createdBy: true },
    });
    if (retry) {
      const canRead = canReadInvoice(
        { status: invoice.status as InvoiceStatus, createdBy: invoice.createdBy },
        { id: user.id, role },
      );
      const sameRequest = retry.invoiceId === invoice.id
        && retry.createdBy === user.id
        && new Decimal(retry.amount.toString()).eq(input.amount)
        && retry.paidAt.getTime() === input.paidAt.getTime()
        && retry.method === input.method
        && retry.reference === (input.reference ?? null)
        && retry.note === (input.note ?? null);
      const treasuryPosting = await tx.treasuryTransaction.findFirst({ where: { sourceType: "invoice_payment", sourceId: retry.id }, include: { entries: true } });
      const sameAccount = treasuryPosting?.entries.some((entry) => entry.accountId === input.treasuryAccountId) ?? false;
      if (!canRead || !sameRequest || !sameAccount) {
        throw new Error("Payment idempotency key was already used for a different request");
      }
      return serializeDecimals(invoice);
    }

    if (
      !canAddPayment(
        { status: invoice.status as InvoiceStatus, createdBy: invoice.createdBy },
        { id: user.id, role }
      )
    ) {
      throw new Error("Cannot add payment to this invoice");
    }

    const paymentAmount = new Decimal(input.amount);
    const allocation = calculatePaymentAllocation({
      grandTotal: invoice.grandTotal.toString(),
      paidTotal: invoice.paidTotal.toString(),
      amount: paymentAmount.toString(),
    });

    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ${input.treasuryAccountId}::uuid FOR UPDATE`;
    const cashAccount = await tx.treasuryAccount.findFirst({ where: { id: input.treasuryAccountId, active: true } });
    if (!cashAccount || cashAccount.currency !== invoice.currency) throw new Error("Choose an active cash account with the invoice's currency");

    const payment = await tx.invoice_Payments.create({
      data: {
        invoiceId: input.invoiceId,
        idempotencyKey: input.idempotencyKey,
        amount: input.amount,
        paidAt: input.paidAt,
        method: input.method,
        reference: input.reference ?? null,
        note: input.note ?? null,
        createdBy: user.id,
      },
    });
    await tx.treasuryTransaction.create({ data: {
      type: "INVOICE_RECEIPT", amount: paymentAmount, currency: invoice.currency,
      reference: input.reference ?? null, description: `Invoice payment ${invoice.id}`, occurredAt: input.paidAt,
      sourceType: "invoice_payment", sourceId: payment.id, createdBy: user.id,
      entries: { create: { accountId: cashAccount.id, amount: paymentAmount, currency: invoice.currency } },
    } });

    const updated = await tx.invoices.update({
      where: { id: input.invoiceId },
      data: {
        paidTotal: allocation.newPaidTotal,
        balanceDue: allocation.newBalanceDue,
        status: allocation.newStatus,
        activity: {
          create: {
            actorId: user.id,
            action: "PAYMENT_ADDED",
            meta: { amount: input.amount, method: input.method },
          },
        },
      },
    });

    return serializeDecimals(updated);
  });
}
