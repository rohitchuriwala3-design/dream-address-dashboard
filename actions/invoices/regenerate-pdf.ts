"use server";

import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import { getUser } from "@/actions/get-user";
import { mapLegacyRole } from "@/lib/authz";
import { canReadInvoice, type InvoiceStatus } from "@/lib/invoices/permissions";
import { renderInvoicePdf } from "@/lib/invoices/pdf/render";
import { uploadInvoicePdf } from "@/lib/invoices/storage";
import { buildInvoicePdfData } from "@/lib/invoices/pdf/build-pdf-data";
import { requirePermission } from "@/lib/authz";

export type RegenerateResult =
  | { ok: true; pdfGeneratedAt: string }
  | { ok: false; error: string };

export async function regenerateInvoicePdf(
  invoiceId: string
): Promise<RegenerateResult> {
  try { await requirePermission("finance.manage"); }
  catch { return { ok: false, error: "Forbidden" }; }
  let user;
  try {
    user = await getUser();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const invoice = await prismadb.invoices.findUniqueOrThrow({
      where: { id: invoiceId },
      include: {
        lineItems: {
          include: { taxRate: true },
          orderBy: { position: "asc" },
        },
        account: true,
      },
    });

    // Permission: manager/admin OR the creator of the invoice
    if (
      !canReadInvoice(
        { status: invoice.status as InvoiceStatus, createdBy: invoice.createdBy },
        { id: user.id, role: mapLegacyRole(user.role) },
      )
    ) {
      return { ok: false, error: "Forbidden" };
    }

    if (invoice.status === "DRAFT") {
      return {
        ok: false,
        error: "Draft invoices don't have PDFs — issue the invoice first",
      };
    }

    // Keep the original stored PDF as the authoritative historic artifact.
    // The V1 renderer is tax-free and must not silently replace an old taxed PDF.
    if (Number(invoice.vatTotal) > 0 || invoice.lineItems.some((line) => Number(line.lineVat) > 0)) {
      return {
        ok: false,
        error: "Historical tax-bearing invoices cannot be regenerated with the V1 document template",
      };
    }

    if (!invoice.number || !invoice.issueDate) {
      return {
        ok: false,
        error: "Invoice is missing number or issue date",
      };
    }

    const settings = await prismadb.invoice_Settings.findFirst();

    const pdfData = buildInvoicePdfData(
      invoice,
      settings,
      user.userLanguage ?? "en"
    );

    const pdfBuffer = await renderInvoicePdf(pdfData);
    const storageKey = await uploadInvoicePdf(invoice.id, pdfBuffer);

    const pdfGeneratedAt = new Date();
    await prismadb.invoices.update({
      where: { id: invoice.id },
      data: { pdfStorageKey: storageKey, pdfGeneratedAt },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    return { ok: true, pdfGeneratedAt: pdfGeneratedAt.toISOString() };
  } catch (err) {
    console.error("[regenerateInvoicePdf] failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
