import { AuthenticationError, AuthorizationError } from "../errors";

jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: { users: { findUnique: jest.fn() }, $queryRaw: jest.fn().mockResolvedValue([]) },
}));

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  requireRole,
  isAdmin,
  isManagerOrAdmin,
} from "../session";

const mockedGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockedFindUnique = prismadb.users.findUnique as jest.MockedFunction<
  typeof prismadb.users.findUnique
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireAuthenticated", () => {
  it("throws AuthenticationError when no session", async () => {
    mockedGetSession.mockResolvedValue(null as any);
    await expect(requireAuthenticated()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws AuthenticationError when DB user missing", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue(null as any);
    await expect(requireAuthenticated()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("returns AuthzUser from DB role", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "manager" } as any);
    await expect(requireAuthenticated()).resolves.toMatchObject({ id: "u1", role: "manager", crmRecordScope: "REPORTING_TREE", reportingTreeIds: [] });
  });

  it("falls back to user when DB role is unrecognized", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "garbage" } as any);
    await expect(requireAuthenticated()).resolves.toMatchObject({ id: "u1", role: "user", crmRecordScope: "ASSIGNED" });
  });

  it("manager designation keeps reporting-tree scope even when a direct module grant has the default ASSIGNED scope", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "m1" } } as any);
    mockedFindUnique.mockResolvedValue({
      id: "m1", role: "manager", accessLevelId: "level-manager", reportsToId: null,
      accessLevel: { slug: "manager", permissions: [] },
      permissions: [{ key: "crm.view", scope: "ASSIGNED" }],
    } as any);
    (prismadb.$queryRaw as jest.Mock).mockResolvedValue([{ id: "a1" }, { id: "sa1" }]);
    await expect(requireAuthenticated()).resolves.toMatchObject({
      id: "m1", crmRecordScope: "REPORTING_TREE", reportingTreeIds: ["a1", "sa1"],
    });
  });
});

describe("requireRole", () => {
  it("a partner passes no internal-role gate (admin pages, user-level actions)", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "p1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "p1", role: "partner" } as any);
    // Refused before the role check: partners are signed out unless opted in.
    await expect(requireAuthenticated()).rejects.toBeInstanceOf(AuthenticationError);
    await expect(requireAuthenticated({ partner: true })).resolves.toMatchObject({ id: "p1", role: "partner" });
    await expect(requireRole(["admin"])).rejects.toBeInstanceOf(AuthenticationError);
    await expect(requireRole(["user", "manager", "admin"])).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });

  it("throws AuthorizationError when role not allowed", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "user" } as any);
    await expect(requireRole(["admin"])).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("returns the user when role is allowed", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "admin" } as any);
    await expect(requireRole(["admin"])).resolves.toMatchObject({ id: "u1", role: "admin", crmRecordScope: "COMPANY" });
  });

  it("admin satisfies any allowed list (when explicitly listed)", async () => {
    mockedGetSession.mockResolvedValue({ user: { id: "u1" } } as any);
    mockedFindUnique.mockResolvedValue({ id: "u1", role: "admin" } as any);
    await expect(requireRole(["manager", "admin"])).resolves.toMatchObject({ id: "u1", role: "admin", crmRecordScope: "COMPANY" });
  });
});

describe("role predicates", () => {
  it("isAdmin only true for admin", () => {
    expect(isAdmin({ id: "1", role: "admin" })).toBe(true);
    expect(isAdmin({ id: "1", role: "manager" })).toBe(false);
    expect(isAdmin({ id: "1", role: "user" })).toBe(false);
  });

  it("isManagerOrAdmin true for manager and admin", () => {
    expect(isManagerOrAdmin({ id: "1", role: "manager" })).toBe(true);
    expect(isManagerOrAdmin({ id: "1", role: "admin" })).toBe(true);
    expect(isManagerOrAdmin({ id: "1", role: "user" })).toBe(false);
  });
});
