import { prismadb } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";
import {
  requireAuthenticated,
  opportunityReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";

// Sum over the opportunities the caller can read.
export const getExpectedRevenue = async (_displayCurrency: string) => {
  let user;
  try {
    user = await requireAuthenticated({ partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return 0;
    throw e;
  }
  const activeOpportunities = await prismadb.crm_Opportunities.findMany({
    where: {
      status: "ACTIVE",
      currency: "INR",
      ...opportunityReadScopeWhere(user),
    },
    select: {
      budget: true,
      currency: true,
    },
  });

  let total = new Decimal(0);
  for (const opp of activeOpportunities) {
    total = total.add(new Decimal(opp.budget?.toString() ?? "0"));
  }

  return total.toNumber();
};
