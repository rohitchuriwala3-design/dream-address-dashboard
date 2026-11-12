import Decimal from "decimal.js";
import { prismadb } from "@/lib/prisma";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { writeAuditLog } from "@/lib/audit-log";

export class VendorBillError extends Error {
  constructor(message: string, readonly code: "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "DUPLICATE" | "FAILED") { super(message); }
}

async function financeUser() {
  try { return await requireRole(["manager", "admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new VendorBillError("Manager access is required", "FORBIDDEN");
    throw error;
  }
}

export async function listVendorAccounts() {
  await financeUser();
  return prismadb.crm_Accounts.findMany({
    where: { type: "Vendor", status: "Active", deletedAt: null },
    select: { id: true, name: true, email: true, office_phone: true, vat: true, billing_city: true },
    orderBy: { name: "asc" }, take: 500,
  });
}

export async function createVendorAccount(input: { name: string; email?: string; phone?: string; vat?: string; city?: string }) {
  const user = await financeUser();
  const account = await prismadb.crm_Accounts.create({ data: {
    v: 0, name: input.name.trim(), type: "Vendor", status: "Active", createdBy: user.id, updatedBy: user.id,
    email: input.email?.trim() || null, office_phone: input.phone?.trim() || null,
    vat: input.vat?.trim() || null, billing_city: input.city?.trim() || null,
  } });
  try { await writeAuditLog({ entityType: "account", entityId: account.id, action: "created", changes: [
    { field: "type", old: null, new: "Vendor" },
  ], userId: user.id }); }
  catch (error) { console.error("[createVendorAccount] Audit event failed after create", error); }
  return account;
}

export async function listVendorBillProjects() {
  await financeUser();
  return prismadb.studioProject.findMany({
    where: { deletedAt: null, status: { not: "CANCELLED" } },
    select: { id: true, code: true, name: true, currency: true }, orderBy: { name: "asc" }, take: 500,
  });
}

export async function listVendorBills() {
  await financeUser();
  const rows = await prismadb.vendorBill.findMany({
    include: { vendor: { select: { id: true, name: true } }, project: { select: { id: true, code: true, name: true } } },
    orderBy: [{ dueDate: "asc" }, { invoiceDate: "desc" }], take: 1000,
  });
  return serializeDecimalsList(rows);
}

export async function createVendorBill(input: {
  vendorAccountId: string; projectId?: string; vendorInvoiceNumber: string; description: string;
  grossAmount: string; invoiceDate: Date; dueDate?: Date;
}) {
  const user = await financeUser();
  const number = input.vendorInvoiceNumber.trim().toLocaleUpperCase("en-US");
  const amount = new Decimal(input.grossAmount);
  if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2 || amount.greaterThan("999999999999999999.99"))
    throw new VendorBillError("Enter a positive payable amount with no more than two decimal places", "INVALID");

  const vendor = await prismadb.crm_Accounts.findFirst({
    where: { id: input.vendorAccountId, type: "Vendor", status: "Active", deletedAt: null }, select: { id: true },
  });
  if (!vendor) throw new VendorBillError("Choose an active vendor account", "INVALID");

  let currency = "INR";
  if (input.projectId) {
    const project = await prismadb.studioProject.findFirst({
      where: { id: input.projectId, deletedAt: null, status: { not: "CANCELLED" } }, select: { id: true, currency: true },
    });
    if (!project) throw new VendorBillError("Choose an active studio project", "INVALID");
    currency = project.currency;
  }

  try {
    const bill = await prismadb.vendorBill.create({ data: {
      vendorAccountId: vendor.id, projectId: input.projectId || null, vendorInvoiceNumber: number,
      description: input.description.trim(), grossAmount: amount.toFixed(2), currency,
      invoiceDate: input.invoiceDate, dueDate: input.dueDate ?? null, submittedBy: user.id,
    } });
    try { await writeAuditLog({ entityType: "vendor_bill", entityId: bill.id, action: "created", changes: [
      { field: "vendorAccountId", old: null, new: vendor.id }, { field: "grossAmount", old: null, new: amount.toFixed(2) },
      { field: "status", old: null, new: "SUBMITTED" },
    ], userId: user.id }); }
    catch (error) { console.error("[createVendorBill] Audit event failed after create", error); }
    return bill;
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") throw new VendorBillError("That vendor invoice number is already recorded for this vendor", "DUPLICATE");
    throw error;
  }
}

export async function reviewVendorBill(billId: string, decision: "APPROVED" | "REJECTED", note?: string) {
  const user = await financeUser();
  const result = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "VendorBill" WHERE "id" = ${billId}::uuid FOR UPDATE`;
    const current = await tx.vendorBill.findUnique({ where: { id: billId }, select: { id: true, status: true } });
    if (!current) return { error: "Vendor bill not found" as const };
    if (current.status !== "SUBMITTED") return { error: "Only submitted vendor bills can be reviewed" as const };
    const bill = await tx.vendorBill.update({ where: { id: billId }, data: {
      status: decision, reviewedBy: user.id, reviewedAt: new Date(), reviewNote: note?.trim().slice(0, 1000) || null,
    } });
    return { bill, previousStatus: current.status };
  });
  if ("error" in result) throw new VendorBillError(result.error ?? "Review failed", result.error === "Vendor bill not found" ? "NOT_FOUND" : "INVALID");
  try { await writeAuditLog({ entityType: "vendor_bill", entityId: billId, action: "updated", changes: [
    { field: "status", old: result.previousStatus, new: decision }, { field: "reviewNote", old: null, new: note?.trim().slice(0, 1000) || null },
  ], userId: user.id }); }
  catch (error) { console.error("[reviewVendorBill] Audit event failed after review", error); }
  return result.bill;
}

export async function reviseRejectedVendorBill(billId: string, input: {
  vendorInvoiceNumber: string; description: string; grossAmount: string; invoiceDate: Date; dueDate?: Date;
}) {
  const user = await financeUser();
  const number = input.vendorInvoiceNumber.trim().toLocaleUpperCase("en-US");
  const amount = new Decimal(input.grossAmount);
  if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) throw new VendorBillError("Enter a positive payable amount with no more than two decimal places", "INVALID");
  try {
    const result = await prismadb.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "VendorBill" WHERE "id" = ${billId}::uuid FOR UPDATE`;
      const current = await tx.vendorBill.findUnique({ where: { id: billId }, select: { id: true, status: true, vendorInvoiceNumber: true, description: true, grossAmount: true, invoiceDate: true, dueDate: true, reviewNote: true } });
      if (!current) return { error: "Vendor bill not found" as const };
      if (current.status !== "REJECTED") return { error: "Only rejected vendor bills can be revised" as const };
      const updated = await tx.vendorBill.update({ where: { id: billId }, data: {
        vendorInvoiceNumber: number, description: input.description.trim(), grossAmount: amount.toFixed(2),
        invoiceDate: input.invoiceDate, dueDate: input.dueDate ?? null, status: "SUBMITTED",
        reviewedBy: null, reviewedAt: null, reviewNote: null,
      } });
      return { bill: updated, current };
    });
    if ("error" in result) throw new VendorBillError(result.error ?? "Revision failed", result.error === "Vendor bill not found" ? "NOT_FOUND" : "INVALID");
    try { await writeAuditLog({ entityType: "vendor_bill", entityId: billId, action: "updated", changes: [
      { field: "status", old: result.current.status, new: "SUBMITTED" },
      { field: "vendorInvoiceNumber", old: result.current.vendorInvoiceNumber, new: number },
      { field: "description", old: result.current.description, new: input.description.trim() },
      { field: "grossAmount", old: result.current.grossAmount.toString(), new: amount.toFixed(2) },
      { field: "invoiceDate", old: result.current.invoiceDate, new: input.invoiceDate },
      { field: "dueDate", old: result.current.dueDate, new: input.dueDate ?? null },
      { field: "reviewNote", old: result.current.reviewNote, new: null },
    ], userId: user.id }); }
    catch (error) { console.error("[reviseRejectedVendorBill] Audit event failed after revision", error); }
    return result.bill;
  } catch (error) {
    if (error instanceof VendorBillError) throw error;
    if ((error as { code?: string })?.code === "P2002") throw new VendorBillError("That vendor invoice number is already recorded for this vendor", "DUPLICATE");
    throw error;
  }
}

export async function markVendorBillPaid(billId: string, paymentReference: string, treasuryAccountId: string) {
  const user = await financeUser();
  const reference = paymentReference.trim().slice(0, 160);
  if (!reference) throw new VendorBillError("Enter the bank or payment reference", "INVALID");
  const result = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "VendorBill" WHERE "id" = ${billId}::uuid FOR UPDATE`;
    const current = await tx.vendorBill.findUnique({ where: { id: billId }, select: { id: true, status: true, grossAmount: true, currency: true, vendor: { select: { name: true } } } });
    if (!current) return { error: "Vendor bill not found" as const };
    if (current.status !== "APPROVED") return { error: "Only approved vendor bills can be marked paid" as const };
    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ${treasuryAccountId}::uuid FOR UPDATE`;
    const account = await tx.treasuryAccount.findFirst({ where: { id: treasuryAccountId, active: true } });
    if (!account || account.currency !== current.currency) return { error: "Choose an active cash account with the vendor bill's currency" as const };
    const balance = await tx.treasuryEntry.aggregate({ where: { accountId: account.id }, _sum: { amount: true } });
    if (new Decimal(balance._sum.amount?.toString() ?? "0").lt(current.grossAmount.toString())) return { error: "Payment exceeds the available recorded cash balance" as const };
    await tx.treasuryTransaction.create({ data: {
      type: "VENDOR_PAYMENT", amount: current.grossAmount, currency: current.currency, reference,
      description: `Vendor bill ${current.vendor.name}`, occurredAt: new Date(), sourceType: "vendor_bill", sourceId: billId, createdBy: user.id,
      entries: { create: { accountId: account.id, amount: new Decimal(current.grossAmount.toString()).negated(), currency: current.currency } },
    } });
    const bill = await tx.vendorBill.update({ where: { id: billId }, data: { status: "PAID", paidAt: new Date(), paymentReference } });
    return { bill, previousStatus: current.status };
  });
  if ("error" in result) throw new VendorBillError(result.error ?? "Payment update failed", result.error === "Vendor bill not found" ? "NOT_FOUND" : "INVALID");
  try { await writeAuditLog({ entityType: "vendor_bill", entityId: billId, action: "updated", changes: [
    { field: "status", old: result.previousStatus, new: "PAID" }, { field: "paymentReference", old: null, new: reference },
  ], userId: user.id }); }
  catch (error) { console.error("[markVendorBillPaid] Audit event failed after update", error); }
  return result.bill;
}
