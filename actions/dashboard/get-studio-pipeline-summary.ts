import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { opportunityReadScopeWhere } from "@/lib/authz/scopes/crm";
import { Decimal } from "decimal.js";

/** Forecast only explicitly denominated in INR; no guessed FX conversion. */
export async function getStudioPipelineSummary() {
  try {
    const user = await requireAuthenticated({ partner: true });
    const opportunities = await prismadb.crm_Opportunities.findMany({
      where: {
        status: "ACTIVE",
        currency: "INR",
        ...opportunityReadScopeWhere(user),
      },
      select: { expected_revenue: true },
    });
    return opportunities.reduce(
      (total, opportunity) => total.add(opportunity.expected_revenue.toString()),
      new Decimal(0),
    ).toString();
  } catch (error) {
    if (error instanceof AuthenticationError) return "0";
    throw error;
  }
}
