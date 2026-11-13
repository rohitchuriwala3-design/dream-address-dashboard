jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth", () => ({ auth: { api: { setUserPassword: jest.fn() } } }));
jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { resetUserPassword } from "../reset-user-password";

const getHeaders = headers as jest.MockedFunction<typeof headers>;
const setUserPassword = auth.api.setUserPassword as jest.MockedFunction<typeof auth.api.setUserPassword>;
const requireAdmin = requireRole as jest.MockedFunction<typeof requireRole>;

beforeEach(() => {
  jest.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
  getHeaders.mockResolvedValue(new Headers({ cookie: "admin-session" }) as never);
  setUserPassword.mockResolvedValue({} as never);
});

describe("resetUserPassword", () => {
  it("requires an administrator and rejects short passwords", async () => {
    await expect(resetUserPassword("staff-1", "short")).resolves.toEqual({ error: "Use a password between 8 and 128 characters." });
    expect(setUserPassword).not.toHaveBeenCalled();
  });

  it("uses the app-authorized admin session to reset the target password", async () => {
    await expect(resetUserPassword("staff-1", "A-temporary-password-123!")).resolves.toEqual({ success: true });
    expect(setUserPassword).toHaveBeenCalledWith({
      body: { userId: "staff-1", newPassword: "A-temporary-password-123!" },
      headers: expect.any(Headers),
    });
  });

  it("does not reset a password when authorization fails", async () => {
    requireAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(resetUserPassword("staff-1", "A-temporary-password-123!")).rejects.toThrow("Forbidden");
    expect(setUserPassword).not.toHaveBeenCalled();
  });
});
