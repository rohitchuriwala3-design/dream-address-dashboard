jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn() },
    crm_Accounts: { findFirst: jest.fn() },
    invoice_TaxRates: { findMany: jest.fn().mockResolvedValue([]) },
    studioProject: { findFirst: jest.fn() },
    invoices: { create: jest.fn() },
  },
}));

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { createInvoice } from "../create-invoice";

const gs = getSession as jest.MockedFunction<typeof getSession>;
const fu = prismadb.users.findUnique as jest.MockedFunction<typeof prismadb.users.findUnique>;
const fa = prismadb.crm_Accounts.findFirst as jest.MockedFunction<typeof prismadb.crm_Accounts.findFirst>;
const ci = prismadb.invoices.create as jest.MockedFunction<typeof prismadb.invoices.create>;

const ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";
const validInput = {
  type: "INVOICE",
  accountId: ACCOUNT_ID,
  currency: "INR",
  lineItems: [
    { position: 0, description: "x", quantity: 1, unitPrice: 100, discountPercent: 0 },
  ],
};

beforeEach(() => jest.clearAllMocks());

describe("createInvoice account-scope", () => {
  it("throws when user has no access to accountId", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fa.mockResolvedValue(null);
    await expect(createInvoice(validInput)).rejects.toThrow(/forbidden/i);
    expect(ci).not.toHaveBeenCalled();
  });

  it("succeeds for user owning the account", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fa.mockResolvedValue({ id: ACCOUNT_ID } as any);
    ci.mockResolvedValue({ id: "new" } as any);
    await createInvoice(validInput);
    expect(ci).toHaveBeenCalledTimes(1);
  });

  it("manager can create against any account", async () => {
    gs.mockResolvedValue({ user: { id: "m" } } as any);
    fu.mockResolvedValue({ id: "m", role: "manager" } as any);
    fa.mockResolvedValue({ id: ACCOUNT_ID } as any);
    ci.mockResolvedValue({ id: "new" } as any);
    await createInvoice(validInput);
    expect(ci).toHaveBeenCalled();
  });

  it("rejects an invoice project that belongs to a different account", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "manager" } as any);
    fa.mockResolvedValue({ id: ACCOUNT_ID } as any);
    (prismadb.studioProject.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(createInvoice({ ...validInput, studioProjectId: "22222222-2222-4222-8222-222222222222" }))
      .rejects.toThrow(/project not found or does not belong/i);
    expect(ci).not.toHaveBeenCalled();
  });

  it("persists an authorized project link on the invoice", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "manager" } as any);
    fa.mockResolvedValue({ id: ACCOUNT_ID } as any);
    (prismadb.studioProject.findFirst as jest.Mock).mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222" });
    ci.mockResolvedValue({ id: "new" } as any);
    await createInvoice({ ...validInput, studioProjectId: "22222222-2222-4222-8222-222222222222" });
    expect(ci).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ studioProjectId: "22222222-2222-4222-8222-222222222222" }),
    }));
  });
});
