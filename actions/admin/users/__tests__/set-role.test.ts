jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/authz", () => ({
  APP_ROLES: ["user", "manager", "admin", "partner"],
  requireRole: jest.fn(),
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn(), count: jest.fn(), update: jest.fn() },
    crm_Accounts: { findMany: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";
import { prismadb } from "@/lib/prisma";
import { setUserRole } from "../set-role";

const requireAdmin = requireRole as jest.MockedFunction<typeof requireRole>;
const findUser = prismadb.users.findUnique as jest.MockedFunction<typeof prismadb.users.findUnique>;
const countUsers = prismadb.users.count as jest.MockedFunction<typeof prismadb.users.count>;
const updateUser = prismadb.users.update as jest.MockedFunction<typeof prismadb.users.update>;

beforeEach(() => {
  jest.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
  findUser.mockResolvedValue({ role: "user", partnerAccountId: null } as never);
  countUsers.mockResolvedValue(2);
  updateUser.mockResolvedValue({ id: "staff-1", role: "manager" } as never);
  (prismadb.$transaction as jest.Mock).mockImplementation((callback: any) => callback(prismadb));
});

describe("setUserRole", () => {
  it("rejects missing and non-admin sessions", async () => {
    requireAdmin.mockRejectedValueOnce(new Error("Unauthorized"));
    await expect(setUserRole("staff-1", "manager")).resolves.toEqual({ error: "Unauthorized" });
    const { AuthorizationError } = jest.requireMock("@/lib/authz");
    requireAdmin.mockRejectedValueOnce(new AuthorizationError());
    await expect(setUserRole("staff-1", "manager")).resolves.toEqual({ error: "Forbidden" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("lets an administrator change another profile's role and audits the change", async () => {
    await expect(setUserRole("staff-1", "manager")).resolves.toMatchObject({ data: { role: "manager" } });
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "staff-1" }, data: { role: "manager" } }));
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "user", entityId: "staff-1", changes: [{ field: "role", old: "user", new: "manager" }], userId: "admin-1",
    }));
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]/(routes)/admin/users", "page");
  });

  it("prevents an administrator from demoting their own account", async () => {
    await expect(setUserRole("admin-1", "user")).resolves.toEqual({ error: "Cannot remove your own admin role" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("prevents demoting the last active administrator", async () => {
    findUser.mockResolvedValueOnce({ role: "admin", partnerAccountId: null } as never);
    countUsers.mockResolvedValueOnce(1);
    await expect(setUserRole("staff-1", "manager")).resolves.toEqual({ error: "At least one active administrator must remain." });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects unknown users and roles without updating data", async () => {
    findUser.mockResolvedValueOnce(null);
    await expect(setUserRole("missing", "manager")).resolves.toEqual({ error: "Profile not found" });
    await expect(setUserRole("staff-1", "owner" as never)).resolves.toEqual({ error: "Invalid role" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("allows assigning the Partner role", async () => {
    updateUser.mockResolvedValueOnce({ id: "staff-1", role: "partner" } as never);
    await expect(setUserRole("staff-1", "partner")).resolves.toMatchObject({ data: { role: "partner" } });
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ data: { role: "partner" } }));
  });

  it("clears partner account links atomically and audits them when leaving Partner", async () => {
    findUser.mockResolvedValueOnce({ role: "partner", partnerAccountId: "own-account" } as never);
    (prismadb.crm_Accounts.findMany as jest.Mock).mockResolvedValue([{ id: "linked-account" }]);
    updateUser.mockResolvedValueOnce({ id: "staff-1", role: "user" } as never);
    await expect(setUserRole("staff-1", "user")).resolves.toMatchObject({ data: { role: "user" } });
    expect(prismadb.$transaction).toHaveBeenCalledTimes(1);
    expect(prismadb.crm_Accounts.updateMany).toHaveBeenCalledWith({
      where: { partnerUserId: "staff-1" }, data: { partnerUserId: null, updatedBy: "admin-1" },
    });
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ data: { role: "user", partnerAccountId: null } }));
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "user", entityId: "staff-1", changes: [
        { field: "role", old: "partner", new: "user" },
        { field: "partnerAccountId", old: "own-account", new: null },
      ],
    }));
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "account", entityId: "linked-account",
      changes: [{ field: "partnerUserId", old: "staff-1", new: null }],
    }));
  });

  it("does not clear partner links for a role change unrelated to Partner", async () => {
    await setUserRole("staff-1", "manager");
    expect(prismadb.$transaction).not.toHaveBeenCalled();
    expect(prismadb.crm_Accounts.updateMany).not.toHaveBeenCalled();
  });
});
