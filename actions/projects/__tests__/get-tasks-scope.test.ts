jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: { nexusUserPermission: { findMany: jest.fn().mockResolvedValue([{ key: "projects.view" }, { key: "projects.manage" }]) },
    users: { findUnique: jest.fn() },
    tasks: { findMany: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { getTasks, getTasksByMonth } from "@/actions/projects/get-tasks";

const mockUser = (role: "user" | "manager" | "admin", id = "u1") => {
  (getSession as jest.Mock).mockResolvedValue({ user: { id } });
  (prismadb.users.findUnique as jest.Mock).mockResolvedValue({ id, role });
};

describe("getTasks scope", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unauthenticated returns []", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const res = await getTasks();
    expect(res).toEqual([]);
    expect(prismadb.tasks.findMany).not.toHaveBeenCalled();
  });

  it("user role: where joins through assigned_section.board_relation OR scope", async () => {
    mockUser("user", "u1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([]);
    await getTasks();
    const call = (prismadb.tasks.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.assigned_section.board_relation).toBeDefined();
    expect(Array.isArray(call.where.assigned_section.board_relation.OR)).toBe(true);
  });

  it("user role: returns tasks", async () => {
    mockUser("user", "u1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([{ id: "t1" }]);
    const res = await getTasks();
    expect(res).toEqual([{ id: "t1" }]);
  });

  it("manager: where uses bare board_relation (no OR)", async () => {
    mockUser("manager", "m1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([]);
    await getTasks();
    const call = (prismadb.tasks.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.assigned_section.board_relation.OR).toBeUndefined();
    expect(call.where.assigned_section.board_relation.deletedAt).toBeNull();
  });

  it("denies the monthly chart without project view access", async () => {
    mockUser("user", "u1");
    (prismadb.nexusUserPermission.findMany as jest.Mock).mockResolvedValueOnce([]);

    await expect(getTasksByMonth()).resolves.toEqual([]);
    expect(prismadb.tasks.findMany).not.toHaveBeenCalled();
  });

  it("aggregates only tasks visible through the caller's board scope", async () => {
    mockUser("user", "u1");
    (prismadb.tasks.findMany as jest.Mock).mockResolvedValue([]);

    await getTasksByMonth();
    const call = (prismadb.tasks.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.assigned_section.board_relation).toMatchObject({ deletedAt: null, OR: expect.any(Array) });
  });
});
