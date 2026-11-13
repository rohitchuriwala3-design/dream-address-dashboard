jest.mock("@/lib/authz", () => ({
  requirePermission: jest.fn(),
  assertCanReadOpportunity: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Opportunities: { findFirst: jest.fn() },
    opportunityQuoteRevision: { findFirst: jest.fn() },
    invoice_Settings: { findFirst: jest.fn() },
  },
}));
jest.mock("@/lib/nexus360/quote-pdf", () => ({ renderApprovedQuotePdf: jest.fn() }));

import { requirePermission, assertCanReadOpportunity } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { renderApprovedQuotePdf } from "@/lib/nexus360/quote-pdf";
import { TEST_ISSUER_DEFAULTS } from "@/lib/invoices/test-issuer-defaults";
import { GET } from "../route";

const params = Promise.resolve({ opportunityId: "o1" });

describe("GET approved quotation PDF", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requirePermission as jest.Mock).mockResolvedValue({ id: "u1", role: "manager" });
    (assertCanReadOpportunity as jest.Mock).mockResolvedValue(undefined);
    (prismadb.crm_Opportunities.findFirst as jest.Mock).mockResolvedValue({
      name: "Living room project", currency: "INR", assigned_account: { name: "Sample Client" },
    });
    (prismadb.opportunityQuoteRevision.findFirst as jest.Mock).mockResolvedValue({
      revisionNo: 2, submittedAt: new Date("2026-11-01T00:00:00Z"), reviewedAt: new Date("2026-11-02T00:00:00Z"),
      snapshot: { opportunity: { currency: "INR", expectedRevenue: "12500.00" }, lines: [] },
    });
    (prismadb.invoice_Settings.findFirst as jest.Mock).mockResolvedValue({ companyName: "Impressive Creators" });
    (renderApprovedQuotePdf as jest.Mock).mockResolvedValue(Buffer.from("%PDF-test"));
  });

  it("renders the approved immutable revision as a private downloadable PDF", async () => {
    const response = await GET(new Request("http://localhost/api/opportunities/o1/quote"), { params });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("Living-room-project-r2.pdf");
    expect(renderApprovedQuotePdf).toHaveBeenCalledWith(expect.objectContaining({
      revisionNo: 2, clientName: "Sample Client", total: "12500.00", currency: "INR",
      issuerName: "Impressive Creators",
    }));
    expect(assertCanReadOpportunity).toHaveBeenCalledWith({ id: "u1", role: "manager" }, "o1");
  });

  it("puts the saved shared business contact details on approved quotation PDFs", async () => {
    (prismadb.invoice_Settings.findFirst as jest.Mock).mockResolvedValue({
      companyName: "Rainbow Space Studio — TEST",
      companyAddress: "TEST ADDRESS — NOT A REAL BUSINESS",
      companyCity: "Kolkata (TEST)",
      companyZip: "000000",
      companyCountry: "India",
      companyEmail: "test@example.com",
      companyPhone: "9876543210",
      companyWebsite: "https://example.com",
    });
    const response = await GET(new Request("http://localhost/api/opportunities/o1/quote"), { params });
    expect(response.status).toBe(200);
    expect(renderApprovedQuotePdf).toHaveBeenCalledWith(expect.objectContaining({
      issuerName: "Rainbow Space Studio — TEST",
      issuerDetails: "TEST ADDRESS — NOT A REAL BUSINESS, Kolkata (TEST) 000000, India\ntest@example.com · 9876543210 · https://example.com",
    }));
  });

  it("does not render or download a quote that lacks an approved revision", async () => {
    (prismadb.opportunityQuoteRevision.findFirst as jest.Mock).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/opportunities/o1/quote"), { params });
    expect(response.status).toBe(404);
    expect(renderApprovedQuotePdf).not.toHaveBeenCalled();
  });

  it("uses the fictional test issuer in staging when the saved company name is blank", async () => {
    const previous = process.env.MARK4_TEST_ISSUER;
    process.env.MARK4_TEST_ISSUER = "true";
    (prismadb.invoice_Settings.findFirst as jest.Mock).mockResolvedValue(null);

    try {
      const response = await GET(new Request("http://localhost/api/opportunities/o1/quote"), { params });
      expect(response.status).toBe(200);
      expect(renderApprovedQuotePdf).toHaveBeenCalledWith(expect.objectContaining({
        issuerName: TEST_ISSUER_DEFAULTS.companyName,
      }));
    } finally {
      if (previous === undefined) delete process.env.MARK4_TEST_ISSUER;
      else process.env.MARK4_TEST_ISSUER = previous;
    }
  });
});
