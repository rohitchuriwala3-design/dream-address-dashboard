jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/authz";
import { GET, POST } from "../route";

const requireAdmin = requireRole as jest.MockedFunction<typeof requireRole>;

beforeEach(() => {
  jest.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
});

describe("disabled V1 tax-rate API", () => {
  it("returns 401 when unauthenticated", async () => {
    const { AuthenticationError } = jest.requireMock("@/lib/authz");
    requireAdmin.mockRejectedValue(new AuthenticationError());
    expect((await GET()).status).toBe(401);
  });

  it("returns 403 for non-admin", async () => {
    const { AuthorizationError } = jest.requireMock("@/lib/authz");
    requireAdmin.mockRejectedValue(new AuthorizationError());
    expect((await GET()).status).toBe(403);
  });

  it("does not list or create tax rates for administrators", async () => {
    const get = await GET();
    const post = await POST(new NextRequest("http://localhost/api/admin/invoices/tax-rates", {
      method: "POST",
      body: JSON.stringify({ name: "GST", rate: 18 }),
      headers: { "content-type": "application/json" },
    }));
    expect(get.status).toBe(410);
    expect(post.status).toBe(410);
    expect(await post.json()).toEqual({ error: "Tax configuration is disabled in MARK IV V1." });
  });
});
