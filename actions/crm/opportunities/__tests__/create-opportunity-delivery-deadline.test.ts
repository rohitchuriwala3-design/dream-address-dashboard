jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
// Permission resolution is mocked here; object-level auth is covered separately.
// authz behavior is covered by the *-scope tests, so pass it through here.
jest.mock("@/lib/authz", () => ({
  requireAuthenticated: jest.fn(),
  requirePermission: jest.fn(),
  assertCanWriteAccount: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Opportunities: { create: jest.fn() },
    users: { findFirst: jest.fn() },
  },
}));
jest.mock("@/lib/sendmail", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/inngest/client", () => ({
  inngest: { send: jest.fn().mockResolvedValue({}) },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("@/lib/currency", () => ({
  getDefaultCurrency: jest.fn().mockResolvedValue("INR"),
  getSnapshotRate: jest.fn().mockResolvedValue(null),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { requireAuthenticated, requirePermission, assertCanWriteAccount } from "@/lib/authz";
import { createOpportunity } from "@/actions/crm/opportunities/create-opportunity";

describe("createOpportunity delivery_deadline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    (requireAuthenticated as jest.Mock).mockResolvedValue({ id: "u1", role: "admin" });
    (requirePermission as jest.Mock).mockResolvedValue({ id: "u1", role: "admin" });
    (assertCanWriteAccount as jest.Mock).mockResolvedValue(undefined);
    (prismadb.crm_Opportunities.create as jest.Mock).mockResolvedValue({ id: "opp-1" });
  });

  it("persists delivery_deadline when provided", async () => {
    const deadline = new Date("2026-09-30");
    await createOpportunity({ name: "Deal", delivery_deadline: deadline });
    const data = (prismadb.crm_Opportunities.create as jest.Mock).mock.calls[0][0].data;
    expect(data.delivery_deadline).toEqual(deadline);
  });

  it("omits delivery_deadline when not provided", async () => {
    await createOpportunity({ name: "Deal" });
    const data = (prismadb.crm_Opportunities.create as jest.Mock).mock.calls[0][0].data;
    expect(data.delivery_deadline).toBeUndefined();
  });

  it("stores new opportunities in INR regardless of the configured fallback", async () => {
    await createOpportunity({ name: "Deal" });
    const data = (prismadb.crm_Opportunities.create as jest.Mock).mock.calls[0][0].data;
    expect(data.currency).toBe("INR");
    expect(data.snapshot_rate).toBe(1);
  });

  it("rejects a foreign currency before writing", async () => {
    const result = await createOpportunity({ name: "Deal", currency: "AAA" });
    expect(result).toEqual({ error: "MARK IV V1 supports INR only" });
    expect(prismadb.crm_Opportunities.create).not.toHaveBeenCalled();
  });
});
