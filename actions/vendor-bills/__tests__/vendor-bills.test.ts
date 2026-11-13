jest.mock("@/lib/authz", () => ({
  requirePermission: jest.fn(), AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({ prismadb: {
  crm_Accounts: { findFirst: jest.fn(), create: jest.fn() },
  studioProject: { findFirst: jest.fn() }, vendorBill: { findMany: jest.fn(), create: jest.fn() },
  treasuryAccount: { findFirst: jest.fn() }, treasuryEntry: { aggregate: jest.fn() }, treasuryTransaction: { create: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));

import { requirePermission } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { createVendorBill, markVendorBillPaid, reviewVendorBill, reviseRejectedVendorBill } from "../service";

const tx = { $queryRaw: jest.fn(), vendorBill: { findUnique: jest.fn(), update: jest.fn() }, treasuryAccount: { findFirst: jest.fn() }, treasuryEntry: { aggregate: jest.fn() }, treasuryTransaction: { create: jest.fn() } };

beforeEach(() => {
  jest.clearAllMocks();
  (requirePermission as jest.Mock).mockResolvedValue({ id: "manager-1", role: "manager" });
  (prismadb.crm_Accounts.findFirst as jest.Mock).mockResolvedValue({ id: "vendor-1" });
  (prismadb.studioProject.findFirst as jest.Mock).mockResolvedValue({ id: "project-1", currency: "INR" });
  (prismadb.vendorBill.create as jest.Mock).mockResolvedValue({ id: "bill-1", grossAmount: "1234.50" });
  tx.vendorBill.findUnique.mockResolvedValue({ id: "bill-1", status: "SUBMITTED", currency: "INR" });
  tx.vendorBill.update.mockImplementation(({ data }: any) => Promise.resolve({ id: "bill-1", ...data }));
  tx.treasuryAccount.findFirst.mockResolvedValue({ id: "cash-1", currency: "INR" });
  tx.treasuryEntry.aggregate.mockResolvedValue({ _sum: { amount: "5000" } });
  tx.treasuryTransaction.create.mockResolvedValue({ id: "tx-1" });
  (prismadb.$transaction as jest.Mock).mockImplementation((callback: any) => callback(tx));
});

describe("vendor bill workflow", () => {
  const input = { vendorAccountId: "vendor-1", projectId: "project-1", vendorInvoiceNumber: " inv-17 ", description: "Tiles", grossAmount: "1234.5", invoiceDate: new Date("2026-11-01T00:00:00Z") };

  it("canonicalizes vendor invoice numbers and stores the linked project's currency", async () => {
    await createVendorBill(input);
    expect(prismadb.vendorBill.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      vendorAccountId: "vendor-1", projectId: "project-1", vendorInvoiceNumber: "INV-17", currency: "INR", grossAmount: "1234.50",
    }) });
  });

  it("requires a vendor account rather than an arbitrary CRM customer", async () => {
    (prismadb.crm_Accounts.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(createVendorBill(input)).rejects.toThrow("Choose an active vendor account");
    expect(prismadb.vendorBill.create).not.toHaveBeenCalled();
  });

  it("records approval only from the submitted state under a row lock", async () => {
    await reviewVendorBill("bill-1", "APPROVED");
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.vendorBill.update).toHaveBeenCalledWith({ where: { id: "bill-1" }, data: expect.objectContaining({ status: "APPROVED", reviewedBy: "manager-1" }) });
  });

  it("requires an explicit payment reference and does not pay unapproved bills", async () => {
    await expect(markVendorBillPaid("bill-1", " ", "cash-1")).rejects.toThrow("Enter the bank or payment reference");
    await expect(markVendorBillPaid("bill-1", "UTR-1", "cash-1")).rejects.toThrow("Only approved vendor bills can be marked paid");
    expect(tx.vendorBill.update).not.toHaveBeenCalled();
  });

  it("marks an approved bill paid only with a reference", async () => {
    tx.vendorBill.findUnique.mockResolvedValueOnce({ id: "bill-1", status: "APPROVED", grossAmount: "1234.50", currency: "INR", vendor: { name: "Vendor" } });
    await markVendorBillPaid("bill-1", "UTR-7788", "cash-1");
    expect(tx.treasuryTransaction.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: "VENDOR_PAYMENT", sourceType: "vendor_bill", sourceId: "bill-1", entries: { create: expect.objectContaining({ amount: expect.anything() }) } }) });
    expect(tx.vendorBill.update).toHaveBeenCalledWith({ where: { id: "bill-1" }, data: expect.objectContaining({ status: "PAID", paymentReference: "UTR-7788", paidAt: expect.any(Date) }) });
  });

  it("revises a rejected bill and resubmits it for a fresh review", async () => {
    tx.vendorBill.findUnique.mockResolvedValueOnce({ id: "bill-1", status: "REJECTED", vendorInvoiceNumber: "INV-17", description: "Tiles", grossAmount: { toString: () => "1234.5" }, invoiceDate: new Date("2026-11-01T00:00:00Z"), dueDate: null, reviewNote: "Incorrect amount" });
    await reviseRejectedVendorBill("bill-1", { vendorInvoiceNumber: "inv-17-r1", description: "Revised tiles", grossAmount: "1240", invoiceDate: new Date("2026-11-02T00:00:00Z") });
    expect(tx.vendorBill.update).toHaveBeenCalledWith({ where: { id: "bill-1" }, data: expect.objectContaining({
      vendorInvoiceNumber: "INV-17-R1", description: "Revised tiles", grossAmount: "1240.00", status: "SUBMITTED", reviewNote: null,
    }) });
  });
});
