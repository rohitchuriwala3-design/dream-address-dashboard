jest.mock("@/lib/authz", () => ({
  requireAuthenticated: jest.fn(),
  requirePermission: jest.fn(),
  accountReadScopeWhere: jest.fn(() => ({ deletedAt: null })),
  assertCanWriteAccount: jest.fn(),
  assertCanWriteOpportunity: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  PARTNER_EDIT: { partnerEdit: true },
}));
jest.mock("@/lib/authz/scopes/crm", () => ({ opportunityReadScopeWhere: jest.fn(() => ({ deletedAt: null })) }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Opportunities: { findFirst: jest.fn() },
    studioProject: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));

import { requireAuthenticated, requirePermission } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { createStudioProject } from "../service";

const tx = {
  $queryRaw: jest.fn(),
  studioProject: { findUnique: jest.fn(), create: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAuthenticated as jest.Mock).mockResolvedValue({ id: "user-1", role: "admin" });
  (requirePermission as jest.Mock).mockImplementation(() => (requireAuthenticated as jest.Mock)());
  (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
    id: "opp-1", account: "account-1", assigned_to: "user-1", name: "Design opportunity", currency: "INR",
  });
  (prismadb.studioProject.findUnique as jest.Mock).mockResolvedValue(null);
  tx.studioProject.findUnique.mockResolvedValue(null);
  tx.studioProject.create.mockResolvedValue({ id: "project-1" });
  (prismadb.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
});

describe("createStudioProject", () => {
  it("creates a client-linked INR project with an ordered delivery checklist", async () => {
    const result = await createStudioProject({
      opportunityId: "opp-1",
      name: "Sharma Residence",
      siteAddress: "Kolkata",
      floorAreaSqFt: "1450.50",
      scopeOfWork: "Turnkey interior",
      contractValue: "1200000.00",
    });

    expect(result).toEqual({ projectId: "project-1", alreadyExists: false });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    const data = tx.studioProject.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      name: "Sharma Residence", accountId: "account-1", opportunityId: "opp-1",
      siteAddress: "Kolkata", floorAreaSqFt: "1450.5", contractValue: "1200000",
      currency: "INR", projectManagerId: "user-1",
    });
    expect(data.milestones.create.map((item: { sortOrder: number }) => item.sortOrder)).toEqual([10, 20, 30, 40, 50]);
  });

  it("returns an existing project for a repeated activation", async () => {
    (prismadb.studioProject.findUnique as jest.Mock).mockResolvedValue({ id: "project-existing" });
    await expect(createStudioProject({ opportunityId: "opp-1", name: "Repeat" })).resolves.toEqual({
      projectId: "project-existing", alreadyExists: true,
    });
    expect(prismadb.$transaction).not.toHaveBeenCalled();
  });

  it("rejects opportunities without a linked client account", async () => {
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({ id: "opp-1", account: null });
    await expect(createStudioProject({ opportunityId: "opp-1", name: "No client" })).rejects.toThrow(
      "An active opportunity linked to a client is required",
    );
    expect(prismadb.$transaction).not.toHaveBeenCalled();
  });
});
