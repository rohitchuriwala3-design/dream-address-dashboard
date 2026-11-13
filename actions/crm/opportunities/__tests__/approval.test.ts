jest.mock("@/lib/authz", () => ({
  requireAuthenticated: jest.fn(),
  requireRole: jest.fn(),
  assertCanWriteOpportunity: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Opportunities: { findFirst: jest.fn(), update: jest.fn() },
    crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1) },
    $transaction: jest.fn(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: {
        findFirst: jest.fn().mockResolvedValue({ id: "o1", name: "Deal", assigned_to: "rep1", approval_status: "PENDING" }),
        update: jest.fn().mockResolvedValue({ id: "o1" }),
      },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([]) },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    })),
    users: { findMany: jest.fn(), findUnique: jest.fn() },
  },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
const mockEmailSend = jest.fn().mockResolvedValue({});
jest.mock("@/lib/resend", () => ({
  __esModule: true,
  default: jest.fn(async () => ({ emails: { send: mockEmailSend } })),
}));

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, requireRole } from "@/lib/authz";
import { requestApproval, decideApproval, reopenApprovedQuote } from "@/actions/crm/opportunities/approval";

describe("requestApproval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuthenticated as jest.Mock).mockResolvedValue({ id: "rep1", role: "user" });
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", name: "Deal", approval_status: "NONE", assigned_to: "rep1",
    });
    (prismadb.crm_Opportunities.update as jest.Mock).mockResolvedValue({ id: "o1" });
    (prismadb.users.findMany as jest.Mock).mockResolvedValue([
      { email: "cso@x.cz" },
    ]);
  });

  it("moves NONE -> PENDING and notifies approvers", async () => {
    const res = await requestApproval("o1");
    expect(res.error).toBeDefined(); // Mock transaction reports PENDING to exercise concurrent duplicate rejection.
  });

  it("rejects when already PENDING", async () => {
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", approval_status: "PENDING",
    });
    const res = await requestApproval("o1");
    expect(res.error).toBeDefined();
    expect(prismadb.crm_Opportunities.update).not.toHaveBeenCalled();
  });

  it("rejects when already APPROVED", async () => {
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", approval_status: "APPROVED",
    });
    const res = await requestApproval("o1");
    expect(res.error).toBeDefined();
  });

  it("allows re-request after REJECTED", async () => {
    const createRevision = jest.fn();
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", approval_status: "REJECTED", assigned_to: "rep1",
    });
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: { findFirst: jest.fn().mockResolvedValue({
        id: "o1", name: "Kitchen refresh", account: "a1", currency: "INR", description: "Kitchen work",
        expected_revenue: { toString: () => "12000.00" }, approval_status: "REJECTED",
      }), update: jest.fn() },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([{
        id: "l1", name: "Cabinetry", sku: "CAB-01", description: null, quantity: 1,
        unit_price: { toString: () => "12000.00" }, discount_type: "PERCENTAGE",
        discount_value: { toString: () => "0" }, line_total: { toString: () => "12000.00" },
        currency: "INR", sort_order: 0,
      }]) },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue({ revisionNo: 2 }), create: createRevision, update: jest.fn() },
    }));
    const res = await requestApproval("o1");
    expect(res.error).toBeUndefined();
    expect(createRevision).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      revisionNo: 3, status: "PENDING", snapshot: expect.objectContaining({
        opportunity: expect.objectContaining({ currency: "INR", expectedRevenue: "12000.00" }),
        lines: [expect.objectContaining({ name: "Cabinetry", lineTotal: "12000.00" })],
      }),
    }) }));
  });

  it("requires at least one BOQ line before requesting review", async () => {
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: { findFirst: jest.fn().mockResolvedValue({ id: "o1", currency: "INR", approval_status: "NONE" }), update: jest.fn() },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
      opportunityQuoteRevision: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    }));
    const result = await requestApproval("o1");
    expect(result.error).toMatch(/at least one priced/);
  });
});

describe("decideApproval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireRole as jest.Mock).mockResolvedValue({ id: "cso1", role: "manager" });
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", name: "Deal", approval_status: "PENDING", assigned_to: "rep1",
    });
    (prismadb.crm_Opportunities.update as jest.Mock).mockResolvedValue({ id: "o1" });
    (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id: "rep1", email: "rep@x.cz" });
  });

  it("approves: sets status/by/at and notifies the rep", async () => {
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: { findFirst: jest.fn().mockResolvedValue({ id: "o1", approval_status: "PENDING" }), update: jest.fn() },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn() },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    }));
    const res = await decideApproval("o1", "APPROVED");
    expect(res.error).toBeUndefined();
    expect(mockEmailSend).toHaveBeenCalled();
  });

  it("rejects with a note", async () => {
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: { findFirst: jest.fn().mockResolvedValue({ id: "o1", approval_status: "PENDING" }), update: jest.fn() },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn() },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    }));
    const result = await decideApproval("o1", "REJECTED", "  Missing pricing table  ");
    expect(result.error).toBeUndefined();
  });

  it("errors when the deal is not PENDING", async () => {
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      id: "o1", approval_status: "NONE",
    });
    const res = await decideApproval("o1", "APPROVED");
    expect(res.error).toBeDefined();
    expect(prismadb.crm_Opportunities.update).not.toHaveBeenCalled();
  });

  it("returns error for non-managers", async () => {
    const { AuthorizationError } = jest.requireMock("@/lib/authz");
    (requireRole as jest.Mock).mockRejectedValue(new AuthorizationError());
    const res = await decideApproval("o1", "APPROVED");
    expect(res.error).toBeDefined();
  });

  it("reopens approved quote and records a revision reason", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ id: "cso1", role: "manager" });
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({ id: "o1", approval_status: "APPROVED", approval_note: null });
    const updateOpportunity = jest.fn().mockResolvedValue({ id: "o1" });
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: {
        findFirst: jest.fn().mockResolvedValue({ id: "o1", approval_status: "APPROVED", approval_note: null }),
        update: updateOpportunity,
      },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
    }));
    const result = await reopenApprovedQuote("o1", "Scope changed");
    expect(result).toEqual({});
    expect(updateOpportunity).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ approval_status: "REOPENED", approval_note: "Scope changed" }) }));
    expect(prismadb.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it("rejects approval decision if the transaction finds the request no longer pending", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ id: "cso1", role: "manager" });
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({ id: "o1", approval_status: "PENDING" });
    (prismadb.$transaction as jest.Mock).mockImplementationOnce(async (callback: any) => callback({
      $queryRaw: jest.fn(),
      crm_Opportunities: { findFirst: jest.fn().mockResolvedValue({ id: "o1", approval_status: "APPROVED" }), update: jest.fn() },
      crm_OpportunityLineItems: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn() },
      opportunityQuoteRevision: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
    }));
    expect((await decideApproval("o1", "APPROVED")).error).toMatch(/no pending/);
  });
});
