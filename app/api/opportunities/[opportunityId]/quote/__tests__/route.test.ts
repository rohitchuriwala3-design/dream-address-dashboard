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

  it("does not render or download a quote that lacks an approved revision", async () => {
    (prismadb.opportunityQuoteRevision.findFirst as jest.Mock).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/opportunities/o1/quote"), { params });
    expect(response.status).toBe(404);
    expect(renderApprovedQuotePdf).not.toHaveBeenCalled();
  });
});
