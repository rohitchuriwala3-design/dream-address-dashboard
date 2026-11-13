jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    invoice_Settings: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
  },
}));

import { requireRole, AuthenticationError } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { saveBusinessProfile, type BusinessProfileInput } from "../save-business-profile";

const input: BusinessProfileInput = {
  companyName: "Rainbow Space Studio — TEST",
  companyAddress: "TEST ADDRESS — NOT A REAL BUSINESS",
  companyCity: "Kolkata (TEST)",
  companyZip: "000000",
  companyCountry: "India",
  companyRegNo: "",
  companyEmail: "test@example.com",
  companyPhone: "",
  companyWebsite: "https://example.com",
};

describe("saveBusinessProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireRole as jest.Mock).mockResolvedValue({ id: "admin-1", role: "admin" });
    (prismadb.invoice_Settings.findFirst as jest.Mock).mockResolvedValue({ id: "settings-1" });
    (prismadb.invoice_Settings.update as jest.Mock).mockResolvedValue({ id: "settings-1" });
    (prismadb.invoice_Settings.create as jest.Mock).mockResolvedValue({ id: "settings-1" });
  });

  it("updates the shared profile fields on the existing settings record", async () => {
    await expect(saveBusinessProfile(input)).resolves.toEqual({ ok: true });
    expect(prismadb.invoice_Settings.update).toHaveBeenCalledWith({
      where: { id: "settings-1" },
      data: expect.objectContaining({
        companyName: input.companyName,
        companyAddress: input.companyAddress,
        companyEmail: input.companyEmail,
        companyPhone: null,
      }),
    });
    expect(prismadb.invoice_Settings.create).not.toHaveBeenCalled();
  });

  it("creates the first shared profile with V1 India defaults", async () => {
    (prismadb.invoice_Settings.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(saveBusinessProfile(input)).resolves.toEqual({ ok: true });
    expect(prismadb.invoice_Settings.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ baseCurrency: "INR", defaultDueDays: 14, defaultTaxRateId: null, companyName: input.companyName }),
    });
  });

  it("validates required identity fields and blocks non-admins", async () => {
    await expect(saveBusinessProfile({ ...input, companyName: " " })).resolves.toMatchObject({ ok: false, fieldErrors: { companyName: expect.any(String) } });
    expect(prismadb.invoice_Settings.findFirst).not.toHaveBeenCalled();
    (requireRole as jest.Mock).mockRejectedValue(new AuthenticationError("no session"));
    await expect(saveBusinessProfile(input)).resolves.toEqual({ ok: false, error: "Unauthorized" });
  });
});
