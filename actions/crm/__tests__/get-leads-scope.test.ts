jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn,
}));
jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    nexusUserPermission: { findMany: jest.fn().mockResolvedValue([{ key: "crm.manage" }]) },
    users: { findUnique: jest.fn() },
    crm_Leads: { findMany: jest.fn() },
    crm_Activities: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { getLeads } from "@/actions/crm/get-leads";

const mockUser = (role: "user" | "manager" | "admin", id = "u1") => {
  (getSession as jest.Mock).mockResolvedValue({ user: { id } });
  (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id, role });
};

describe("getLeads scope", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unauthenticated returns [] and does not query", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await getLeads();
    expect(res).toEqual([]);
    expect(prismadb.crm_Leads.findMany).not.toHaveBeenCalled();
  });

  it("associate: where includes deletedAt:null and only own/assigned leads", async () => {
    mockUser("user", "u1");
    (prismadb.crm_Leads.findMany as jest.Mock).mockResolvedValue([]);
    await getLeads();
    const call = (prismadb.crm_Leads.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.deletedAt).toBeNull();
    expect(call.where.OR).toEqual([{ assigned_to: "u1" }, { createdBy: "u1" }]);
  });

  it("user role: returns lead rows from findMany", async () => {
    mockUser("user", "u1");
    const rows = [{ id: "l1" }];
    (prismadb.crm_Leads.findMany as jest.Mock).mockResolvedValue(rows);
    const res = await getLeads();
    expect(res).toEqual([{ ...rows[0], nextFollowUp: null, followUpOverdueCount: 0, followUpUpcomingCount: 0 }]);
  });

  it("manager: own records plus configured reporting-tree records", async () => {
    mockUser("manager", "m1");
    (prismadb.crm_Leads.findMany as jest.Mock).mockResolvedValue([]);
    await getLeads();
    const call = (prismadb.crm_Leads.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where).toEqual({ deletedAt: null, OR: [{ assigned_to: "m1" }, { createdBy: "m1" }] });
  });
});
