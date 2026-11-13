jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    users: { findUnique: jest.fn() },
    nexusUserPermission: { findMany: jest.fn().mockResolvedValue([{ key: "finance.manage" }]) },
    invoices: { findUniqueOrThrow: jest.fn(), create: jest.fn() },
    crm_Accounts: { findFirst: jest.fn() },
  },
}));

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { duplicateInvoice } from "../duplicate-invoice";

const gs = getSession as jest.MockedFunction<typeof getSession>;
const fu = prismadb.users.findUnique as jest.MockedFunction<typeof prismadb.users.findUnique>;
const fi = prismadb.invoices.findUniqueOrThrow as jest.MockedFunction<typeof prismadb.invoices.findUniqueOrThrow>;
const fa = prismadb.crm_Accounts.findFirst as jest.MockedFunction<typeof prismadb.crm_Accounts.findFirst>;
const ci = prismadb.invoices.create as jest.MockedFunction<typeof prismadb.invoices.create>;

beforeEach(() => jest.clearAllMocks());

describe("duplicateInvoice", () => {
  it("throws when unauthenticated", async () => {
    gs.mockResolvedValue(null as any);
    await expect(duplicateInvoice("i1")).rejects.toThrow();
    expect(ci).not.toHaveBeenCalled();
  });

  it("throws when user cannot read source invoice", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fi.mockResolvedValue({ id: "src", createdBy: "other", status: "ISSUED", accountId: "a1", lineItems: [] } as any);
    await expect(duplicateInvoice("i1")).rejects.toThrow(/forbidden/i);
    expect(ci).not.toHaveBeenCalled();
  });

  it("throws when user cannot write the copied accountId", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fi.mockResolvedValue({ id: "src", createdBy: "u", status: "ISSUED", accountId: "a1", lineItems: [] } as any);
    fa.mockResolvedValue(null);
    await expect(duplicateInvoice("i1")).rejects.toThrow(/forbidden/i);
    expect(ci).not.toHaveBeenCalled();
  });

  it("succeeds when both checks pass", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fi.mockResolvedValue({ id: "src", createdBy: "u", status: "ISSUED", accountId: "a1", lineItems: [], type: "INVOICE", currency: "INR", subtotal: "0", discountTotal: "0", vatTotal: "0", grandTotal: "0" } as any);
    fa.mockResolvedValue({ id: "a1" } as any);
    ci.mockResolvedValue({ id: "new" } as any);
    await duplicateInvoice("i1");
    expect(ci).toHaveBeenCalledTimes(1);
  });

  it("creates a zero-tax draft when the source invoice contains legacy tax", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    fi.mockResolvedValue({
      id: "src", createdBy: "u", status: "ISSUED", accountId: "a1", type: "INVOICE", currency: "INR",
      subtotal: "110", discountTotal: "0", vatTotal: "19.8", grandTotal: "129.8", lineItems: [{
        position: 1, productId: null, description: "Design", quantity: "1", unitPrice: "100",
        discountPercent: "0", taxRateId: "legacy-tax", lineSubtotal: "100", lineVat: "18", lineTotal: "118",
      }],
    } as any);
    fa.mockResolvedValue({ id: "a1" } as any);
    ci.mockResolvedValue({ id: "new" } as any);

    await duplicateInvoice("i1");

    const payload = ci.mock.calls[0][0].data as any;
    expect(payload.vatTotal).toBe("0");
    expect(payload.grandTotal).toBe("100");
    expect(payload.balanceDue).toBe("100");
    expect(payload.lineItems.create[0]).toMatchObject({ taxRateId: null, lineVat: "0", lineTotal: "100" });
  });
});
