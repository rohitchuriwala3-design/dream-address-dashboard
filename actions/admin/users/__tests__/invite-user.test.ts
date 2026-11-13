jest.mock("@/lib/auth", () => ({ auth: { api: { createUser: jest.fn() } } }));
jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn() },
    nexusUserPermission: { createMany: jest.fn() },
  },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { inviteUser } from "../invite-user";

const createUser = auth.api.createUser as jest.MockedFunction<typeof auth.api.createUser>;
const requireAdmin = requireRole as jest.MockedFunction<typeof requireRole>;
const findByEmail = prismadb.users.findUnique as jest.MockedFunction<typeof prismadb.users.findUnique>;
const createPermissions = prismadb.nexusUserPermission.createMany as jest.MockedFunction<typeof prismadb.nexusUserPermission.createMany>;

const input = {
  name: "Studio User",
  email: "staff@example.com",
  password: "A-long-enough-test-password",
  role: "manager" as const,
  language: "en",
  permissions: ["projects.view"],
};

beforeEach(() => {
  jest.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
  findByEmail.mockResolvedValue(null);
  createUser.mockResolvedValue({ user: { id: "staff-1" } } as never);
  createPermissions.mockResolvedValue({ count: 1 });
});

describe("inviteUser", () => {
  it("creates an active profile through the admin-authorized server action", async () => {
    await expect(inviteUser(input)).resolves.toEqual({ data: { id: "staff-1" } });

    expect(createUser).toHaveBeenCalledWith({ body: {
      name: "Studio User",
      email: "staff@example.com",
      password: input.password,
      role: "manager",
      data: { userStatus: "ACTIVE", userLanguage: "en" },
    } });
    expect(createPermissions).toHaveBeenCalledWith({ data: [{ userId: "staff-1", key: "projects.view" }] });
    expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "user", entityId: "staff-1", action: "created", userId: "admin-1",
    }));
  });

  it("does not call Better Auth when the address already belongs to a profile", async () => {
    findByEmail.mockResolvedValue({ id: "existing" } as never);

    await expect(inviteUser(input)).resolves.toEqual({ error: "A profile with this email already exists." });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("accepts the requested eight-character temporary password on staging", async () => {
    await expect(inviteUser({ ...input, password: "12345678" })).resolves.toEqual({ data: { id: "staff-1" } });
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ password: "12345678" }) }));
  });

  it("does not report profile creation as failed when permission persistence fails afterward", async () => {
    createPermissions.mockRejectedValueOnce(new Error("permission store unavailable"));

    await expect(inviteUser(input)).resolves.toEqual({
      data: { id: "staff-1" },
      warning: "Profile created, but some selected permissions may not have saved. Review the profile before sharing its login.",
    });
  });
});
