"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serializeDecimals } from "@/lib/serialize-decimals";
import { createVendorAccount, createVendorBill, markVendorBillPaid, reviewVendorBill, reviseRejectedVendorBill, VendorBillError } from "./service";

const vendorSchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  phone: z.string().trim().max(50).optional(), vat: z.string().trim().max(40).optional(), city: z.string().trim().max(100).optional(),
});
const billSchema = z.object({
  vendorAccountId: z.string().uuid(), projectId: z.union([z.string().uuid(), z.literal("")]).optional(),
  vendorInvoiceNumber: z.string().trim().min(1).max(120), description: z.string().trim().min(2).max(1000),
  grossAmount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter an amount with at most two decimal places"),
  invoiceDate: z.string().date(), dueDate: z.union([z.string().date(), z.literal("")]).optional(),
}).refine((value) => !value.dueDate || value.dueDate >= value.invoiceDate, { message: "Due date must be on or after invoice date", path: ["dueDate"] });

export async function createVendorAccountAction(raw: unknown) {
  const parsed = vendorSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check vendor details" };
  try {
    const account = await createVendorAccount(parsed.data);
    revalidatePath("/[locale]/(routes)/vendors", "page");
    return { success: true, vendorId: account.id };
  } catch (error) {
    if (error instanceof VendorBillError) return { error: error.message };
    console.error("[createVendorAccountAction]", error);
    return { error: "Vendor could not be created" };
  }
}

export async function createVendorBillAction(raw: unknown) {
  const parsed = billSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check vendor bill details" };
  if (Number(parsed.data.grossAmount) <= 0) return { error: "Payable amount must be greater than zero" };
  try {
    const bill = await createVendorBill({
      ...parsed.data, projectId: parsed.data.projectId || undefined,
      invoiceDate: new Date(`${parsed.data.invoiceDate}T12:00:00+05:30`),
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00+05:30`) : undefined,
    });
    revalidatePath("/[locale]/(routes)/vendor-bills", "page");
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    return { success: true, billId: bill.id };
  } catch (error) {
    if (error instanceof VendorBillError) return { error: error.message };
    console.error("[createVendorBillAction]", error);
    return { error: "Vendor bill could not be submitted" };
  }
}

export async function reviewVendorBillAction(billId: string, decision: "APPROVED" | "REJECTED", note?: string) {
  if (!z.string().uuid().safeParse(billId).success || !["APPROVED", "REJECTED"].includes(decision)) return { error: "Invalid vendor bill review" };
  if (decision === "REJECTED" && !note?.trim()) return { error: "A reason is required when rejecting a vendor bill" };
  try {
    await reviewVendorBill(billId, decision, note);
    revalidatePath("/[locale]/(routes)/vendor-bills", "page");
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof VendorBillError) return { error: error.message };
    console.error("[reviewVendorBillAction]", error);
    return { error: "Vendor bill review could not be saved" };
  }
}

export async function reviseRejectedVendorBillAction(billId: string, raw: unknown) {
  if (!z.string().uuid().safeParse(billId).success) return { error: "Invalid vendor bill" };
  const parsed = billSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check revised bill details" };
  if (Number(parsed.data.grossAmount) <= 0) return { error: "Payable amount must be greater than zero" };
  try {
    await reviseRejectedVendorBill(billId, {
      vendorInvoiceNumber: parsed.data.vendorInvoiceNumber, description: parsed.data.description,
      grossAmount: parsed.data.grossAmount, invoiceDate: new Date(`${parsed.data.invoiceDate}T12:00:00+05:30`),
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00+05:30`) : undefined,
    });
    revalidatePath("/[locale]/(routes)/vendor-bills", "page");
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof VendorBillError) return { error: error.message };
    console.error("[reviseRejectedVendorBillAction]", error);
    return { error: "Vendor bill could not be resubmitted" };
  }
}

export async function markVendorBillPaidAction(billId: string, paymentReference: string, treasuryAccountId: string) {
  if (!z.string().uuid().safeParse(billId).success || !z.string().trim().min(2).max(160).safeParse(paymentReference).success || !z.string().uuid().safeParse(treasuryAccountId).success)
    return { error: "Choose a cash account and enter the payment reference" };
  try {
    const bill = await markVendorBillPaid(billId, paymentReference, treasuryAccountId);
    revalidatePath("/[locale]/(routes)/vendor-bills", "page");
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    return { success: true, bill: serializeDecimals(bill) };
  } catch (error) {
    if (error instanceof VendorBillError) return { error: error.message };
    console.error("[markVendorBillPaidAction]", error);
    return { error: "Vendor bill payment status could not be saved" };
  }
}
