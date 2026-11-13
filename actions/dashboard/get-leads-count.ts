import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { leadReadScopeWhere } from "@/lib/authz/scopes/crm";

// Scoped to what the caller can read (no global totals for user/partner).
export const getLeadsCount = async () => {
  try {
    const user = await requirePermission("crm.view", { partner: true });
    return await prismadb.crm_Leads.count({ where: leadReadScopeWhere(user) });
  } catch (e) {
    if (e instanceof AuthenticationError) return 0;
    if (e instanceof AuthorizationError) return 0;
    throw e;
  }
};
