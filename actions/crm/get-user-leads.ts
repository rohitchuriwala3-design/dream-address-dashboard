import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  AuthenticationError,
  AuthorizationError,
  isUnhandledRole,
} from "@/lib/authz";

// Same rule as getUserOpportunities: a user lists only his own leads,
// managers/admins anyone's, a partner (and any other role) nothing.
export const getUserLeads = async (userId: string) => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  if (user.role === "user" && userId !== user.id) return [];
  if (isUnhandledRole(user)) return [];

  const data = await prismadb.crm_Leads.findMany({
    where: {
      assigned_to: userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
