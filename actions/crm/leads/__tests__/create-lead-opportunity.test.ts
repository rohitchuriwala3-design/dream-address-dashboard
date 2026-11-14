jest.mock("@/lib/authz", () => ({
  requirePermission: jest.fn(),
  assertCanWriteLead: jest.fn(),
  assertCanWriteAccount: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  PARTNER_EDIT: { partnerEdit: true },
}));
jest.mock("@/lib/prisma", () => ({ prismadb: { $transaction: jest.fn() } }));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("@/lib/crm/stage-transition", () => ({ handleStageTransition: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { requirePermission, assertCanWriteLead } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { handleStageTransition } from "@/lib/crm/stage-transition";
import { createLeadOpportunity } from "../create-lead-opportunity";

const tx = {
  $queryRaw: jest.fn(),
  crm_Leads: { findFirst: jest.fn() },
  crm_Opportunities: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
  crm_Opportunities_Sales_Stages: { findFirst: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requirePermission as jest.Mock).mockResolvedValue({ id: "admin-1", role: "admin" });
  (assertCanWriteLead as jest.Mock).mockResolvedValue(undefined);
  tx.crm_Leads.findFirst.mockResolvedValue({
    id: "lead-1", firstName: "Asha", lastName: "Sharma", company: "Sharma Residence",
    description: "Turnkey interior design and execution", assigned_to: null, accountsIDs: null,
    convertedAt: null, convertedOpportunityId: null, preClosureOpportunity: null,
  });
  tx.crm_Opportunities_Sales_Stages.findFirst.mockResolvedValue({ id: "stage-1" });
  tx.crm_Opportunities.create.mockResolvedValue({ id: "opp-1", sales_stage: "stage-1", currency: "INR", budget: 0, expected_revenue: 0 });
  (prismadb.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
});

describe("createLeadOpportunity", () => {
  it("starts a pre-closure job opportunity without creating an Account", async () => {
    const result = await createLeadOpportunity("lead-1");
    expect(result).toMatchObject({ created: true, opportunity: { id: "opp-1" } });
    expect(tx.crm_Opportunities.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        sourceLeadId: "lead-1", account: undefined, status: "ACTIVE", currency: "INR", sales_stage: "stage-1",
      }),
    }));
    expect(handleStageTransition).toHaveBeenCalled();
  });

  it("refuses to start another opportunity for a converted lead", async () => {
    tx.crm_Leads.findFirst.mockResolvedValueOnce({
      id: "lead-1", convertedAt: new Date(), convertedOpportunityId: "opp-old", preClosureOpportunity: null,
    });
    await expect(createLeadOpportunity("lead-1")).resolves.toEqual({ error: "This lead is already closed and converted" });
    expect(tx.crm_Opportunities.create).not.toHaveBeenCalled();
  });
});
