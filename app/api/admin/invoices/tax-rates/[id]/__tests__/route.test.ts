jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/authz";
import { DELETE, PATCH } from "../route";

const requireAdmin = requireRole as jest.MockedFunction<typeof requireRole>;
const params = { params: Promise.resolve({ id: "legacy-tax-rate" }) };

beforeEach(() => {
  jest.clearAllMocks();
  requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
});

describe("disabled V1 tax-rate item API", () => {
  it("returns 410 for updates and deletes without changing historical rows", async () => {
    const request = new NextRequest("http://localhost/api/admin/invoices/tax-rates/legacy-tax-rate", {
      method: "PATCH",
      body: JSON.stringify({ rate: 18 }),
      headers: { "content-type": "application/json" },
    });
    const patch = await PATCH(request, params);
    const remove = await DELETE(new NextRequest("http://localhost/api/admin/invoices/tax-rates/legacy-tax-rate", { method: "DELETE" }), params);
    expect(patch.status).toBe(410);
    expect(remove.status).toBe(410);
  });
});
