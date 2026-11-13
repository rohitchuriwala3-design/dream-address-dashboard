import { AuthorizationError } from "../errors";

jest.mock("@/lib/authz/session", () => ({ requireAuthenticated: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: { nexusUserPermission: { findMany: jest.fn() } },
}));

import { requireAuthenticated } from "@/lib/authz/session";
import { prismadb } from "@/lib/prisma";
import { requireAnyPermission, requirePermission } from "../permissions";

const mockedRequireAuthenticated = requireAuthenticated as jest.MockedFunction<typeof requireAuthenticated>;
const mockedFindMany = prismadb.nexusUserPermission.findMany as jest.MockedFunction<
  typeof prismadb.nexusUserPermission.findMany
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequireAuthenticated.mockResolvedValue({ id: "u1", role: "user" });
});

describe("requirePermission", () => {
  it("lets a manage permission satisfy its paired view permission", async () => {
    mockedFindMany.mockResolvedValue([{ key: "crm.manage" }] as any);

    await expect(requirePermission("crm.view")).resolves.toEqual({ id: "u1", role: "user" });
  });

  it("does not let a view permission satisfy its paired manage permission", async () => {
    mockedFindMany.mockResolvedValue([{ key: "crm.view" }] as any);

    await expect(requirePermission("crm.manage")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies a staff user when no module permission is selected", async () => {
    mockedFindMany.mockResolvedValue([] as any);

    await expect(requirePermission("crm.view")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("keeps partner module access dependent on explicit partner opt-in", async () => {
    mockedRequireAuthenticated.mockResolvedValue({ id: "partner-1", role: "partner" });

    await expect(requirePermission("crm.view", { partner: true })).resolves.toEqual({ id: "partner-1", role: "partner" });
    expect(mockedRequireAuthenticated).toHaveBeenCalledWith({ partner: true });
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("lets an admin through without querying per-user permissions", async () => {
    mockedRequireAuthenticated.mockResolvedValue({ id: "admin-1", role: "admin" });

    await expect(requirePermission("finance.manage")).resolves.toEqual({ id: "admin-1", role: "admin" });
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("allows a file read when either the CRM or project permission is granted", async () => {
    mockedFindMany.mockResolvedValue([{ key: "projects.view" }] as any);
    await expect(requireAnyPermission(["crm.view", "projects.view"])).resolves.toEqual({ id: "u1", role: "user" });
  });

  it("denies a file read when neither permitted module is granted", async () => {
    mockedFindMany.mockResolvedValue([] as any);
    await expect(requireAnyPermission(["crm.view", "projects.view"])).rejects.toBeInstanceOf(AuthorizationError);
  });
});
