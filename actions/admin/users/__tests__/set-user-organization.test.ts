jest.mock("@/lib/authz", () => {
  class AuthenticationError extends Error {}
  class AuthorizationError extends Error {}
  return { requireRole: jest.fn(), AuthenticationError, AuthorizationError };
});
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn(), update: jest.fn() },
    nexusAccessLevel: { findFirst: jest.fn(), findUnique: jest.fn() },
    $queryRaw: jest.fn(),
  },
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { prismadb } from "@/lib/prisma";
import { AuthenticationError, requireRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";
import { setUserOrganization } from "../set-user-organization";

const db = prismadb as unknown as Record<string, any>;

beforeEach(() => {
  jest.clearAllMocks();
  (requireRole as jest.Mock).mockResolvedValue({ id: "admin-1", role: "admin" });
  db.users.findUnique
    .mockResolvedValueOnce({ id: "staff-1", role: "user", accessLevelId: null, reportsToId: null });
  db.nexusAccessLevel.findFirst.mockResolvedValue({ id: "associate", name: "Associate", rank: 10 });
  db.users.update.mockResolvedValue({ id: "staff-1" });
  (writeAuditLog as jest.Mock).mockResolvedValue(undefined);
});

it("saves and audits a designation and reporting manager", async () => {
  const result = await setUserOrganization("staff-1", "associate", null);
  expect(result).toMatchObject({ success: true, designation: "Associate", reportsTo: null });
  expect(db.users.update).toHaveBeenCalledWith({
    where: { id: "staff-1" },
    data: { accessLevelId: "associate", reportsToId: null },
  });
  expect(writeAuditLog).toHaveBeenCalledWith(expect.objectContaining({ entityType: "user", entityId: "staff-1" }));
});

it("does not save if the caller lacks admin access", async () => {
  (requireRole as jest.Mock).mockRejectedValue(new AuthenticationError("not authorized"));
  await expect(setUserOrganization("staff-1", "associate", null)).resolves.toEqual({ error: "Unauthorized" });
  expect(db.users.update).not.toHaveBeenCalled();
});
