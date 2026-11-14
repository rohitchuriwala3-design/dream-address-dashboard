jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    nexusUserPermission: { findMany: jest.fn().mockResolvedValue([{ key: "crm.manage" }]) },
    users: { findUnique: jest.fn() },
    crm_Leads: { findFirst: jest.fn() },
    crm_Accounts: { findFirst: jest.fn() },
    crm_Opportunities: { findFirst: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { getLead } from "@/actions/crm/get-lead";

const mockUser = (role: "user" | "manager" | "admin", id = "u1") => {
  (getSession as jest.Mock).mockResolvedValue({ user: { id } });
  (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id, role });
};

describe("getLead scope", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unauthenticated returns null and does not query lead", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await getLead("l1");
    expect(res).toBeNull();
    expect(prismadb.crm_Leads.findFirst).not.toHaveBeenCalled();
  });

  it("user out-of-scope returns null (assert miss)", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await getLead("l1");
    expect(res).toBeNull();
    // only the assert call ran; detail call short-circuited
    expect(prismadb.crm_Leads.findFirst).toHaveBeenCalledTimes(1);
  });

  it("owner returns lead detail", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({ id: "l1", firstName: "Alice" });
    const res = await getLead("l1");
    expect(res).toEqual({ id: "l1", firstName: "Alice", assigned_accounts: null, preClosureOpportunity: null });
    expect(prismadb.crm_Leads.findFirst).toHaveBeenCalledTimes(2);
  });

  it("manager returns lead detail scoped to self and configured reporting tree", async () => {
    mockUser("manager", "m1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({ id: "l1", firstName: "Alice" });
    const res = await getLead("l1");
    expect(res).toEqual({ id: "l1", firstName: "Alice", assigned_accounts: null, preClosureOpportunity: null });
    const assertCall = (prismadb.crm_Leads.findFirst as jest.Mock).mock.calls[0][0];
    expect(assertCall.where.OR).toEqual([{ assigned_to: "m1" }, { createdBy: "m1" }]);
  });

  it("does not reveal an out-of-scope linked account or opportunity on an otherwise visible lead", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: "l1" })
      .mockResolvedValueOnce({
        id: "l1",
        assigned_accounts: { id: "a-peer", name: "Peer private account" },
        preClosureOpportunity: { id: "o-peer", name: "Peer private opportunity", budget: 0, expected_revenue: 0 },
      });
    (prismadb.crm_Accounts.findFirst as jest.Mock).mockResolvedValue(null);
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue(null);
    const result = await getLead("l1");
    expect(result).toMatchObject({ id: "l1", assigned_accounts: null, preClosureOpportunity: null });
  });
});
