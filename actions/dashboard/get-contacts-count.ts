import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { contactReadScopeWhere } from "@/lib/authz/scopes/crm";

// Scoped to what the caller can read (no global totals for user/partner).
export const getContactCount = async () => {
  try {
    const user = await requirePermission("crm.view", { partner: true });
    return await prismadb.crm_Contacts.count({ where: contactReadScopeWhere(user) });
  } catch (e) {
    if (e instanceof AuthenticationError) return 0;
    if (e instanceof AuthorizationError) return 0;
    throw e;
  }
};
