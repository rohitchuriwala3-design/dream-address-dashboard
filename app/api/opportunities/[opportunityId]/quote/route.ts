import { NextResponse } from "next/server";
import { AuthenticationError, AuthorizationError, assertCanReadOpportunity, requireAuthenticated } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { renderApprovedQuotePdf } from "@/lib/nexus360/quote-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ opportunityId: string }> }) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw error;
  }

  const { opportunityId } = await params;
  try {
    await assertCanReadOpportunity(user, opportunityId);
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    throw error;
  }

  const [opportunity, revision] = await Promise.all([
    prismadb.crm_Opportunities.findFirst({
      where: { id: opportunityId, deletedAt: null, approval_status: "APPROVED" },
      select: { name: true, currency: true, assigned_account: { select: { name: true } } },
    }),
    prismadb.opportunityQuoteRevision.findFirst({
      where: { opportunityId, status: "APPROVED" }, orderBy: { revisionNo: "desc" },
      select: { revisionNo: true, snapshot: true, submittedAt: true, reviewedAt: true },
    }),
  ]);
  if (!opportunity || !revision) {
    return NextResponse.json({ error: "An approved quote revision is required before downloading." }, { status: 404 });
  }
  if (opportunity.currency !== "INR") {
    return NextResponse.json({ error: "This quotation needs an INR review before it can be downloaded." }, { status: 409 });
  }

  const snapshot = revision.snapshot as {
    opportunity?: { currency?: string; expectedRevenue?: string };
    lines?: Array<{ name: string; sku?: string | null; description?: string | null; quantity: number; unitPrice: string; lineTotal: string; currency: string }>;
  };
  const currency = snapshot.opportunity?.currency;
  if (currency !== "INR" || !Array.isArray(snapshot.lines) || snapshot.lines.some((line) => line.currency !== "INR")) {
    return NextResponse.json({ error: "This quotation needs an INR review before it can be downloaded." }, { status: 409 });
  }
  const pdf = await renderApprovedQuotePdf({
    revisionNo: revision.revisionNo,
    submittedAt: revision.submittedAt,
    reviewedAt: revision.reviewedAt,
    opportunityName: opportunity.name || "Interior Design Proposal",
    clientName: opportunity.assigned_account?.name || "Client",
    currency,
    total: snapshot.opportunity?.expectedRevenue || "0",
    lines: Array.isArray(snapshot.lines) ? snapshot.lines : [],
  });

  const safeName = (opportunity.name || "approved-quotation").normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "approved-quotation";
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-r${revision.revisionNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
