jest.mock("@/lib/authz", () => ({
  requireAuthenticated: jest.fn(), requirePermission: jest.fn(), requireRole: jest.fn(), accountReadScopeWhere: jest.fn(() => ({})),
  assertCanWriteAccount: jest.fn(), AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {}, PARTNER_EDIT: {},
}));
jest.mock("@/lib/authz/scopes/crm", () => ({ opportunityReadScopeWhere: jest.fn(() => ({})) }));
jest.mock("@/lib/prisma", () => ({ prismadb: {
  studioProject: { findFirst: jest.fn() }, studioProjectExpense: { create: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));

import { requireAuthenticated, requirePermission, requireRole } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { createStudioProjectExpense, markStudioProjectExpensePaid, reviewStudioProjectExpense } from "../service";

const tx = {
  $queryRaw: jest.fn(),
  studioProjectExpense: { findUnique: jest.fn(), update: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAuthenticated as jest.Mock).mockResolvedValue({ id: "u1", role: "user" });
  (requirePermission as jest.Mock).mockImplementation(() => (requireAuthenticated as jest.Mock)());
  (requireRole as jest.Mock).mockResolvedValue({ id: "m1", role: "manager" });
  (prismadb.studioProject.findFirst as jest.Mock).mockResolvedValue({ id: "p1", accountId: "a1", currency: "INR" });
  (prismadb.studioProjectExpense.create as jest.Mock).mockResolvedValue({ id: "e1", amount: "125.50", status: "SUBMITTED" });
  tx.studioProjectExpense.findUnique.mockResolvedValue({ id: "e1", status: "SUBMITTED", amount: "125.50", projectId: "p1" });
  tx.studioProjectExpense.update.mockImplementation(({ data }: any) => Promise.resolve({ id: "e1", ...data }));
  (prismadb.$transaction as jest.Mock).mockImplementation((callback: any) => callback(tx));
});

describe("studio project expense lifecycle", () => {
  it("stores a positive project expense as submitted in the project's currency", async () => {
    await createStudioProjectExpense({ projectId: "p1", category: "Materials", description: "Paint", amount: "125.50", incurredOn: new Date("2026-11-12T00:00:00Z") });
    expect(prismadb.studioProjectExpense.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      projectId: "p1", category: "Materials", amount: "125.5", currency: "INR", submittedBy: "u1",
    }) });
  });

  it("permits a manager to approve only a submitted cost", async () => {
    await reviewStudioProjectExpense("e1", "APPROVED");
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.studioProjectExpense.update).toHaveBeenCalledWith({ where: { id: "e1" }, data: expect.objectContaining({ status: "APPROVED", approvedBy: "m1" }) });
  });

  it("does not allow marking an unapproved cost as paid", async () => {
    tx.studioProjectExpense.findUnique.mockResolvedValueOnce({ id: "e1", status: "SUBMITTED", projectId: "p1" });
    await expect(markStudioProjectExpensePaid("e1", "cash-1", "UTR-1")).rejects.toThrow("This expense must be reviewed by an admin before payment");
    expect(tx.studioProjectExpense.update).not.toHaveBeenCalled();
  });

  it("requires manager authorization to review costs", async () => {
    const { AuthorizationError } = jest.requireMock("@/lib/authz");
    (requireRole as jest.Mock).mockRejectedValueOnce(new AuthorizationError());
    await expect(reviewStudioProjectExpense("e1", "APPROVED")).rejects.toThrow("Manager access is required");
    expect(prismadb.$transaction).not.toHaveBeenCalled();
  });

  it("does not allow external partner users to submit internal project costs", async () => {
    (requireAuthenticated as jest.Mock).mockResolvedValueOnce({ id: "partner-1", role: "partner" });
    await expect(createStudioProjectExpense({ projectId: "p1", category: "Materials", description: "Paint", amount: "125.50", incurredOn: new Date("2026-11-12T00:00:00Z") })).rejects.toThrow("External partner users cannot submit internal project costs");
    expect(prismadb.studioProjectExpense.create).not.toHaveBeenCalled();
  });
});
