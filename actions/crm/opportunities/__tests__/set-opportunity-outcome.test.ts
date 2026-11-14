jest.mock("@/lib/authz", () => ({
  requirePermission: jest.fn(),
  assertCanWriteOpportunity: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  PARTNER_EDIT: { partnerEdit: true },
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: { $transaction: jest.fn() },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { requirePermission, assertCanWriteOpportunity } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { setOpportunityOutcome } from "../set-opportunity-outcome";

const tx = {
  $queryRaw: jest.fn(),
  crm_Opportunities: { findFirst: jest.fn(), update: jest.fn() },
  crm_Lead_Statuses: { findFirst: jest.fn() },
  crm_Leads: { updateMany: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requirePermission as jest.Mock).mockResolvedValue({ id: "u1", role: "admin" });
  (assertCanWriteOpportunity as jest.Mock).mockResolvedValue(undefined);
  tx.crm_Opportunities.findFirst.mockResolvedValue({ id: "o1", status: "ACTIVE", sourceLeadId: "l1", outcomeNote: null });
  tx.crm_Opportunities.update.mockResolvedValue({});
  tx.crm_Lead_Statuses.findFirst.mockResolvedValue({ id: "lost-status" });
  tx.crm_Leads.updateMany.mockResolvedValue({ count: 1 });
  (prismadb.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
});

describe("setOpportunityOutcome", () => {
  it("requires a reason for a lost opportunity before writing", async () => {
    await expect(setOpportunityOutcome({ opportunityId: "o1", outcome: "LOST" })).resolves.toEqual({
      error: "Add a short reason before marking this opportunity lost.",
    });
    expect(prismadb.$transaction).not.toHaveBeenCalled();
  });

  it("records Won only as a commercial outcome and leaves client confirmation in the note", async () => {
    await expect(setOpportunityOutcome({ opportunityId: "o1", outcome: "WON", note: "Client confirmed the job" })).resolves.toEqual({});
    expect(tx.crm_Opportunities.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "o1" },
      data: expect.objectContaining({ status: "WON", closedBy: "u1", outcomeNote: "Client confirmed the job" }),
    }));
    expect(tx.crm_Leads.updateMany).not.toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("records the lost reason and marks the source lead Lost when that configured status exists", async () => {
    await expect(setOpportunityOutcome({ opportunityId: "o1", outcome: "LOST", note: "Client chose another provider" })).resolves.toEqual({});
    expect(tx.crm_Opportunities.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "LOST", outcomeNote: "Client chose another provider" }),
    }));
    expect(tx.crm_Leads.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "l1", convertedAt: null },
      data: { lead_status_id: "lost-status", updatedBy: "u1" },
    }));
  });

  it("does not allow an already closed opportunity to be reopened through this action", async () => {
    tx.crm_Opportunities.findFirst.mockResolvedValueOnce({ id: "o1", status: "WON", sourceLeadId: "l1", outcomeNote: null });
    await expect(setOpportunityOutcome({ opportunityId: "o1", outcome: "LOST", note: "Try again" })).resolves.toEqual({
      error: "Only an active opportunity can be closed.",
    });
    expect(tx.crm_Opportunities.update).not.toHaveBeenCalled();
  });
});
